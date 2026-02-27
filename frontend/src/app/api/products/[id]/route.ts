import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const { data: products } = await supabase
        .from('products').select('*').eq('id', id).eq('user_id', auth.user.id);

    const product = products?.[0];

    if (!product) return jsonError('Produto não encontrado', 404);

    return jsonSuccess({
        product: {
            ...product,
            price: product.price / 100,
            price_display: (product.price / 100).toFixed(2)
        }
    });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    try {
        const body = await req.json();
        const updateData: any = {};

        if (body.name) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.price) {
            updateData.price = Math.round(parseFloat(body.price) * 100);
            updateData.price_display = parseFloat(body.price).toFixed(2);
        }
        if (body.image_url !== undefined) updateData.image_url = body.image_url;
        if (body.type) updateData.type = body.type;
        if (body.status) updateData.status = body.status;
        if (body.checkout_settings !== undefined) updateData.checkout_settings = body.checkout_settings;

        // Novos campos da loja
        if (body.store_category_id !== undefined) updateData.store_category_id = body.store_category_id;
        if (body.show_in_store !== undefined) updateData.show_in_store = body.show_in_store;

        const { data: products, error } = await supabase.from('products')
            .update(updateData).eq('id', id).eq('user_id', auth.user.id).select();

        const product = products?.[0];

        if (error || !product) return jsonError('Erro ao atualizar produto');
        return jsonSuccess({ product });
    } catch (err) {
        return jsonError('Erro interno', 500);
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const { error } = await supabase.from('products')
        .delete().eq('id', id).eq('user_id', auth.user.id);

    if (error) return jsonError('Erro ao excluir produto');
    return jsonSuccess({ message: 'Produto excluído' });
}
