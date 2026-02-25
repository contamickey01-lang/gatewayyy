export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';
import { PagarmeService } from '@/lib/pagarme';

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const { data: recipient } = await supabase
        .from('recipients').select('pagarme_recipient_id').eq('user_id', auth.user.id).single();

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
        return jsonError({
            message: 'Erro ao buscar saldo no Pagar.me',
            error: err.response?.data || err.message
        });
    }
}
