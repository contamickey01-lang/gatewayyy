export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) return jsonError('Email é obrigatório');

        // Check if user exists (don't reveal if it does or not for security)
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        // Always return success for security (don't reveal if email exists)
        return jsonSuccess({ message: 'Se o email existir, as instruções de recuperação serão enviadas.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        return jsonError('Erro interno do servidor', 500);
    }
}
