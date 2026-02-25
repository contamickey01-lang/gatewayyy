export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';
import { PagarmeService } from '@/lib/pagarme';

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth || auth.user.role !== 'admin') return jsonError('Não autorizado', 403);

    const platformRecipientId = process.env.PLATFORM_RECIPIENT_ID;
    const results: any = {
        platform: { id: platformRecipientId, status: 'checking', data: null, error: null },
        seller: { id: null, status: 'checking', data: null, error: null }
    };

    // 1. Check Platform Recipient
    if (platformRecipientId) {
        try {
            const data = await PagarmeService.getRecipient(platformRecipientId);
            results.platform.status = 'OK';
            results.platform.data = { name: data.name, status: data.status };
        } catch (err: any) {
            results.platform.status = 'ERROR';
            results.platform.error = err.response?.data || err.message;
        }
    } else {
        results.platform.status = 'MISSING';
    }

    // 2. Check a sample Seller Recipient (Ana Clara)
    try {
        const { data: recipient } = await supabase
            .from('recipients').select('pagarme_recipient_id').eq('user_id', auth.user.id).single();

        if (recipient?.pagarme_recipient_id) {
            results.seller.id = recipient.pagarme_recipient_id;
            try {
                const data = await PagarmeService.getRecipient(recipient.pagarme_recipient_id);
                results.seller.status = 'OK';
                results.seller.data = { name: data.name, status: data.status };
            } catch (err: any) {
                results.seller.status = 'ERROR';
                results.seller.error = err.response?.data || err.message;
            }
        } else {
            results.seller.status = 'NOT_FOUND_IN_DB';
        }
    } catch (dbErr: any) {
        results.seller.status = 'DB_ERROR';
        results.seller.error = dbErr.message;
    }

    return jsonSuccess({ results });
}
