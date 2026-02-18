export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth || auth.user.role !== 'admin') return jsonError('Não autorizado', 403);

    const search = req.nextUrl.searchParams.get('search') || '';

    let query = supabase
        .from('users')
        .select('id, name, email, cpf_cnpj, status, created_at')
        .eq('role', 'seller')
        .order('created_at', { ascending: false });

    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: sellers } = await query;

    return jsonSuccess({ sellers: sellers || [] });
}
