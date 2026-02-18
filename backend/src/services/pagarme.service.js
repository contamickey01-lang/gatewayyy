const { pagarmeApi } = require('../config/pagarme');
const { supabase } = require('../config/database');

class PagarmeService {
    /**
     * Create a recipient on Pagar.me for a seller
     */
    async createRecipient(seller) {
        try {
            const recipientData = {
                name: seller.name,
                email: seller.email,
                document: seller.cpf_cnpj?.replace(/[^\d]/g, ''),
                type: seller.cpf_cnpj?.replace(/[^\d]/g, '').length > 11 ? 'company' : 'individual',
                default_bank_account: {
                    holder_name: seller.name,
                    holder_type: seller.cpf_cnpj?.replace(/[^\d]/g, '').length > 11 ? 'company' : 'individual',
                    holder_document: seller.cpf_cnpj?.replace(/[^\d]/g, ''),
                    bank: seller.bank_name || '001',
                    branch_number: seller.bank_agency || '0001',
                    branch_check_digit: '0',
                    account_number: seller.bank_account || '00000',
                    account_check_digit: seller.bank_account_digit || '0',

                    type: seller.bank_account_type || 'checking'
                },
                transfer_settings: {
                    transfer_enabled: true,
                    transfer_interval: 'monthly',
                    transfer_day: 5
                },
                automatic_anticipation_settings: {
                    enabled: false
                }
            };

            const response = await pagarmeApi.post('/recipients', recipientData);
            return response.data;
        } catch (error) {
            console.error('Pagar.me createRecipient error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Create an order with split rules
     */
    async createOrder({ product, buyer, paymentMethod, cardData, sellerId, platformRecipientId, sellerRecipientId, feePercentage }) {
        try {
            const sellerPercentage = 100 - feePercentage;

            const orderData = {
                items: [{
                    amount: product.price,
                    description: product.name,
                    quantity: 1,
                    code: product.id
                }],
                customer: {
                    name: buyer.name,
                    email: buyer.email,
                    document: buyer.cpf?.replace(/[^\d]/g, ''),
                    type: 'individual',
                    phones: {
                        mobile_phone: {
                            country_code: '55',
                            area_code: buyer.phone?.substring(0, 2) || '11',
                            number: buyer.phone?.substring(2) || '999999999'
                        }
                    }
                },
                payments: [],
                split: [
                    {
                        amount: sellerPercentage,
                        recipient_id: sellerRecipientId,
                        type: 'percentage',
                        options: {
                            charge_processing_fee: true,
                            liable: true
                        }
                    },
                    {
                        amount: feePercentage,
                        recipient_id: platformRecipientId,
                        type: 'percentage',
                        options: {
                            charge_processing_fee: false,
                            liable: false
                        }
                    }
                ]
            };

            // Add payment method
            if (paymentMethod === 'pix') {
                orderData.payments.push({
                    payment_method: 'pix',
                    pix: {
                        expires_in: 3600 // 1 hour
                    }
                });
            } else if (paymentMethod === 'credit_card') {
                orderData.payments.push({
                    payment_method: 'credit_card',
                    credit_card: {
                        installments: cardData.installments || 1,
                        card: {
                            number: cardData.number,
                            holder_name: cardData.holder_name,
                            exp_month: cardData.exp_month,
                            exp_year: cardData.exp_year,
                            cvv: cardData.cvv
                        },
                        billing_address: {
                            line_1: buyer.address || 'Rua Teste, 123',
                            zip_code: buyer.zipcode || '01001000',
                            city: buyer.city || 'São Paulo',
                            state: buyer.state || 'SP',
                            country: 'BR'
                        }
                    }
                });
            }

            const response = await pagarmeApi.post('/orders', orderData);
            return response.data;
        } catch (error) {
            console.error('Pagar.me createOrder error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get recipient balance
     */
    async getRecipientBalance(recipientId) {
        try {
            const response = await pagarmeApi.get(`/recipients/${recipientId}/balance`);
            return response.data;
        } catch (error) {
            console.error('Pagar.me getBalance error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Create a transfer (withdrawal) to a recipient
     */
    async createTransfer(recipientId, amount) {
        try {
            const response = await pagarmeApi.post(`/transfers`, {
                amount,
                source_id: recipientId
            });
            return response.data;
        } catch (error) {
            console.error('Pagar.me createTransfer error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get order details
     */
    async getOrder(orderId) {
        try {
            const response = await pagarmeApi.get(`/orders/${orderId}`);
            return response.data;
        } catch (error) {
            console.error('Pagar.me getOrder error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get charge details
     */
    async getCharge(chargeId) {
        try {
            const response = await pagarmeApi.get(`/charges/${chargeId}`);
            return response.data;
        } catch (error) {
            console.error('Pagar.me getCharge error:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new PagarmeService();
