export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const { id } = await params;

    try {
        const { name, slug } = await req.json();
        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (slug !== undefined) updates.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

        const { data: category, error } = await supabase
            .from('store_categories')
            .update(updates)
            .eq('id', id)
            .eq('user_id', auth.user.id)
            .select();

        if (error) {
            console.error('Supabase category update error:', error);
            return jsonError('Erro no banco: ' + error.message);
        }

        if (!category || category.length === 0) {
            return jsonError('Categoria não encontrada ou sem permissão', 404);
        }

        return jsonSuccess({ category: category[0] });
    } catch (err) {
        console.error('Update category error:', err);
        return jsonError('Erro interno', 500);
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const { id } = await params;

    const { error } = await supabase
        .from('store_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', auth.user.id);

    if (error) {
        console.error('Supabase category delete error:', error);
        return jsonError('Erro ao deletar categoria', 500);
    }

    return jsonSuccess({ message: 'Categoria deletada com sucesso' });
}
