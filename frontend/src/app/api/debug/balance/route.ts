export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';
import { PagarmeService } from '@/lib/pagarme';

export async function GET(req: NextRequest) {
    const { data: recipient } = await supabase
        .from('recipients').select('pagarme_recipient_id').limit(1).single();

    if (!recipient?.pagarme_recipient_id) {
        return jsonError('Recebedor não encontrado no banco', 404);
    }

    try {
        const balance = await PagarmeService.getRecipientBalance(recipient.pagarme_recipient_id);
        return jsonSuccess({
            recipient_id: recipient.pagarme_recipient_id,
            raw_balance: balance
        });
    } catch (err: any) {
        const errorData = err.response?.data || err.message;
        return jsonSuccess({
            status: 'ERROR',
            message: 'Erro ao buscar saldo no Pagar.me',
            details: errorData
        });
    }
}
