export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { hashPassword, generateToken, jsonError, jsonSuccess } from '@/lib/auth';
import { PagarmeService } from '@/lib/pagarme';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password, cpf_cnpj, phone } = body;

        if (!name || !email || !password || !cpf_cnpj) {
            return jsonError('Nome, email, senha e CPF/CNPJ são obrigatórios');
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .ilike('email', normalizedEmail)
            .single();

        if (existingUser) {
            return jsonError('Email já cadastrado');
        }

        const hashedPassword = await hashPassword(password);
        const userId = uuidv4();

        // Defer Pagar.me recipient creation until profile update with real bank data
        const pagarmeRecipientId = null;

        // Create user
        const { data: user, error } = await supabase.from('users').insert({
            id: userId, name, email: normalizedEmail, password_hash: hashedPassword,
            cpf_cnpj, phone, role: 'seller', status: 'active'
        }).select().single();

        if (error) {
            console.error('Supabase insert error:', error);
            return jsonError('Erro no banco: ' + error.message);
        }

        // Create recipient record
        if (pagarmeRecipientId) {
            await supabase.from('recipients').insert({
                id: uuidv4(), user_id: userId, pagarme_recipient_id: pagarmeRecipientId, status: 'active'
            });
        }

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
                user_id: userId,
                product_id: o.product_id,
                order_id: o.id,
                status: 'active'
            }));

        if (enrollmentsToUpsert.length > 0) {
            await supabase
                .from('enrollments')
                .upsert(enrollmentsToUpsert, { onConflict: 'user_id, product_id' });
        }

        const token = generateToken({ userId: userId, role: 'seller' });

        return jsonSuccess({
            token,
            user: { id: userId, name, email: normalizedEmail, role: 'seller' }
        }, 201);
    } catch (err: any) {
        console.error('Register error:', err);
        return jsonError('Erro interno do servidor', 500);
    }
}
