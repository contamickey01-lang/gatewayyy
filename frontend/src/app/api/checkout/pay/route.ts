export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { PagarmeService } from '@/lib/pagarme';
import { jsonError, jsonSuccess } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { product_id, payment_method, buyer, card_data } = body;

        if (!product_id || !payment_method || !buyer?.name || !buyer?.email || !buyer?.cpf) {
            return jsonError('Dados incompletos');
        }

        // Get product
        const { data: product } = await supabase
            .from('products').select('*').eq('id', product_id).eq('status', 'active').single();

        if (!product) return jsonError('Produto não encontrado', 404);

        // Get seller recipient
        const { data: recipient } = await supabase
            .from('recipients').select('pagarme_recipient_id').eq('user_id', product.user_id).single();

        if (!recipient) return jsonError('Vendedor não configurado para receber', 400);

        const feePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '3');

        // Create Pagar.me order
        const order = await PagarmeService.createOrder({
            amount: product.price,
            payment_method,
            customer: buyer,
            card_data,
            seller_recipient_id: recipient.pagarme_recipient_id,
            platform_fee_percentage: feePercentage
        });

        const charge = order.charges?.[0];
        const orderId = uuidv4();

        // Save order
        await supabase.from('orders').insert({
            id: orderId, seller_id: product.user_id, product_id: product.id,
            buyer_name: buyer.name, buyer_email: buyer.email, buyer_cpf: buyer.cpf,
            amount: product.price, amount_display: product.price_display,
            payment_method, status: charge?.status === 'paid' ? 'paid' : 'pending',
            pagarme_order_id: order.id, pagarme_charge_id: charge?.id
        });

        // Save transaction
        await supabase.from('transactions').insert({
            id: uuidv4(), user_id: product.user_id, order_id: orderId,
            type: 'sale', amount: product.price,
            amount_display: product.price_display,
            status: charge?.status === 'paid' ? 'confirmed' : 'pending',
            description: `Venda: ${product.name}`
        });

        // If paid immediately, create fee transaction and update sales count
        if (charge?.status === 'paid') {
            const feeAmount = Math.round(product.price * (feePercentage / 100));

            await supabase.from('transactions').insert({
                id: uuidv4(), user_id: product.user_id, order_id: orderId,
                type: 'fee', amount: feeAmount,
                status: 'confirmed',
                description: `Taxa de plataforma (${feePercentage}%) - Pedido ${orderId}`
            });

            await supabase.from('products')
                .update({ sales_count: (product.sales_count || 0) + 1 })
                .eq('id', product.id);
        }

        // Build response
        const response: any = {
            order: { id: orderId, status: charge?.status || 'pending', amount_display: product.price_display }
        };

        if (payment_method === 'pix' && charge?.last_transaction) {
            response.pix = {
                qr_code: charge.last_transaction.qr_code,
                qr_code_url: charge.last_transaction.qr_code_url
            };
        }

        return jsonSuccess(response, 201);
    } catch (err: any) {
        const errorData = err.response?.data || err.message;
        console.error('Checkout error details:', JSON.stringify({
            error: errorData,
            stack: err.stack,
            request: err.config?.data ? JSON.parse(err.config.data) : 'N/A'
        }, null, 2));

        // Return a more descriptive error if it's a Pagar.me validation error
        const message = errorData.message || errorData.errors?.[0]?.message || 'Erro ao processar pagamento';
        return jsonError(message, 500);
    }
}
