import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params;
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const { data: modules, error } = await supabase
        .from('product_modules')
        .select('*')
        .eq('product_id', productId)
        .order('order', { ascending: true });

    if (error) return jsonError('Erro ao carregar módulos');
    return jsonSuccess({ modules });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params;
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    try {
        const { title, order } = await req.json();

        const { data: module, error } = await supabase
            .from('product_modules')
            .insert({ product_id: productId, title, order: order || 0 })
            .select()
            .single();

        if (error) return jsonError('Erro ao criar módulo');
        return jsonSuccess({ module, message: 'Módulo criado com sucesso!' }, 201);
    } catch (err) {
        return jsonError('Dados inválidos', 400);
    }
}
