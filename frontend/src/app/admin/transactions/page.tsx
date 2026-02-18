'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { FiList } from 'react-icons/fi';

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ type: '', status: '' });

    useEffect(() => { loadTransactions(); }, []);

    const loadTransactions = async () => {
        try {
            const params: any = {};
            if (filter.type) params.type = filter.type;
            if (filter.status) params.status = filter.status;
            const { data } = await adminAPI.listTransactions(params);
            setTransactions(data.transactions || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const typeLabels: Record<string, string> = { sale: 'Venda', fee: 'Taxa', refund: 'Estorno', withdrawal: 'Saque' };
    const typeColors: Record<string, string> = { sale: 'badge-success', fee: 'badge-info', refund: 'badge-danger', withdrawal: 'badge-warning' };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <div style={{ width: 36, height: 36, border: '3px solid var(--border-color)', borderTopColor: '#ff6b6b', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700 }}>Transações</h1>
                <div style={{ display: 'flex', gap: 10 }}>
                    <select className="input-field" value={filter.type} onChange={e => { setFilter({ ...filter, type: e.target.value }); }} style={{ width: 160 }}>
                        <option value="">Todos os tipos</option>
                        <option value="sale">Vendas</option>
                        <option value="fee">Taxas</option>
                        <option value="refund">Estornos</option>
                        <option value="withdrawal">Saques</option>
                    </select>
                    <button className="btn-secondary" onClick={() => { setLoading(true); loadTransactions(); }} style={{ padding: '10px 20px' }}>Filtrar</button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {transactions.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Tipo</th><th>Vendedor</th><th>Valor</th><th>Status</th><th>Descrição</th><th>Data</th></tr>
                            </thead>
                            <tbody>
                                {transactions.map((t: any) => (
                                    <tr key={t.id}>
                                        <td><span className={`badge ${typeColors[t.type] || 'badge-neutral'}`}>{typeLabels[t.type] || t.type}</span></td>
                                        <td style={{ fontSize: 13 }}>{t.users?.name || '—'}</td>
                                        <td style={{ fontWeight: 600, color: t.type === 'refund' ? 'var(--danger)' : 'var(--success)' }}>
                                            {t.type === 'refund' ? '-' : ''}R$ {t.amount_display}
                                        </td>
                                        <td>
                                            <span className={`badge ${t.status === 'confirmed' ? 'badge-success' : t.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                                                {t.status === 'confirmed' ? 'Confirmado' : t.status === 'pending' ? 'Pendente' : t.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {t.description || '—'}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
                        <FiList size={36} style={{ opacity: 0.4, marginBottom: 12 }} />
                        <p>Nenhuma transação encontrada</p>
                    </div>
                )}
            </div>
        </div>
    );
}
