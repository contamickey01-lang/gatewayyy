import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: order } = await supabase
        .from('orders').select('id, status, amount_display, payment_method, created_at').eq('id', id).single();

    if (!order) return jsonError('Pedido não encontrado', 404);
    return jsonSuccess({ order });
}
