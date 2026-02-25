export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';
import { PagarmeService } from '@/lib/pagarme';

export async function GET(req: NextRequest) {
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

    // 2. Check a specific Seller Recipient (From screenshot URL)
    // Correct ID from URL: re_cmm13apas2uh40l9trsq2i3dz
    const testSellerId = 're_cmm13apas2uh40l9trsq2i3dz';
    results.seller.id = testSellerId;
    try {
        const data = await PagarmeService.getRecipient(testSellerId);
        results.seller.status = 'OK';
        results.seller.data = { name: data.name, status: data.status };
    } catch (err: any) {
        results.seller.status = 'ERROR';
        results.seller.error = err.response?.data || err.message;
    }

    // 3. Current ID in Database
    try {
        const { data: recipient } = await supabase
            .from('recipients').select('pagarme_recipient_id').limit(1).single();
        results.db_id = recipient?.pagarme_recipient_id || 'NOT_FOUND';
    } catch (e) { }

    return jsonSuccess({ results });
}
