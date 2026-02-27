export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { jsonSuccess, jsonError } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const slug = req.nextUrl.searchParams.get('slug');

    try {
        // 1. Get ALL users with ANY store info to see what's in the DB
        const { data: allUsers, error: err1 } = await supabase
            .from('users')
            .select('id, email, store_name, store_slug, store_active, name');

        // 2. Try to find the specific slug
        const { data: specificUser, error: err2 } = await supabase
            .from('users')
            .select('id, store_slug, store_active, store_name')
            .ilike('store_slug', slug || 'NOT_PROVIDED');

        return jsonSuccess({
            status: "Debug data loaded",
            requested_slug: slug,
            total_users_checked: allUsers?.length || 0,
            all_users_store_status: allUsers?.map(u => ({
                email: u.email,
                name: u.name,
                slug: u.store_slug,
                active: u.store_active,
                has_active_bool: typeof u.store_active === 'boolean'
            })),
            specific_lookup: {
                found: specificUser && specificUser.length > 0,
                data: specificUser || [],
                error: err2
            },
            db_error: err1,
            server_time: new Date().toISOString()
        });
    } catch (e: any) {
        return jsonError(e.message);
    }
}
