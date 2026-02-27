import axios from 'axios';

const pagarmeApi = axios.create({
    baseURL: 'https://api.pagar.me/core/v5',
    auth: {
        username: process.env.PAGARME_API_KEY!,
        password: ''
    },
    headers: { 'Content-Type': 'application/json' }
});

export class PagarmeService {
    static async createRecipient(data: {
        name: string; email: string; cpf_cnpj: string; type: string;
        bank_code?: string; agency?: string; account?: string; account_digit?: string; account_type?: string;
    }) {
        const response = await pagarmeApi.post('/recipients', {
            name: data.name,
            email: data.email,
            document: data.cpf_cnpj,
            type: data.type || 'individual',
            default_bank_account: {
                holder_name: data.name,
                holder_type: data.type || 'individual',
                holder_document: data.cpf_cnpj,
                bank: data.bank_code || '001',
                branch_number: data.agency || '0001',
                account_number: data.account || '0000000',
                account_check_digit: data.account_digit || '0',
                type: data.account_type || 'checking'
            }
        });
        return response.data;
    }

    static async createOrder(data: {
        amount: number; payment_method: string; customer: any;
        card_data?: any; seller_recipient_id: string; platform_fee_percentage: number;
    }) {
        const sellerPercentage = 100 - (data.platform_fee_percentage || 0);
        const platformRecipientId = process.env.PLATFORM_RECIPIENT_ID;

        // Robust Address Object
        const address = {
            line_1: 'Rua Teste, 123, Bairro Teste',
            zip_code: '01001000',
            city: 'São Paulo',
            state: 'SP',
            country: 'BR',
            street: 'Rua Teste',
            number: '123',
            neighborhood: 'Bairro Teste'
        };

        const orderData: any = {
            customer: {
                name: data.customer.name || 'Cliente',
                email: data.customer.email,
                document: data.customer.cpf?.replace(/\D/g, '') || '00000000000',
                type: 'individual',
                phones: {
                    mobile_phone: {
                        country_code: '55',
                        area_code: data.customer.phone?.replace(/\D/g, '').substring(0, 2) || '11',
                        number: data.customer.phone?.replace(/\D/g, '').substring(2) || '999999999'
                    }
                },
                address // Adding address to customer too (often required for antifraud)
            },
            items: [{
                amount: data.amount,
                description: 'Pagamento de Pedido',
                quantity: 1,
                code: 'pay-001'
            }],
            payments: []
        };

        // Add split rules at root level (matched to backend)
        const platId = (process.env.PLATFORM_RECIPIENT_ID || '').trim();
        const sellId = (data.seller_recipient_id || '').trim();
        const fee = data.platform_fee_percentage || 0;

        const shouldSplit = platId && sellId && fee > 0 && platId.toLowerCase() !== sellId.toLowerCase();

        if (shouldSplit) {
            orderData.split = [
                {
                    amount: sellerPercentage,
                    recipient_id: sellId,
                    type: 'percentage',
                    options: { charge_processing_fee: true, liable: true }
                },
                {
                    amount: fee,
                    recipient_id: platId,
                    type: 'percentage',
                    options: { charge_processing_fee: false, liable: false }
                }
            ];
        }

        if (data.payment_method === 'pix') {
            orderData.payments.push({
                payment_method: 'pix',
                pix: {
                    expires_in: 3600,
                    additional_information: [{ name: 'Plataforma', value: process.env.PLATFORM_NAME || 'PayGateway' }]
                }
            });
        } else if (data.payment_method === 'credit_card' || data.payment_method === 'card') {
            const card = data.card_data || {};
            const cleanNumber = String(card.number || '').replace(/\D/g, '');
            const expMonth = parseInt(String(card.exp_month || '0')) || 1;
            const rawYear = String(card.exp_year || '0');
            const expYear = parseInt(rawYear.length === 2 ? `20${rawYear}` : rawYear) || 2026;
            const installments = parseInt(String(card.installments || '1')) || 1;

            orderData.payments.push({
                payment_method: 'credit_card',
                credit_card: {
                    installments: installments,
                    statement_descriptor: 'PEDIDO',
                    card: {
                        number: cleanNumber,
                        holder_name: card.holder_name || data.customer.name,
                        exp_month: expMonth,
                        exp_year: expYear,
                        cvv: card.cvv
                    },
                    // Providing BOTH billing_address and billing objects for maximum compatibility
                    billing_address: address,
                    billing: {
                        address: address
                    }
                }
            });
        }

        const response = await pagarmeApi.post('/orders', orderData);
        return response.data;
    }

