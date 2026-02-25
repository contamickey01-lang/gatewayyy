import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ moduleId: string }> }) {
    const { moduleId } = await params;
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    try {
        const { title, order } = await req.json();

        const { data: module, error } = await supabase
            .from('product_modules')
            .update({ title, order, updated_at: new Date().toISOString() })
            .eq('id', moduleId)
            .select()
            .single();

        if (error) return jsonError('Erro ao atualizar módulo');
        return jsonSuccess({ module, message: 'Módulo atualizado!' });
    } catch (err) {
        return jsonError('Dados inválidos', 400);
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ moduleId: string }> }) {
    const { moduleId } = await params;
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const { error } = await supabase
        .from('product_modules')
        .delete()
        .eq('id', moduleId);

    if (error) return jsonError('Erro ao excluir módulo');
    return jsonSuccess({ message: 'Módulo excluído!' });
}
