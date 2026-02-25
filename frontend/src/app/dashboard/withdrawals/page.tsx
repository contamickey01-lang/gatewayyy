'use client';

import { useEffect, useState } from 'react';
import { withdrawalsAPI, authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiDollarSign, FiArrowDown, FiClock, FiCheckCircle, FiXCircle, FiInfo, FiLock, FiAlertTriangle } from 'react-icons/fi';

export default function WithdrawalsPage() {
    const [balance, setBalance] = useState<any>(null);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [balanceRes, withdrawalsRes] = await Promise.all([
                withdrawalsAPI.getBalance(),
                withdrawalsAPI.list()
            ]);
            setBalance(balanceRes.data);
            setWithdrawals(withdrawalsRes.data.withdrawals || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setVerifying(true);
        try {
            const { data } = await authAPI.getKycLink();
            if (data.url) {
                window.open(data.url, '_blank');
                toast.success('Link de verificação aberto em nova aba!');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao gerar link de verificação');
        } finally {
            setVerifying(false);
        }
    };

    const handleWithdraw = async () => {
        const value = parseFloat(amount);
        if (!value || value < 5) return toast.error('O valor mínimo para saque é R$ 5,00');
        if (value > parseFloat(balance?.available || '0')) return toast.error('Saldo insuficiente');

        setRequesting(true);
        try {
            await withdrawalsAPI.request(value);
            toast.success('Saque solicitado com sucesso!');
            setAmount('');
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao solicitar saque');
        } finally {
            setRequesting(false);
        }
    };

    const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
        pending: { icon: <FiClock size={14} />, color: 'var(--warning)', label: 'Pendente' },
        processing: { icon: <FiClock size={14} />, color: 'var(--info)', label: 'Processando' },
        completed: { icon: <FiCheckCircle size={14} />, color: 'var(--success)', label: 'Concluído' },
        failed: { icon: <FiXCircle size={14} />, color: 'var(--danger)', label: 'Falhou' },
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <div style={{ width: 36, height: 36, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const needsVerification = balance?.recipient_status !== 'active';

    return (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 28 }}>Saques</h1>

            {/* Verification Notice */}
            {needsVerification && (
                <div className="glass-card" style={{
                    padding: 24,
                    marginBottom: 32,
                    border: '1px solid rgba(255, 171, 0, 0.2)',
                    background: 'linear-gradient(135deg, rgba(255, 171, 0, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 20,
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: 'rgba(255, 171, 0, 0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#ffab00'
                        }}>
                            <FiLock size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#fff' }}>Ative a movimentação do seu saldo</h3>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, maxWidth: 500 }}>
                                Para liberar saques e movimentar seu saldo, o Pagar.me exige a verificação de identidade (foto do documento e rosto). Seus dados são processados com total segurança pelo Pagar.me, uma instituição de pagamentos regulamentada pelo Banco Central do Brasil.
                            </p>
                        </div>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={handleVerify}
                        disabled={verifying}
                        style={{
                            background: '#ffab00',
                            color: '#000',
                            fontWeight: 700,
                            padding: '12px 24px'
                        }}
                    >
                        {verifying ? 'Gerando link...' : 'Fazer Verificação Agora'}
                    </button>
                </div>
            )}

            {/* Balance Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
                {[
                    { label: 'Saldo Disponível', value: balance?.available || '0.00', color: '#00cec9', icon: <FiDollarSign size={20} /> },
                    { label: 'A Receber', value: balance?.pending || '0.00', color: '#fdcb6e', icon: <FiClock size={20} /> },
                    { label: 'Total Vendido', value: balance?.total_sold || '0.00', color: '#6c5ce7', icon: <FiArrowDown size={20} /> },
                    { label: 'Total Sacado', value: balance?.total_withdrawn || '0.00', color: '#74b9ff', icon: <FiCheckCircle size={20} /> },
                ].map((card, i) => (
                    <div key={i} className="stat-card">
                        <div style={{
                            width: 40, height: 40, borderRadius: 10, marginBottom: 16,
                            background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: card.color
                        }}>{card.icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>R$ {card.value}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Withdraw Form */}
            <div className={`glass-card ${needsVerification ? 'disabled-section' : ''}`} style={{
                padding: 28,
                marginBottom: 32,
                opacity: needsVerification ? 0.6 : 1,
                pointerEvents: needsVerification ? 'none' : 'auto',
                position: 'relative'
            }}>
                {needsVerification && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 10, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: 16
                    }}>
                        <div style={{ background: '#1a1a1a', padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#ffab00', border: '1px solid #ffab00' }}>
                            <FiLock size={12} style={{ marginRight: 6 }} /> Verificação pendente
                        </div>
                    </div>
                )}
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Solicitar Saque via Pix</h3>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Valor (R$)</label>
                        <input type="number" step="0.01" min="5" className="input-field" placeholder="0.00"
                            value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <button className="btn-primary" onClick={handleWithdraw} disabled={requesting || needsVerification}
                        style={{ padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiArrowDown size={16} />
                        {requesting ? 'Processando...' : 'Solicitar Saque'}
                    </button>
                </div>

                <div style={{
                    display: 'flex', flexDirection: 'column', gap: 8, padding: 16,
                    background: 'rgba(255,107,107,0.06)', borderRadius: 12, border: '1px solid rgba(255,107,107,0.1)'
                }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiInfo size={16} color="#ff6b6b" /> Informações Importantes:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <li>O valor mínimo para saque é de <strong>R$ 5,00</strong>.</li>
                        <li>Cada transferência possui uma taxa de <strong>R$ 3,67</strong> (cobrada pelo Pagar.me).</li>
                        <li>O valor será transferido para a chave Pix cadastrada no seu perfil.</li>
                    </ul>
                </div>
            </div>

            {/* Withdrawal History */}
            <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Histórico de Saques</h3>
                {withdrawals.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Valor</th>
                                    <th>Chave Pix</th>
                                    <th>Status</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.map((w: any) => {
                                    const st = statusConfig[w.status] || statusConfig.pending;
                                    return (
                                        <tr key={w.id}>
                                            <td style={{ fontWeight: 600 }}>R$ {w.amount_display}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{w.pix_key || '—'}</td>
                                            <td>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: st.color, fontSize: 13, fontWeight: 500 }}>
                                                    {st.icon} {st.label}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                                {new Date(w.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <FiArrowDown size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                        <p>Nenhum saque realizado ainda</p>
                    </div>
                )}
            </div>
        </div>
    );
}
