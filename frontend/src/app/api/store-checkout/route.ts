import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { PagarmeService } from '@/lib/pagarme';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items: items_cart, payment_method, buyer, store_slug } = body;

        if (!items_cart || items_cart.length === 0) {
            return NextResponse.json({ error: 'Carrinho vazio.' }, { status: 400 });
        }

        if (!buyer?.email || !buyer?.name || !buyer?.cpf) {
            return NextResponse.json({ error: 'Dados do comprador incompletos (E-mail, Nome e CPF são obrigatórios).' }, { status: 400 });
        }

        // 1. Get the seller/store ID from the first product
        const { data: firstProduct, error: productErr } = await supabase
            .from('products')
            .select('user_id')
            .eq('id', items_cart[0].id)
            .single();

        if (productErr || !firstProduct) {
            console.error('Product fetch error:', productErr);
            return NextResponse.json({ error: 'Vendedor não encontrado ou produto inválido.' }, { status: 404 });
        }

        const sellerId = firstProduct.user_id;

        // 2. Get seller's recipient ID (Matching standalone system: remove status filter)
        const { data: recipient } = await supabase
            .from('recipients')
            .select('pagarme_recipient_id')
            .eq('user_id', sellerId)
            .single();

        if (!recipient?.pagarme_recipient_id) {
            return NextResponse.json({ error: 'O vendedor desta loja ainda não ativou os pagamentos.' }, { status: 400 });
        }

        // 3. Get platform settings (fees & platform recipient)
        const feePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '3');
        const platformRecipientId = process.env.PLATFORM_RECIPIENT_ID;

        // Diagnostic log for server-side troubleshooting
        console.log('DIAGNOSTIC - Checkout Config:', {
            seller_id: sellerId,
            seller_recipient: recipient.pagarme_recipient_id,
            platform_recipient: platformRecipientId,
            fee_percentage: feePercentage
        });

        // 4. Create Pagar.me Order (EXACT Mirror of Standalone System)
        const totalAmountCents = items_cart.reduce((sum: number, item: any) => sum + Math.round(item.price * 100 * item.quantity), 0);
        const method = payment_method === 'card' ? 'credit_card' : payment_method;

        let pagarmeOrder;
        try {
            // we use the same "createOrder" used by the standalone system that works
            pagarmeOrder = await PagarmeService.createOrder({
                amount: totalAmountCents,
                payment_method: method,
                customer: buyer,
                seller_recipient_id: recipient.pagarme_recipient_id,
                platform_fee_percentage: feePercentage,
                card_data: body.card_data
            } as any);
        } catch (pagarmeErr: any) {
            const errorBody = pagarmeErr.response?.data;
            const detailedErrors = errorBody?.errors
                ? Object.entries(errorBody.errors).map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`).join('; ')
                : null;

            const errorMessage = detailedErrors || errorBody?.message || pagarmeErr.message || 'Erro desconhecido';
            console.error('Checkout Error (Final Sync):', JSON.stringify(errorBody || errorMessage, null, 2));

            return NextResponse.json({
                error: `Erro no Checkout: ${errorMessage}`,
                diagnostic: {
                    type: errorBody ? 'PAGARME_API' : 'INTERNAL_JS',
                    seller_recipient: recipient.pagarme_recipient_id,
                    platform_recipient: platformRecipientId || 'MISSING_ENV',
                    raw_error: errorBody || pagarmeErr.message
                }
            }, { status: 400 });
        }

        const charge = pagarmeOrder.charges?.[0];
        const lastTransaction = charge?.last_transaction;

        // --- ERROR DETECTION ---
        if (charge?.status === 'failed' || pagarmeOrder.status === 'failed') {
            const gatewayErrors = lastTransaction?.gateway_response?.errors;
            const msg = gatewayErrors?.map((e: any) => e.message).join('; ') || lastTransaction?.acquirer_message || 'Transação recusada.';

            return NextResponse.json({
                error: `Pagamento Recusado: ${msg}`,
                status: charge?.status || pagarmeOrder.status,
                pagarme_id: pagarmeOrder.id
            }, { status: 400 });
        }

        // 5. Save Order to Supabase with Bulletproof Extraction
        const orderData: any = {
            product_id: items_cart[0].id,
            seller_id: sellerId,
            buyer_name: buyer.name || 'Cliente',
            buyer_email: buyer.email?.toLowerCase().trim(),
            buyer_cpf: buyer.cpf?.replace(/\D/g, '') || '00000000000',
            buyer_phone: buyer.phone?.replace(/\D/g, '') || '11999999999',
            amount: totalAmountCents,
            amount_display: (totalAmountCents / 100).toFixed(2),
            payment_method: method,
            status: charge?.status === 'paid' ? 'paid' : 'pending',
            pagarme_order_id: pagarmeOrder.id,
            pagarme_charge_id: charge?.id,
            installments: body.card_data?.installments || 1
        };

        // EXTREMTELY ROBUST PIX EXTRACTION
        let diagnosticPixError = null;
        if (method === 'pix') {
            const pixInfo = lastTransaction?.pix || lastTransaction || pagarmeOrder.payments?.[0]?.pix;
            orderData.pix_qr_code = pixInfo?.qr_code;
            orderData.pix_qr_code_url = pixInfo?.qr_code_url;
            orderData.pix_expires_at = pixInfo?.expires_at;

            if (!orderData.pix_qr_code) {
                diagnosticPixError = "Pagar.me não retornou código Pix no checkout de loja.";
            }
        }

        if (method === 'credit_card' && lastTransaction) {
            orderData.card_last_digits = lastTransaction.card?.last_four_digits;
            orderData.card_brand = lastTransaction.card?.brand;
        }

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderError) {
            console.error('Supabase Order Save Error:', orderError);
            throw orderError;
        }

        // 6. Return response to frontend (Match backend response style)
        const response: any = {
            order: {
                id: order.id,
                status: order.status,
                amount_display: order.amount_display,
                payment_method: order.payment_method
            }
        };

        if (method === 'pix') {
            response.pix = {
                qr_code: order.pix_qr_code,
                qr_code_url: order.pix_qr_code_url,
                expires_at: order.pix_expires_at
            };
        }

        if (method === 'credit_card') {
            response.card = {
                last_digits: order.card_last_digits,
                brand: order.card_brand
            };
        }

        return NextResponse.json(response, { status: 201 });

    } catch (err: any) {
        console.error('Unfied Checkout Error:', err.response?.data || err.message);

        return NextResponse.json(
            { error: err.response?.data?.error || err.message || 'Erro interno ao processar checkout' },
            { status: 500 }
        );
    }
}
