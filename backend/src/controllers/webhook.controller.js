const { supabase } = require('../config/database');

class WebhookController {
    async handlePagarme(req, res, next) {
        try {
            const event = req.body;

            console.log('Webhook received:', event.type, event.data?.id);

            switch (event.type) {
                case 'charge.paid':
                    await this._handleChargePaid(event.data);
                    break;
                case 'charge.payment_failed':
                    await this._handleChargeFailed(event.data);
                    break;
                case 'charge.refunded':
                    await this._handleChargeRefunded(event.data);
                    break;
                case 'charge.chargeback':
                    await this._handleChargeback(event.data);
                    break;
                default:
                    console.log('Unhandled webhook event:', event.type);
            }

            res.status(200).json({ received: true });
        } catch (error) {
            console.error('Webhook error:', error);
            res.status(200).json({ received: true }); // Always return 200 to Pagar.me
        }
    }

    async _handleChargePaid(charge) {
        const { data: order } = await supabase
            .from('orders')
            .select('*, products(*)')
            .eq('pagarme_charge_id', charge.id)
            .single();

        if (!order || order.status === 'paid') return;

        // Update order status
        await supabase
            .from('orders')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('id', order.id);

        // Get platform fee
        const { data: settings } = await supabase
            .from('platform_settings')
            .select('fee_percentage')
            .single();

        const feePercentage = settings?.fee_percentage || 15;
        const feeAmount = Math.round(order.amount * feePercentage / 100);
        const sellerAmount = order.amount - feeAmount;

        // Create transaction records
        await supabase.from('transactions').insert({
            order_id: order.id,
            user_id: order.seller_id,
            type: 'sale',
            amount: sellerAmount,
            status: 'confirmed',
            description: `Venda: ${order.products?.name || 'Produto'}`
        });

        await supabase.from('transactions').insert({
            order_id: order.id,
            user_id: order.seller_id,
            type: 'fee',
            amount: feeAmount,
            status: 'confirmed',
            description: `Taxa plataforma: ${feePercentage}%`
        });

        await supabase.from('platform_fees').insert({
            order_id: order.id,
            amount: feeAmount,
            percentage: feePercentage
        });

        // Update product sales count
        if (order.product_id) {
            const { data: product } = await supabase
                .from('products')
                .select('sales_count, type')
                .eq('id', order.product_id)
                .single();

            await supabase
                .from('products')
                .update({ sales_count: (product?.sales_count || 0) + 1 })
                .eq('id', order.product_id);

            // AUTO-ENROLLMENT for digital products
            if (product?.type === 'digital' && order.buyer_email) {
                try {
                    // 1. Check if user already exists
                    let { data: user } = await supabase
                        .from('users')
                        .select('id')
                        .eq('email', order.buyer_email)
                        .single();

                    // 2. Create user if doesn't exist
                    if (!user) {
                        const { data: newUser, error: createError } = await supabase
                            .from('users')
                            .insert({
                                name: order.buyer_name || 'Estudante',
                                email: order.buyer_email,
                                password_hash: 'INITIAL_PAYMENT_PENDING_SET', // Needs password reset/init
                                role: 'customer',
                                status: 'active'
                            })
                            .select()
                            .single();

                        if (!createError) user = newUser;
                    }

                    // 3. Create enrollment
                    if (user) {
                        const { error: enrollError } = await supabase
                            .from('enrollments')
                            .upsert({
                                user_id: user.id,
                                product_id: order.product_id,
                                order_id: order.id,
                                status: 'active'
                            });

                        if (enrollError) {
                            console.error(`[WEBHOOK] Enrollment failed for ${order.buyer_email}:`, enrollError.message);
                        } else {
                            console.log(`[WEBHOOK] Auto-enrolled ${order.buyer_email} to product ${order.product_id}`);
                        }
                    }
                } catch (enrollErr) {
                    console.error('[WEBHOOK] Auto-enrollment error:', enrollErr.message);
                }
            }
        }

        console.log(`Order ${order.id} paid. Seller: R$${(sellerAmount / 100).toFixed(2)}, Fee: R$${(feeAmount / 100).toFixed(2)}`);
    }

    async _handleChargeFailed(charge) {
        await supabase
            .from('orders')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('pagarme_charge_id', charge.id);
    }

    async _handleChargeRefunded(charge) {
        const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('pagarme_charge_id', charge.id)
            .single();

        if (!order) return;

        await supabase
            .from('orders')
            .update({ status: 'refunded', updated_at: new Date().toISOString() })
            .eq('id', order.id);

        // Create refund transaction
        await supabase.from('transactions').insert({
            order_id: order.id,
            user_id: order.seller_id,
            type: 'refund',
            amount: order.amount,
            status: 'confirmed',
            description: 'Estorno realizado'
        });
    }

    async _handleChargeback(charge) {
        const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('pagarme_charge_id', charge.id)
            .single();

        if (!order) return;

        await supabase
            .from('orders')
            .update({ status: 'chargeback', updated_at: new Date().toISOString() })
            .eq('id', order.id);

        await supabase.from('transactions').insert({
            order_id: order.id,
            user_id: order.seller_id,
            type: 'refund',
            amount: order.amount,
            status: 'confirmed',
            description: 'Chargeback - contestação de pagamento'
        });

        console.log(`Chargeback received for order ${order.id}`);
    }
}

module.exports = new WebhookController();
