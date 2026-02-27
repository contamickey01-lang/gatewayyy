export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const categorySlug = req.nextUrl.searchParams.get('category');

    try {
        // 1. Get store owner info
        // Simple eq with slug, since it should be sanitized
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, name, store_name, store_description, store_theme, store_banner_url, avatar_url, store_active')
            .ilike('store_slug', slug);

        if (userError) {
            console.error('Supabase user slug error:', userError);
            return jsonError('Erro ao buscar loja', 500);
        }

        if (!users || users.length === 0) {
            console.log(`Store not found for slug: ${slug}`);
            return jsonError('Loja não encontrada', 404);
        }

        const user = users[0];

        if (!user.store_active) {
            console.log(`Store found but inactive for slug: ${slug}`);
            return jsonError('Loja inativa', 404);
        }

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
