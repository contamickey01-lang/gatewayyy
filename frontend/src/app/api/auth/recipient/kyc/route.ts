import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';
import { PagarmeService } from '@/lib/pagarme';

export async function POST(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    try {
        const { data: recipient } = await supabase
            .from('recipients')
            .select('pagarme_recipient_id')
            .eq('user_id', auth.user.id)
            .single();

        if (!recipient?.pagarme_recipient_id) {
            return jsonError('Recebedor não encontrado. Complete seu perfil primeiro.');
        }

        if (recipient.pagarme_recipient_id.startsWith('re_test_')) {
            return jsonError('Verificação não disponível em modo de teste.');
        }

        const kyc = await PagarmeService.createKycLink(recipient.pagarme_recipient_id);

        return jsonSuccess({
            url: kyc.url,
            expires_at: kyc.expires_at
        });
    } catch (err: any) {
        console.error('KYC Link Error:', err.response?.data || err.message);
        const message = err.response?.data?.message || 'Erro ao gerar link de verificação';
        return jsonError(message, 500);
    }
}
