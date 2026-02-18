export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { comparePassword, generateToken, jsonError, jsonSuccess } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return jsonError('Email e senha são obrigatórios');
        }

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (!user) return jsonError('Credenciais inválidas', 401);
        if (user.status === 'blocked') return jsonError('Conta bloqueada', 403);

        const validPassword = await comparePassword(password, user.password);
        if (!validPassword) return jsonError('Credenciais inválidas', 401);

        const token = generateToken({ id: user.id, role: user.role });

        return jsonSuccess({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Login error:', err);
        return jsonError('Erro interno do servidor', 500);
    }
}
