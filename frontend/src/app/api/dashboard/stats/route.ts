export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';
import { PagarmeService } from '@/lib/pagarme';

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const userId = auth.user.id;

    // Base stats
    const { data: products } = await supabase
        .from('products').select('id').eq('user_id', userId);

    let totalSoldDec = 0;
    let availableDec = 0;
    let pendingDec = 0;
    let totalWithdrawnDec = 0;
    let totalFeesDec = 0;
    let usedPagarme = false;

    // Try to get live balance from Pagar.me
    const { data: recipient } = await supabase
        .from('recipients').select('pagarme_recipient_id').eq('user_id', userId).single();

    if (recipient?.pagarme_recipient_id) {
        try {
            const balance = await PagarmeService.getRecipientBalance(recipient.pagarme_recipient_id);
            console.log(`Balance for recipient ${recipient.pagarme_recipient_id}:`, JSON.stringify(balance, null, 2));

            // Helper to get amount regardless of structure (array or object)
            const getAmount = (field: any) => {
                if (!field) return 0;
                if (Array.isArray(field)) return field[0]?.amount || 0;
                return field.amount || 0;
            };

            availableDec = getAmount(balance.available) / 100;
            pendingDec = getAmount(balance.waiting_funds) / 100;
            totalWithdrawnDec = getAmount(balance.transferred) / 100;

            // Fetch total sold from orders (Pagar.me balance doesn't show history)
            const { data: salesData, error: salesError } = await supabase
                .from('orders').select('amount').eq('seller_id', userId).eq('status', 'paid');

            if (salesError) console.error('Sales query error:', salesError);
            totalSoldDec = (salesData || []).reduce((s, t) => s + (t.amount || 0), 0) / 100;

            console.log(`Calculated stats for ${userId}: sold=${totalSoldDec}, available=${availableDec}, pending=${pendingDec}`);
            usedPagarme = true;
        } catch (pErr: any) {
            console.error('Pagar.me balance error in dashboard:', pErr.response?.data || pErr.message);
        }
    }

    // Fallback if Pagar.me failed or not setup
    if (!usedPagarme) {
        console.log(`Falling back to local calculation for user ${userId}`);
        const { data: sales } = await supabase
            .from('transactions').select('amount').eq('user_id', userId).eq('type', 'sale').eq('status', 'confirmed');
        const { data: fees } = await supabase
            .from('transactions').select('amount').eq('user_id', userId).eq('type', 'fee').eq('status', 'confirmed');
        const { data: withdrawals } = await supabase
            .from('transactions').select('amount').eq('user_id', userId).eq('type', 'withdrawal').eq('status', 'confirmed');
        const { data: pending } = await supabase
            .from('transactions').select('amount').eq('user_id', userId).eq('type', 'sale').eq('status', 'pending');

        totalSoldDec = (sales || []).reduce((s, t) => s + (t.amount || 0), 0) / 100;
        totalFeesDec = (fees || []).reduce((s, t) => s + (t.amount || 0), 0) / 100;
        totalWithdrawnDec = (withdrawals || []).reduce((s, t) => s + (t.amount || 0), 0) / 100;
        pendingDec = (pending || []).reduce((s, t) => s + (t.amount || 0), 0) / 100;
        availableDec = totalSoldDec - totalFeesDec - totalWithdrawnDec;
    }

    // Monthly sales
    const { data: monthlySales } = await supabase
        .from('orders').select('amount, created_at')
        .eq('seller_id', userId).eq('status', 'paid')
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
        .eq('seller_id', userId).order('created_at', { ascending: false }).limit(10);

    return jsonSuccess({
        stats: {
            total_sold: totalSoldDec.toFixed(2),
            available_balance: availableDec.toFixed(2),
            pending_balance: pendingDec.toFixed(2),
            total_withdrawn: totalWithdrawnDec.toFixed(2),
            total_fees: totalFeesDec.toFixed(2),
            total_products: products?.length || 0,
            net_revenue: (totalSoldDec - totalFeesDec).toFixed(2)
        },
        monthly_sales,
        recent_orders: recent_orders || []
    });
}
