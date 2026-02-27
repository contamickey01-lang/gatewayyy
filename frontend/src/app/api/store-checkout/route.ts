import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { PagarmeService } from '@/lib/pagarme';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items: items_cart, payment_method, email, name, cpf, phone, store_slug } = body;

        if (!items_cart || items_cart.length === 0) {
            return NextResponse.json({ error: 'Carrinho vazio.' }, { status: 400 });
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

        // 2. Get seller's recipient ID
        const { data: recipient } = await supabase
            .from('recipients')
            .select('*')
            .eq('user_id', sellerId)
            .eq('status', 'active')
            .single();

        if (!recipient?.pagarme_recipient_id) {
            return NextResponse.json({ error: 'O vendedor desta loja ainda não ativou os pagamentos.' }, { status: 400 });
        }

        // 3. Get platform settings (fees & platform recipient)
        const { data: settings } = await supabase
            .from('platform_settings')
            .select('*')
            .single();

        const feePercentage = settings?.fee_percentage || 15;
        const platformRecipientId = settings?.platform_recipient_id || process.env.PLATFORM_RECIPIENT_ID;

        // 4. Create Pagar.me Order (Integrated Logic)
        const method = payment_method === 'card' ? 'credit_card' : payment_method;

        const pagarmeOrder = await PagarmeService.createMultiItemOrder({
            items: items_cart,
            customer: {
                name: name || 'Cliente Loja',
                email: email,
                cpf: cpf || '00000000000',
                phone: phone || '11999999999'
            },
            payment_method: method,
            seller_recipient_id: recipient.pagarme_recipient_id,
            platform_fee_percentage: feePercentage,
            card_data: body.card_data
        });

        const charge = pagarmeOrder.charges?.[0];
        const lastTransaction = charge?.last_transaction;
        const totalAmountCents = pagarmeOrder.amount;

        console.log('--- PAGARME DIAGNOSTIC ---');
        console.log('Order ID:', pagarmeOrder.id, '| Status:', pagarmeOrder.status);
        console.log('Charge ID:', charge?.id, '| Status:', charge?.status);
        console.log('Transaction Type:', lastTransaction?.transaction_type);

        // --- ERROR DETECTION AND DIAGNOSTIC INFO ---
        let pagarmeErrorMessage = null;
        if (charge?.status === 'failed' || pagarmeOrder.status === 'failed') {
            const gatewayErrors = lastTransaction?.gateway_response?.errors;
            pagarmeErrorMessage = gatewayErrors?.map((e: any) => e.message).join('; ') || lastTransaction?.acquirer_message || 'Transação recusada pelo gateway.';
            console.error('DIAGNOSTIC: Payment failed at Pagar.me:', pagarmeErrorMessage);

            return NextResponse.json({
                error: `Pagamento Recusado: ${pagarmeErrorMessage}`,
                status: charge?.status || pagarmeOrder.status,
                pagarme_id: pagarmeOrder.id
            }, { status: 400 });
        }

        // 5. Save Order to Supabase with Bulletproof Extraction
        const orderData: any = {
            product_id: items_cart[0].id,
            seller_id: sellerId,
            buyer_name: name || 'Cliente',
            buyer_email: email,
            buyer_cpf: cpf?.replace(/\D/g, '') || '00000000000',
            buyer_phone: phone?.replace(/\D/g, '') || '11999999999',
            amount: totalAmountCents,
            amount_display: (totalAmountCents / 100).toFixed(2),
            payment_method: method,
            status: charge?.status === 'paid' ? 'paid' : 'pending',
            pagarme_order_id: pagarmeOrder.id,
            pagarme_charge_id: charge?.id,
            installments: body.card_data?.installments || 1
        };

        // EXTREMTELY ROBUST PIX EXTRACTION
        if (method === 'pix') {
            // Search in multiple possible locations
            const pixInfo = lastTransaction?.pix || lastTransaction || pagarmeOrder.payments?.[0]?.pix;

            orderData.pix_qr_code = pixInfo?.qr_code || lastTransaction?.qr_code;
            orderData.pix_qr_code_url = pixInfo?.qr_code_url || lastTransaction?.qr_code_url;
            orderData.pix_expires_at = pixInfo?.expires_at || lastTransaction?.expires_at;

            console.log('DIAGNOSTIC: Pix Data Found:', {
                code: !!orderData.pix_qr_code,
                url: !!orderData.pix_qr_code_url
            });

            if (!orderData.pix_qr_code) {
                console.error('DIAGNOSTIC: Pix data missing. Dumping Charge object for analysis:');
                console.error(JSON.stringify(charge, null, 2));
                // If it's empty, maybe the split rules are causing a hold?
                orderData.pix_error = "Pagar.me não retornou código Pix. Verifique configurações da conta.";
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
