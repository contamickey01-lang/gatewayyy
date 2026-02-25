import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
    const { lessonId } = await params;
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    try {
        const body = await req.json();
        const updates: any = { ...body, updated_at: new Date().toISOString() };

        const { data: lesson, error } = await supabase
            .from('product_lessons')
            .update(updates)
            .eq('id', lessonId)
            .select()
            .single();

        if (error) return jsonError('Erro ao atualizar aula');
        return jsonSuccess({ lesson, message: 'Aula atualizada!' });
    } catch (err) {
        return jsonError('Dados inválidos', 400);
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
    const { lessonId } = await params;
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const { error } = await supabase
        .from('product_lessons')
        .delete()
        .eq('id', lessonId);

    if (error) return jsonError('Erro ao excluir aula');
    return jsonSuccess({ message: 'Aula excluída!' });
}
