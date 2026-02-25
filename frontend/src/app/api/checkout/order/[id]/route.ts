import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { jsonError, jsonSuccess, generateToken, hashPassword } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: order } = await supabase
        .from('orders')
        .select('id, status, amount_display, payment_method, created_at, buyer_email, buyer_name, product_id')
        .eq('id', id)
        .single();

    if (!order) return jsonError('Pedido não encontrado', 404);

    const response: any = { order: { id: order.id, status: order.status, amount_display: order.amount_display, payment_method: order.payment_method } };

    // If payment just confirmed (PIX), handle auto-enrollment and return auth token
    if (order.status === 'paid' && order.buyer_email) {
        // Find or create buyer user
        let buyerUser: any = null;
        const { data: existingUser } = await supabase
            .from('users').select('id, name, email, role').eq('email', order.buyer_email.toLowerCase()).single();

        if (existingUser) {
            buyerUser = existingUser;
        } else {
            const newUserId = uuidv4();
            const tempPassword = uuidv4().substring(0, 12);
            const hashedPw = await hashPassword(tempPassword);
            const { data: newUser, error: createErr } = await supabase.from('users').insert({
                id: newUserId,
                email: order.buyer_email.toLowerCase(),
                name: order.buyer_name || 'Estudante',
                role: 'customer',
                password_hash: hashedPw
            }).select('id, name, email, role').single();
            if (!createErr && newUser) buyerUser = newUser;
        }

        if (buyerUser && order.product_id) {
            // Ensure enrollment exists
            await supabase.from('enrollments').upsert({
                user_id: buyerUser.id,
                product_id: order.product_id,
                order_id: order.id,
                status: 'active'
            }, { onConflict: 'user_id, product_id' });

            // Return auth token so the frontend can auto-login
            const token = generateToken({ id: buyerUser.id, email: buyerUser.email, role: buyerUser.role });
            response.auth = {
                token,
                user: { id: buyerUser.id, name: buyerUser.name, email: buyerUser.email, role: buyerUser.role }
            };
        }
    }

    return jsonSuccess(response);
}
