export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const userId = auth.user.id;

    // Stats
    const { data: sales } = await supabase
        .from('transactions').select('amount').eq('user_id', userId).eq('type', 'sale').eq('status', 'confirmed');

    const { data: fees } = await supabase
        .from('transactions').select('amount').eq('user_id', userId).eq('type', 'fee').eq('status', 'confirmed');

    const { data: withdrawals } = await supabase
        .from('transactions').select('amount').eq('user_id', userId).eq('type', 'withdrawal').eq('status', 'confirmed');

    const { data: pending } = await supabase
        .from('transactions').select('amount').eq('user_id', userId).eq('type', 'sale').eq('status', 'pending');

    const { data: products } = await supabase
        .from('products').select('id').eq('user_id', userId);

    const totalSold = (sales || []).reduce((s, t) => s + (t.amount || 0), 0);
    const totalFees = (fees || []).reduce((s, t) => s + (t.amount || 0), 0);
    const totalWithdrawn = (withdrawals || []).reduce((s, t) => s + (t.amount || 0), 0);
    const pendingBalance = (pending || []).reduce((s, t) => s + (t.amount || 0), 0);

    // Available balance is confirmed sales minus confirmed fees minus confirmed withdrawals
    const available = totalSold - totalFees - totalWithdrawn;

    // Monthly sales
    const { data: monthlySales } = await supabase
        .from('orders').select('amount, created_at')
        .eq('user_id', userId).eq('status', 'paid')
        .order('created_at', { ascending: true });

    const monthlyMap: Record<string, number> = {};
    (monthlySales || []).forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[key] = (monthlyMap[key] || 0) + o.amount;
    });

    const monthly_sales = Object.entries(monthlyMap).map(([month, amount]) => ({
        month, amount: (amount / 100).toFixed(2)
    }));

    // Recent orders
    const { data: recent_orders } = await supabase
        .from('orders').select('id, buyer_name, amount_display, payment_method, status, created_at, products(name)')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(10);

    return jsonSuccess({
        stats: {
            total_sold: (totalSold / 100).toFixed(2),
            available_balance: (available / 100).toFixed(2),
            pending_balance: (pendingBalance / 100).toFixed(2),
            total_withdrawn: (totalWithdrawn / 100).toFixed(2),
            total_fees: (totalFees / 100).toFixed(2),
            total_products: products?.length || 0
        },
        monthly_sales,
        recent_orders: recent_orders || []
    });
}