    /**
     * Create an order with multiple items (Cart)
     */
    static async createMultiItemOrder(data: {
        items: any[]; payment_method: string; customer: any;
        card_data?: any; seller_recipient_id: string; platform_fee_percentage: number;
    }) {
        const sellerPercentage = 100 - (data.platform_fee_percentage || 0);

        // Robust Address Object
        const address = {
            line_1: 'Rua Teste, 123, Bairro Teste',
            zip_code: '01001000',
            city: 'São Paulo',
            state: 'SP',
            country: 'BR',
            street: 'Rua Teste',
            number: '123',
            neighborhood: 'Bairro Teste'
        };

        const orderData: any = {
            customer: {
                name: data.customer.name || 'Cliente',
                email: data.customer.email,
                document: data.customer.cpf?.replace(/\D/g, '') || '00000000000',
                type: 'individual',
                phones: {
                    mobile_phone: {
                        country_code: '55',
                        area_code: data.customer.phone?.replace(/\D/g, '').substring(0, 2) || '11',
                        number: data.customer.phone?.replace(/\D/g, '').substring(2) || '999999999'
                    }
                },
                address
            },
            items: data.items.map(item => ({
                amount: Math.round(item.price * 100),
                description: item.name,
                quantity: item.quantity,
                code: item.id
            })),
            payments: []
        };

        const platId = (process.env.PLATFORM_RECIPIENT_ID || '').trim();
        const sellId = (data.seller_recipient_id || '').trim();
        const fee = data.platform_fee_percentage || 0;

        const shouldSplit = platId && sellId && fee > 0 && platId.toLowerCase() !== sellId.toLowerCase();

        if (shouldSplit) {
            orderData.split = [
                {
                    amount: sellerPercentage,
                    recipient_id: sellId,
                    type: 'percentage',
                    options: { charge_processing_fee: true, liable: true }
                },
                {
                    amount: fee,
                    recipient_id: platId,
                    type: 'percentage',
                    options: { charge_processing_fee: false, liable: false }
                }
            ];
        }

        if (data.payment_method === 'pix') {
            orderData.payments.push({
                payment_method: 'pix',
                pix: { expires_in: 3600 }
            });
        } else if (data.payment_method === 'credit_card' || data.payment_method === 'card') {
            const card = data.card_data || {};
            const cleanNumber = String(card.number || '').replace(/\D/g, '');
            const expMonth = parseInt(String(card.exp_month || '0')) || 1;
            const rawYear = String(card.exp_year || '0');
            const expYear = parseInt(rawYear.length === 2 ? `20${rawYear}` : rawYear) || 2026;
            const installments = parseInt(String(card.installments || '1')) || 1;

            orderData.payments.push({
                payment_method: 'credit_card',
                credit_card: {
                    installments: installments,
                    statement_descriptor: 'LOJA',
                    card: {
                        number: cleanNumber,
                        holder_name: card.holder_name || data.customer.name,
                        exp_month: expMonth,
                        exp_year: expYear,
                        cvv: card.cvv
                    },
                    billing_address: address,
                    billing: {
                        address: address
                    }
                }
            });
        }

        const response = await pagarmeApi.post('/orders', orderData);
        return response.data;
    }

    static async getRecipientBalance(recipientId: string) {
        const response = await pagarmeApi.get(`/recipients/${recipientId}/balance`);
        return response.data;
    }

    static async createTransfer(recipientId: string, amount: number) {
        const response = await pagarmeApi.post(`/recipients/${recipientId}/transfers`, { amount });
        return response.data;
    }

    static async getRecipient(recipientId: string) {
        const response = await pagarmeApi.get(`/recipients/${recipientId}`);
        return response.data;
    }

    static async updateRecipient(recipientId: string, data: {
        name: string; email: string; cpf_cnpj: string; type: string;
        bank_code: string; agency: string; account: string; account_digit: string; account_type: string;
    }) {
        const response = await pagarmeApi.put(`/recipients/${recipientId}`, {
            name: data.name,
            email: data.email,
            type: data.type || 'individual',
            default_bank_account: {
                holder_name: data.name,
                holder_type: data.type || 'individual',
                holder_document: data.cpf_cnpj,
                bank: data.bank_code,
                branch_number: data.agency,
                account_number: data.account,
                account_check_digit: data.account_digit || '0',
                type: data.account_type || 'checking'
            }
        });
        return response.data;
    }

    static async getOrder(orderId: string) {
        const response = await pagarmeApi.get(`/orders/${orderId}`);
        return response.data;
    }

    static async createKycLink(recipientId: string) {
        const response = await pagarmeApi.post(`/recipients/${recipientId}/kyc_link`);
        return response.data;
    }
}

export default pagarmeApi;
