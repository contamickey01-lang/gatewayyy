export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const slug = req.nextUrl.searchParams.get('slug');

    // 1. Check all users with store_slug
    const { data: allStoreUsers, error: err1 } = await supabase
        .from('users')
        .select('id, email, store_name, store_slug, store_active');

    // 2. Check specifically for the requested slug
    const { data: specificUser, error: err2 } = await supabase
        .from('users')
        .select('*')
        .ilike('store_slug', slug || '');

    return jsonSuccess({
        requested_slug: slug,
        all_stores_in_db: allStoreUsers || [],
        error_fetching_all: err1,
        specific_lookup_result: specificUser || [],
        error_fetching_specific: err2,
        timestamp: new Date().toISOString()
    });
}
