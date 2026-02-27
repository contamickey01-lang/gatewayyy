import { NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Proxy to external backend
        const response = await axios.post(`${BACKEND_URL}/checkout/store-checkout`, {
            items_cart: body.items,
            payment_method: body.payment_method,
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
        console.error('Store Checkout Proxy Error:', err.response?.data || err.message);
        return NextResponse.json(
            { error: err.response?.data?.error || 'Erro ao processar checkout' },
            { status: err.response?.status || 500 }
        );
    }
}
