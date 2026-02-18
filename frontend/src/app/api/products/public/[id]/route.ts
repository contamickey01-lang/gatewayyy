import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: product } = await supabase
        .from('products')
        .select('id, name, description, price, price_display, image_url, type, user_id')
        .eq('id', id)
        .eq('status', 'active')
        .single();

    if (!product) return jsonError('Produto não encontrado', 404);

    // Get seller name
    const { data: seller } = await supabase
        .from('users')
        .select('name')
        .eq('id', product.user_id)
        .single();

    return jsonSuccess({
        product: { ...product, seller_name: seller?.name || 'Vendedor' }
    });
}
