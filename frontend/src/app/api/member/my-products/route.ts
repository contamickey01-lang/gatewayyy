import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const normalizedEmail = (auth.user.email || '').toLowerCase().trim();
    if (normalizedEmail) {
        const { data: paidOrders } = await supabase
            .from('orders')
            .select(`
                id,
                product_id,
                products (
                    type
                )
            `)
            .eq('status', 'paid')
            .ilike('buyer_email', normalizedEmail);

        const enrollmentsToUpsert = (paidOrders || [])
            .filter((o: any) => o?.product_id && o?.products?.type === 'digital')
            .map((o: any) => ({
                user_id: auth.user.id,
                product_id: o.product_id,
                order_id: o.id,
                status: 'active'
            }));

        if (enrollmentsToUpsert.length > 0) {
            await supabase
                .from('enrollments')
                .upsert(enrollmentsToUpsert, { onConflict: 'user_id, product_id' });
        }
    }

    const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
            id,
            status,
            created_at,
            products (
                id,
                name,
                description,
                image_url
            )
        `)
        .eq('user_id', auth.user.id)
        .eq('status', 'active');

    if (error) return jsonError('Erro ao carregar seus produtos');

    const products = enrollments.map((e: any) => ({
        ...e.products,
        enrollment_id: e.id
    }));

    return jsonSuccess({ products });
}
