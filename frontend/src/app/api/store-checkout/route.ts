import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Ensure BACKEND_URL is absolute and valid
        let targetBackendUrl = process.env.NEXT_PUBLIC_API_URL;

        // If it's relative (common if set to /api for client) or missing, use local default
        if (!targetBackendUrl || targetBackendUrl.startsWith('/')) {
            targetBackendUrl = 'http://localhost:3001/api';
        }

        const method = body.payment_method === 'card' ? 'credit_card' : body.payment_method;
        const targetUrl = `${targetBackendUrl.replace(/\/$/, '')}/checkout/store-checkout`;

        console.log('--- Store Checkout Proxy ---');
        console.log('Target URL:', targetUrl);
        console.log('Payment Method:', method);

        // Proxy to external backend
        const response = await axios.post(targetUrl, {
            items_cart: body.items,
            payment_method: method,
            buyer: {
                email: body.email,
                name: body.name || 'Cliente Loja',
                cpf: body.cpf || '00000000000', // Mocking for now if not provided
                phone: body.phone || '11999999999'
            },
            store_slug: body.store_slug
        });

        return NextResponse.json(response.data);
    } catch (err: any) {
        let errorMessage = 'Erro ao processar checkout';

        if (err.response?.data?.error) {
            errorMessage = err.response.data.error;
            if (err.response.data.details) {
                console.error('Details:', err.response.data.details);
            }
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
            errorMessage = 'O servidor backend está offline ou inacessível (Verifique se o backend está rodando e a URL está correta)';
        } else if (!err.response) {
            errorMessage = `Falha de rede: ${err.message}`;
        }

        console.error('Store Checkout Proxy Error:', err.response?.data || err.message);

        return NextResponse.json(
            { error: errorMessage },
            { status: err.response?.status || 500 }
        );
    }
}
