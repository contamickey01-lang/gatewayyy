const { supabase } = require('../config/database');
const pagarmeService = require('../services/pagarme.service');

class WithdrawalController {
    async request(req, res, next) {
        try {
            const { amount } = req.body;
            const userId = req.user.id;

            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Valor inválido.' });
            }

            const amountCents = Math.round(amount * 100);

            // Calculate available balance
            const balance = await this._calculateBalance(userId);

            if (amountCents > balance.available) {
                return res.status(400).json({
                    error: 'Saldo insuficiente.',
                    available: (balance.available / 100).toFixed(2)
                });
            }

            // Get recipient
            const { data: recipient } = await supabase
                .from('recipients')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'active')
                .single();

            if (!recipient?.pagarme_recipient_id) {
                return res.status(400).json({ error: 'Conta de recebimento não encontrada.' });
            }

            // Create withdrawal record
            const { data: withdrawal, error } = await supabase
                .from('withdrawals')
                .insert({
                    user_id: userId,
                    amount: amountCents,
                    status: 'processing',
                    pix_key: req.user.pix_key,
                    pix_key_type: req.user.pix_key_type
                })
                .select()
                .single();

            if (error) throw error;

            // Create transfer on Pagar.me
            try {
                const transfer = await pagarmeService.createTransfer(
                    recipient.pagarme_recipient_id,
                    amountCents
                );

                await supabase
                    .from('withdrawals')
                    .update({
                        pagarme_transfer_id: transfer.id,
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', withdrawal.id);

                // Create withdrawal transaction
                await supabase.from('transactions').insert({
                    user_id: userId,
                    type: 'withdrawal',
                    amount: amountCents,
                    status: 'confirmed',
                    description: `Saque via Pix: R$${amount.toFixed(2)}`
                });

                res.json({
                    message: 'Saque realizado com sucesso!',
                    withdrawal: {
                        id: withdrawal.id,
                        amount: (amountCents / 100).toFixed(2),
                        status: 'completed'
                    }
                });
            } catch (transferError) {
                await supabase
                    .from('withdrawals')
                    .update({
                        status: 'failed',
                        failure_reason: transferError.message,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', withdrawal.id);

                return res.status(500).json({
                    error: 'Falha ao processar saque.',
                    details: transferError.response?.data?.message || transferError.message
                });
            }
        } catch (error) {
            next(error);
        }
    }

    async list(req, res, next) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const { data, count, error } = await supabase
                .from('withdrawals')
                .select('*', { count: 'exact' })
                .eq('user_id', req.user.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            res.json({
                withdrawals: data?.map(w => ({
                    ...w,
                    amount_display: (w.amount / 100).toFixed(2)
                })),
                total: count,
                page: parseInt(page)
            });
        } catch (error) {
            next(error);
        }
    }

    async getBalance(req, res, next) {
        try {
            const balance = await this._calculateBalance(req.user.id);

            res.json({
                available: (balance.available / 100).toFixed(2),
                pending: (balance.pending / 100).toFixed(2),
                total_sold: (balance.totalSold / 100).toFixed(2),
                total_withdrawn: (balance.totalWithdrawn / 100).toFixed(2),
                total_fees: (balance.totalFees / 100).toFixed(2)
            });
        } catch (error) {
            next(error);
        }
    }

    async _calculateBalance(userId) {
        // Total confirmed sales
        const { data: sales } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'sale')
            .eq('status', 'confirmed');

        const totalSold = sales?.reduce((sum, t) => sum + t.amount, 0) || 0;

        // Total fees
        const { data: fees } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'fee')
            .eq('status', 'confirmed');

        const totalFees = fees?.reduce((sum, t) => sum + t.amount, 0) || 0;

        // Total withdrawn
        const { data: withdrawals } = await supabase
            .from('withdrawals')
            .select('amount')
            .eq('user_id', userId)
            .eq('status', 'completed');

        const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

        // Pending sales
        const { data: pending } = await supabase
            .from('orders')
            .select('amount')
            .eq('seller_id', userId)
            .eq('status', 'pending');

        const pendingAmount = pending?.reduce((sum, o) => sum + o.amount, 0) || 0;

        // Refunds 
        const { data: refunds } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('type', 'refund')
            .eq('status', 'confirmed');

        const totalRefunds = refunds?.reduce((sum, t) => sum + t.amount, 0) || 0;

        const available = totalSold - totalWithdrawn - totalRefunds;

        return {
            available: Math.max(0, available),
            pending: pendingAmount,
            totalSold,
            totalWithdrawn,
            totalFees,
            totalRefunds
        };
    }
}

module.exports = new WithdrawalController();
