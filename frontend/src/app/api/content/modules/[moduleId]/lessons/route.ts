import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ moduleId: string }> }) {
    const { moduleId } = await params;
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const { data: lessons, error } = await supabase
        .from('product_lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order', { ascending: true });

    if (error) return jsonError('Erro ao carregar aulas');
    return jsonSuccess({ lessons });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ moduleId: string }> }) {
    const { moduleId } = await params;
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    try {
        const body = await req.json();

        const { data: lesson, error } = await supabase
            .from('product_lessons')
            .insert({
                module_id: moduleId,
                title: body.title,
                description: body.description,
                video_url: body.video_url,
                video_source: body.video_source || 'youtube',
                order: body.order || 0,
                content: body.content
            })
            .select()
            .single();

        if (error) return jsonError('Erro ao criar aula');
        return jsonSuccess({ lesson, message: 'Aula criada com sucesso!' }, 201);
    } catch (err) {
        return jsonError('Dados inválidos', 400);
    }
}
