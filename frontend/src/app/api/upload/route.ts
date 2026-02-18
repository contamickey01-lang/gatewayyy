export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return jsonError('Nenhum arquivo enviado');
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return jsonError('Apenas imagens são permitidas');
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return jsonError('Imagem muito grande (máximo 5MB)');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${auth.user.id}/${fileName}`;

        const buffer = await file.arrayBuffer();

        const { data, error } = await supabase.storage
            .from('products')
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Storage upload error:', error);
            return jsonError('Erro ao subir imagem: ' + error.message);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

        return jsonSuccess({ url: publicUrl });
    } catch (err: any) {
        console.error('Upload error:', err);
        return jsonError('Erro interno no servidor', 500);
    }
}
