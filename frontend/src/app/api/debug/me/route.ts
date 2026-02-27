export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getAuthUser, jsonSuccess, jsonError, verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/db';

export async function GET(req: NextRequest) {
    let auth = await getAuthUser(req);

    // Fallback: manually check token in query for browser debugging
    if (!auth) {
        const token = req.nextUrl.searchParams.get('token');
        if (token) {
            try {
                const decoded: any = verifyToken(token);
                const { data: users } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', decoded.userId || decoded.id);
                if (users?.[0]) auth = { user: users[0] };
            } catch (e) { }
        }
    }

    if (!auth) return jsonError('Not authenticated. Pass ?token=YOUR_TOKEN', 401);

    // Fetch fresh from DB
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('id', auth.user.id);

    const dbUser = users?.[0];

    return jsonSuccess({
        session_user: auth.user,
        db_user: dbUser,
        server_time: new Date().toISOString()
    });
}
