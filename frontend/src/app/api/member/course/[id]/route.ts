import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: productId } = await params;
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    // 1. Check enrollment
    const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('product_id', productId)
        .eq('status', 'active')
        .single();

    if (enrollError || !enrollment) {
        return jsonError('Você não tem acesso a este conteúdo', 403);
    }

    // 2. Fetch modules with lessons
    const { data: modules, error: modulesError } = await supabase
        .from('product_modules')
        .select(`
            id,
            title,
            order,
            product_lessons (
                id,
                title,
                description,
                order
            )
        `)
        .eq('product_id', productId)
        .order('order', { ascending: true });

    if (modulesError) return jsonError('Erro ao carregar conteúdo');

    // Sort lessons within modules manually
    const sortedModules = (modules || []).map((m: any) => ({
        ...m,
        lessons: (m.product_lessons || []).sort((a: any, b: any) => a.order - b.order)
    }));

    return jsonSuccess({ modules: sortedModules });
}
