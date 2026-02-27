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

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return jsonError('Email já cadastrado');
        }

        const hashedPassword = await hashPassword(password);
        const userId = uuidv4();

        // Create Pagar.me recipient
        let pagarmeRecipientId = null;
        try {
            const recipient = await PagarmeService.createRecipient({
                name, email, cpf_cnpj,
                type: cpf_cnpj.replace(/\D/g, '').length > 11 ? 'company' : 'individual'
            });
            pagarmeRecipientId = recipient.id;
        } catch (err: any) {
            console.error('Pagar.me recipient creation failed:', err.response?.data || err.message);
        }

        // Create user
        const { data: user, error } = await supabase.from('users').insert({
            id: userId, name, email, password: hashedPassword,
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

        const token = generateToken({ userId: userId, role: 'seller' });

        return jsonSuccess({
            token,
            user: { id: userId, name, email, role: 'seller' }
        }, 201);
    } catch (err: any) {
        console.error('Register error:', err);
        return jsonError('Erro interno do servidor', 500);
    }
}
