export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { getAuthUser, jsonError, jsonSuccess } from '@/lib/auth';
import { PagarmeService } from '@/lib/pagarme';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    const { data: user } = await supabase
        .from('users')
        .select('*') // Fetch all fields including bank and address info
        .eq('id', auth.user.id)
        .single();

    return jsonSuccess({ user });
}

export async function PUT(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    try {
        const body = await req.json();
        const allowedFields = [
            'name', 'phone', 'cpf_cnpj',
            'address_street', 'address_number', 'address_complement',
            'address_neighborhood', 'address_city', 'address_state', 'address_zipcode',
            'pix_key', 'pix_key_type',
            'bank_name', 'bank_agency', 'bank_account', 'bank_account_digit', 'bank_account_type'
        ];

        const updateData: any = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) updateData[field] = body[field];
        }

        const { data: user, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', auth.user.id)
            .select('*') // Fetch all fields after update
            .single();

        if (error) {
            console.error('Supabase profile update error:', error);
            return jsonError(`Erro ao atualizar perfil: ${error.message}`);
        }


        // Sync with Pagar.me if bank details are provided
        if (body.bank_name && body.bank_agency && body.bank_account) {
            try {
                const { data: existingRecipient } = await supabase
                    .from('recipients')
                    .select('pagarme_recipient_id')
                    .eq('user_id', auth.user.id)
                    .single();

                const cleanBankCode = body.bank_name?.replace(/\D/g, '').substring(0, 3);
                const cleanAgency = body.bank_agency?.replace(/\D/g, '');
                const cleanAccount = body.bank_account?.replace(/\D/g, '');

                if (!user.cpf_cnpj) {
                    return jsonError('É necessário salvar seu CPF/CNPJ antes de configurar os dados bancários');
                }

                const recipientData = {
                    name: user.name,
                    email: user.email,
                    cpf_cnpj: user.cpf_cnpj.replace(/\D/g, ''),
                    type: user.cpf_cnpj?.replace(/\D/g, '').length > 11 ? 'company' : 'individual',
                    bank_code: cleanBankCode,
                    agency: cleanAgency,
                    account: cleanAccount,
                    account_digit: body.bank_account_digit || '0',
                    account_type: body.bank_account_type || 'checking'
                };

                if (existingRecipient && !existingRecipient.pagarme_recipient_id.startsWith('re_test_')) {
                    // Update existing real recipient
                    await PagarmeService.updateRecipient(existingRecipient.pagarme_recipient_id, recipientData);
                } else {
                    // Create new recipient
                    const pRecipient = await PagarmeService.createRecipient(recipientData);

                    if (existingRecipient) {
                        // Update the test record to a real one
                        await supabase
                            .from('recipients')
                            .update({ pagarme_recipient_id: pRecipient.id, status: 'active' })
                            .eq('user_id', auth.user.id);
                    } else {
                        // Create new record
                        await supabase.from('recipients').insert({
                            id: uuidv4(),
                            user_id: auth.user.id,
                            pagarme_recipient_id: pRecipient.id,
                            status: 'active'
                        });
                    }
                }
            } catch (pError: any) {
                const errorDetail = pError.response?.data?.message || pError.message;
                console.error('Pagar.me sync error:', JSON.stringify(pError.response?.data || pError.message, null, 2));
                return jsonError(`Erro ao configurar recebedor no Pagar.me: ${errorDetail}`);
            }
        }

        return jsonSuccess({ user, message: 'Perfil e dados bancários atualizados' });
    } catch (err) {
        console.error('Update profile error:', err);
        return jsonError('Erro interno do servidor', 500);
    }
}
