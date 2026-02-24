export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';
import { PagarmeService } from '@/lib/pagarme';

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    try {
        // Get recipient ID
        const { data: recipient } = await supabase
            .from('recipients').select('pagarme_recipient_id').eq('user_id', auth.user.id).single();

        if (recipient?.pagarme_recipient_id) {
            try {
                const balance = await PagarmeService.getRecipientBalance(recipient.pagarme_recipient_id);

                // Pagar.me v5 returns sub-objects for each type
                const available = balance.available?.amount || 0;
                const pending = balance.waiting_funds?.amount || 0;
                const transferred = balance.transferred?.amount || 0;

                // Also fetch total sold from orders for reference (not provided by balance API directly)
                const { data: orders } = await supabase
                    .from('orders').select('amount').eq('user_id', auth.user.id).eq('status', 'paid');
                const totalSold = (orders || []).reduce((sum, o) => sum + (o.amount || 0), 0);

                return jsonSuccess({
                    available: (available / 100).toFixed(2),
                    pending: (pending / 100).toFixed(2),
                    total_sold: (totalSold / 100).toFixed(2),
                    total_withdrawn: (transferred / 100).toFixed(2),
                });
            } catch (pErr) {
                console.error('Pagar.me balance error, falling back to local calculation:', pErr);
                // Fall through to local calculation
            }
        }

        // Fallback: Calculate balance from transactions
        const { data: sales } = await supabase
            .from('transactions').select('amount').eq('user_id', auth.user.id).eq('type', 'sale').eq('status', 'confirmed');

        const { data: fees } = await supabase
            .from('transactions').select('amount').eq('user_id', auth.user.id).eq('type', 'fee');

        const { data: withdrawals } = await supabase
            .from('transactions').select('amount').eq('user_id', auth.user.id).eq('type', 'withdrawal');

        const { data: pendingSales } = await supabase
            .from('transactions').select('amount').eq('user_id', auth.user.id).eq('type', 'sale').eq('status', 'pending');

        const totalSold = (sales || []).reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalFees = (fees || []).reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalWithdrawn = (withdrawals || []).reduce((sum, t) => sum + (t.amount || 0), 0);
        const pendingAmount = (pendingSales || []).reduce((sum, t) => sum + (t.amount || 0), 0);
        const available = totalSold - totalFees - totalWithdrawn;

        return jsonSuccess({
            available: (available / 100).toFixed(2),
            pending: (pendingAmount / 100).toFixed(2),
            total_sold: (totalSold / 100).toFixed(2),
            total_withdrawn: (totalWithdrawn / 100).toFixed(2),
            total_fees: (totalFees / 100).toFixed(2)
        });
    } catch (err: any) {
        console.error('Balance API error:', err);
        return jsonError('Erro ao buscar saldo', 500);
    }
}
