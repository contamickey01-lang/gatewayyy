export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    // Calculate balance from transactions
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
}
