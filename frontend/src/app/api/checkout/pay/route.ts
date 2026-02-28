export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { PagarmeService } from '@/lib/pagarme';
import { jsonError, jsonSuccess, generateToken, hashPassword } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { product_id, buyer, card_data } = body;
        const enableCreditCard = process.env.ENABLE_CREDIT_CARD === 'true';
        const normalizedPaymentMethod = (body.payment_method === 'card' ? 'credit_card' : body.payment_method) || 'pix';

        if (normalizedPaymentMethod !== 'pix' && normalizedPaymentMethod !== 'credit_card') {
            return jsonError('Método de pagamento inválido');
        }

        if (normalizedPaymentMethod === 'credit_card' && !enableCreditCard) {
            return jsonError('Pagamento por cartão está desativado no momento');
        }

        if (!product_id || !buyer?.name || !buyer?.email || !buyer?.cpf) {
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
        const platformRecipientId = process.env.PLATFORM_RECIPIENT_ID;
        console.log('DEBUG PIX GENERATION:', {
            seller_recipient_id: recipient.pagarme_recipient_id,
            platform_recipient_id: platformRecipientId,
            seller_percentage: 100 - feePercentage,
            platform_percentage: feePercentage
        });

        const order = await PagarmeService.createOrder({
            amount: product.price,
            payment_method: normalizedPaymentMethod,
            customer: buyer,
            card_data: normalizedPaymentMethod === 'credit_card' ? card_data : undefined,
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
            payment_method: normalizedPaymentMethod, status: charge?.status === 'paid' ? 'paid' : 'pending',
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
        let buyerUser: any = null;
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

            // AUTO-ENROLLMENT: Find or create buyer user and enroll them
            const { data: existingUser } = await supabase
                .from('users')
                .select('id, name, email, role')
                .ilike('email', buyer.email.toLowerCase().trim())
                .single();

            if (existingUser) {
                buyerUser = existingUser;
            } else {
                // Create new customer account
                const newUserId = uuidv4();
                const tempPassword = uuidv4().substring(0, 12);
                const hashedPw = await hashPassword(tempPassword);

                const baseUserData: any = {
                    id: newUserId,
                    email: buyer.email.toLowerCase().trim(),
                    name: buyer.name,
                    role: 'customer',
                    status: 'active'
                };

                let newUser: any = null;
                let createErr: any = null;

                ({ data: newUser, error: createErr } = await supabase
                    .from('users')
                    .insert({ ...baseUserData, password_hash: hashedPw })
                    .select('id, name, email, role')
                    .single());

                if (createErr && /password_hash/i.test(createErr.message || '')) {
                    ({ data: newUser, error: createErr } = await supabase
                        .from('users')
                        .insert({ ...baseUserData, password: hashedPw })
                        .select('id, name, email, role')
                        .single());
                }

                if (!createErr && newUser) buyerUser = newUser;
            }

            if (buyerUser) {
                // Enroll buyer in the product
                await supabase.from('enrollments').upsert({
                    user_id: buyerUser.id,
                    product_id: product.id,
                    order_id: orderId,
                    status: 'active'
                }, { onConflict: 'user_id, product_id' });
            }
        }

        // Build response
        const response: any = {
            order: { id: orderId, status: charge?.status || 'pending', amount_display: product.price_display }
        };

        // If paid immediately, include auto-login token for buyer
        if (charge?.status === 'paid' && buyerUser) {
            const token = generateToken({ id: buyerUser.id, email: buyerUser.email, role: buyerUser.role });
            response.auth = {
                token,
                user: { id: buyerUser.id, name: buyerUser.name, email: buyerUser.email, role: buyerUser.role }
            };
        }

        if (normalizedPaymentMethod === 'pix') {
            const lastTransaction = charge?.last_transaction;
            const pixInfo = lastTransaction?.pix || lastTransaction || order.payments?.[0]?.pix;

            console.log('[PAY API] Pix Extraction Debug:', {
                hasCharge: !!charge,
                hasLastTransaction: !!lastTransaction,
                hasPixInfo: !!pixInfo,
                qrCode: !!pixInfo?.qr_code,
                qrCodeUrl: !!pixInfo?.qr_code_url
            });

            if (pixInfo?.qr_code || pixInfo?.qr_code_url) {
                response.pix = {
                    qr_code: pixInfo.qr_code,
                    qr_code_url: pixInfo.qr_code_url,
                    expires_at: pixInfo.expires_at
                };
            } else {
                console.error('[PAY API] Pix data NOT found. Full Pagar.me Order:', JSON.stringify(order, null, 2));
            }
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
