export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';
import { PagarmeService } from '@/lib/pagarme';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false });

    return jsonSuccess({ withdrawals: withdrawals || [] });
}

export async function POST(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    try {
        const { amount } = await req.json();
        if (!amount || amount <= 0) return jsonError('Valor inválido');

        const amountInCents = Math.round(amount * 100);

        // Get recipient
        const { data: recipient } = await supabase
            .from('recipients').select('pagarme_recipient_id').eq('user_id', auth.user.id).single();

        if (!recipient) return jsonError('Recebedor não encontrado', 404);

        // Create transfer
        const transfer = await PagarmeService.createTransfer(recipient.pagarme_recipient_id, amountInCents);

        // Record withdrawal
        const { data: withdrawal } = await supabase.from('withdrawals').insert({
            id: uuidv4(), user_id: auth.user.id,
            amount: amountInCents, amount_display: amount.toFixed(2),
            pix_key: auth.user.pix_key, status: 'processing',
            pagarme_transfer_id: transfer.id
        }).select().single();

        // Record transaction
        await supabase.from('transactions').insert({
            id: uuidv4(), user_id: auth.user.id,
            type: 'withdrawal', amount: amountInCents, amount_display: amount.toFixed(2),
            status: 'confirmed', description: `Saque de R$ ${amount.toFixed(2)}`
        });

        return jsonSuccess({ withdrawal }, 201);
    } catch (err: any) {
        console.error('Withdrawal error:', err.response?.data || err.message);
        return jsonError(err.response?.data?.message || 'Erro ao processar saque', 500);
    }
}
