export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth || auth.user.role !== 'admin') return jsonError('Não autorizado', 403);

    const { data: settings } = await supabase
        .from('platform_settings').select('*').limit(1).single();

    return jsonSuccess({
        settings: settings || {
            fee_percentage: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '15')
        }
    });
}
