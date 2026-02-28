export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { comparePassword, generateToken, jsonError, jsonSuccess } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return jsonError('Email e senha são obrigatórios');
        }

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .ilike('email', email.toLowerCase().trim())
            .single();

        if (!user) return jsonError('Credenciais inválidas', 401);
        if (user.status === 'blocked') return jsonError('Conta bloqueada', 403);

        const passwordHash = user.password_hash || user.password;
        if (!passwordHash) return jsonError('Credenciais inválidas', 401);

        const validPassword = await comparePassword(password, passwordHash);
        if (!validPassword) return jsonError('Credenciais inválidas', 401);

        const token = generateToken({ userId: user.id, role: user.role });

        const normalizedEmail = (user.email || '').toLowerCase().trim();
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
                    user_id: user.id,
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

        return jsonSuccess({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Login error:', err);
        return jsonError('Erro interno do servidor', 500);
    }
}
