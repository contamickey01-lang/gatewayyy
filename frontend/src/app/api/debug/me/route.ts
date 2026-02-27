export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getAuthUser, jsonSuccess, jsonError } from '@/lib/auth';
import { supabase } from '@/lib/db';

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Not authenticated', 401);

    // Fetch fresh from DB
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('id', auth.user.id);

    const dbUser = users?.[0];

    return jsonSuccess({
        session_user: auth.user,
        db_user: dbUser,
        token_preview: auth.token.substring(0, 20) + '...',
        server_time: new Date().toISOString()
    });
}
