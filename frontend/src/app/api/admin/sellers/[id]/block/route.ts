import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const auth = await getAuthUser(req);
    if (!auth || auth.user.role !== 'admin') return jsonError('Não autorizado', 403);

    try {
        const { blocked } = await req.json();
        const newStatus = blocked ? 'blocked' : 'active';

        const { error } = await supabase
            .from('users').update({ status: newStatus }).eq('id', id).eq('role', 'seller');

        if (error) return jsonError('Erro ao atualizar vendedor');

        return jsonSuccess({ message: `Vendedor ${blocked ? 'bloqueado' : 'desbloqueado'}` });
    } catch {
        return jsonError('Erro interno', 500);
    }
}
