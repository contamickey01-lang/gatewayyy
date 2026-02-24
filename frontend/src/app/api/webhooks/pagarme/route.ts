export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, data } = body;

        if (!type || !data) return jsonError('Invalid webhook', 400);

        const chargeId = data.id;
        const status = data.status;

        // Find order by charge id
        const { data: order } = await supabase
            .from('orders').select('*').eq('pagarme_charge_id', chargeId).single();

        if (!order) return jsonSuccess({ received: true }); // Ignore unknown charges

        let newStatus = order.status;
        let transactionType = 'sale';

        switch (type) {
            case 'charge.paid':
                newStatus = 'paid';
                break;
            case 'charge.payment_failed':
                newStatus = 'failed';
                break;
            case 'charge.refunded':
                newStatus = 'refunded';
                transactionType = 'refund';
                break;
            case 'charge.chargedback':
                newStatus = 'chargeback';
                transactionType = 'refund';
                break;
            default:
                return jsonSuccess({ received: true });
        }

        // Update order status
        if (order.status === 'paid' && newStatus === 'paid') {
            return jsonSuccess({ received: true }); // Already processed
        }

        await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);

        if (newStatus === 'paid') {
            // Get platform fee percentage
            const feePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '15');
            const feeAmount = Math.round(order.amount * (feePercentage / 100));
            const sellerAmount = order.amount - feeAmount;

            // Update original 'sale' transaction to confirmed and adjust to net amount
            // Or keep it as full amount and create a separate 'fee' transaction (matches frontend stats logic)
            await supabase.from('transactions')
                .update({ status: 'confirmed' })
                .eq('order_id', order.id).eq('type', 'sale');

            // Create fee transaction
            await supabase.from('transactions').insert({
                id: uuidv4(),
                user_id: order.user_id,
                order_id: order.id,
                type: 'fee',
                amount: feeAmount,
                status: 'confirmed',
                description: `Taxa de plataforma (${feePercentage}%) - Pedido ${order.id}`
            });

            // Update product sales count
            if (order.product_id) {
                const { data: product } = await supabase
                    .from('products')
                    .select('sales_count')
                    .eq('id', order.product_id)
                    .single();

                if (product) {
                    await supabase.from('products')
                        .update({ sales_count: (product.sales_count || 0) + 1 })
                        .eq('id', order.product_id);
                }
            }
        } else {
            // For other statuses (failed, etc.)
            await supabase.from('transactions')
                .update({ status: newStatus === 'failed' ? 'failed' : newStatus })
                .eq('order_id', order.id).eq('type', 'sale');
        }

        // Create refund transaction if needed
        if (transactionType === 'refund') {
            await supabase.from('transactions').insert({
                id: uuidv4(), user_id: order.user_id, order_id: order.id,
                type: 'refund', amount: order.amount, amount_display: order.amount_display,
                status: 'confirmed', description: `Estorno do pedido ${order.id}`
            });
        }

        return jsonSuccess({ received: true });
    } catch (err) {
        console.error('Webhook error:', err);
        return jsonError('Webhook processing error', 500);
    }
}
