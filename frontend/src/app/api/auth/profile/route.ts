export const dynamic = 'force-dynamic';
// Last update: 2026-02-25 10:59

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

const BANK_CODES: Record<string, string> = {
    'nubank': '260', 'inter': '077', 'bradesco': '237', 'itau': '341', 'santander': '033',
    'caixa': '104', 'banco do brasil': '001', 'bb': '001', 'pagbank': '290', 'pagseguro': '290',
    'mercado pago': '323', 'c6': '336', 'picpay': '380', 'btg': '208',
};

export async function PUT(req: NextRequest) {
    const auth = await getAuthUser(req);
    if (!auth) return jsonError('Não autorizado', 401);

    try {
        // Fetch old user to detect changes in critical fields (like document)
        const { data: oldUser } = await supabase
            .from('users')
            .select('cpf_cnpj')
            .eq('id', auth.user.id)
            .single();

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
            if (body[field] !== undefined) {
                // Handle document strings: trim and convert empty to null
                if (field === 'cpf_cnpj') {
                    const value = typeof body[field] === 'string' ? body[field].trim() : body[field];
                    updateData[field] = value === '' ? null : value;
                } else {
                    updateData[field] = body[field];
                }
            }
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

                // Detect if the document (CPF/CNPJ) changed
                const oldDoc = oldUser?.cpf_cnpj?.replace(/\D/g, '');
                const newDoc = user.cpf_cnpj?.replace(/\D/g, '');
                const documentChanged = oldDoc && newDoc && oldDoc !== newDoc;

                // Handle Bank Code Mapping
                let cleanBankCode = body.bank_name?.replace(/\D/g, '').substring(0, 3);
                if (!cleanBankCode && body.bank_name) {
                    const searchName = body.bank_name.toLowerCase().trim();
                    for (const [name, code] of Object.entries(BANK_CODES)) {
                        if (searchName.includes(name)) {
                            cleanBankCode = code;
                            break;
                        }
                    }
                }

                const cleanAgency = body.bank_agency?.replace(/\D/g, '');
                const cleanAccount = body.bank_account?.replace(/\D/g, '');

                if (!user.cpf_cnpj) {
                    return jsonError('É necessário salvar seu CPF/CNPJ antes de configurar os dados bancários');
                }

                const recipientData = {
                    name: user.name,
                    email: user.email,
                    cpf_cnpj: newDoc,
                    type: newDoc.length > 11 ? 'company' : 'individual',
                    bank_code: cleanBankCode || '001',
                    agency: cleanAgency,
                    account: cleanAccount,
                    account_digit: body.bank_account_digit || '0',
                    account_type: body.bank_account_type || 'checking'
                };

                // Logic: 
                // 1. If no recipient exists OR document changed -> Create NEW recipient
                // 2. If recipient exists AND document is same -> Update EXISTING recipient

                const isTestRecipient = existingRecipient?.pagarme_recipient_id?.startsWith('re_test_');

                if (existingRecipient && !documentChanged && !isTestRecipient) {
                    // Update existing real recipient
                    await PagarmeService.updateRecipient(existingRecipient.pagarme_recipient_id, recipientData);
                } else {
                    // Create new recipient (either first time or replacement due to CPF change)
                    const pRecipient = await PagarmeService.createRecipient(recipientData);

                    // Update local database with the new ID
                    if (existingRecipient) {
                        await supabase
                            .from('recipients')
                            .update({ pagarme_recipient_id: pRecipient.id, status: 'active' })
                            .eq('user_id', auth.user.id);
                    } else {
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
