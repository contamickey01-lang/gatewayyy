import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: lessonId } = await params;
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    // 1. Fetch lesson and check if it has a module
    const { data: lesson, error: lessonError } = await supabase
        .from('product_lessons')
        .select(`
            *,
            product_modules (
                product_id
            )
        `)
        .eq('id', lessonId)
        .single();

    if (lessonError || !lesson) return jsonError('Aula não encontrada', 404);

    const productId = lesson.product_modules.product_id;

    // 2. Check enrollment for this product
    const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('product_id', productId)
        .eq('status', 'active')
        .single();

    if (enrollError || !enrollment) {
        return jsonError('Acesso negado à aula', 403);
    }

    // 3. Fetch lesson files
    const { data: files } = await supabase
        .from('product_files')
        .select('*')
        .eq('lesson_id', lessonId);

    return jsonSuccess({
        lesson: {
            ...lesson,
            product_modules: undefined, // cleaner response
            files: files || []
        }
    });
}
