export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false });

    const formattedProducts = products?.map(p => ({
        ...p,
        price: p.price / 100,
        price_display: (p.price / 100).toFixed(2)
    })) || [];

    return jsonSuccess({ products: formattedProducts });
}

export async function POST(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    try {
        const body = await req.json();
        const { name, description, price, image_url, type, status } = body;

        if (!name || !price) return jsonError('Nome e preço são obrigatórios');

        const priceInCents = Math.round(parseFloat(price) * 100);

        const { data: product, error } = await supabase.from('products').insert({
            id: uuidv4(), user_id: auth.user.id,
            name, description, price: priceInCents,
            price_display: parseFloat(price).toFixed(2),
            image_url, type: type || 'digital', status: status || 'active'
        }).select().single();

        if (error) {
            console.error('Supabase product insert error:', error);
            return jsonError('Erro no banco: ' + error.message);
        }

        return jsonSuccess({ product }, 201);
    } catch (err) {
        console.error('Create product error:', err);
        return jsonError('Erro interno', 500);
    }
}
