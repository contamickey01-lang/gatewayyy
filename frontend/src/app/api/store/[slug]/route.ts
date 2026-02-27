export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
    const { slug } = params;
    const categorySlug = req.nextUrl.searchParams.get('category');

    try {
        // 1. Get store owner info
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, name, store_name, store_description, store_theme, store_banner_url, avatar_url')
            .eq('store_slug', slug)
            .eq('store_active', true);

        if (userError || !users || users.length === 0) {
            return jsonError('Loja não encontrada ou inativa', 404);
        }

        const user = users[0];

        // 2. Get categories
        const { data: categories } = await supabase
            .from('store_categories')
            .select('*')
            .eq('user_id', user.id)
            .order('name');

        // 3. Get products
        let query = supabase
            .from('products')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .eq('show_in_store', true)
            .order('created_at', { ascending: false });

        if (categorySlug) {
            const category = categories?.find(c => c.slug === categorySlug);
            if (category) {
                query = query.eq('store_category_id', category.id);
            }
        }

        const { data: products, error: prodError } = await query;

        if (prodError) throw prodError;

        return jsonSuccess({
            store: {
                name: user.store_name,
                description: user.store_description,
                theme: user.store_theme || 'light',
                banner_url: user.store_banner_url,
                avatar_url: user.avatar_url,
            },
            categories: categories || [],
            products: products || []
        });
    } catch (err) {
        console.error('Store loading error:', err);
        return jsonError('Erro ao carregar loja', 500);
    }
}
