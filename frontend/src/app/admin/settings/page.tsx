'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiSave, FiPercent } from 'react-icons/fi';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feePercentage, setFeePercentage] = useState('15');
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        adminAPI.getSettings()
            .then(res => {
                setSettings(res.data.settings);
                setFeePercentage(res.data.settings?.fee_percentage?.toString() || '15');
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        const value = parseFloat(feePercentage);
        if (isNaN(value) || value < 0 || value > 100) {
            return toast.error('Porcentagem deve ser entre 0 e 100');
        }
        setSaving(true);
        try {
            await adminAPI.updateFees(value);
            toast.success(`Taxa atualizada para ${value}%`);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

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
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 28 }}>Configurações da Plataforma</h1>

            <div className="glass-card" style={{ padding: 32, maxWidth: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12, background: 'rgba(255,107,107,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)'
                    }}>
                        <FiPercent size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Taxa da Plataforma</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Porcentagem retida em cada venda</p>
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        Porcentagem (%)
                    </label>
                    <input type="number" step="0.5" min="0" max="100" className="input-field"
                        value={feePercentage} onChange={e => setFeePercentage(e.target.value)} />
                </div>

                <div style={{
                    padding: 16, borderRadius: 12, background: 'rgba(108,92,231,0.06)',
                    border: '1px solid rgba(108,92,231,0.12)', marginBottom: 24
                }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Exemplo de divisão para venda de R$ 100,00:</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Vendedor recebe</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }}>
                                R$ {(100 - parseFloat(feePercentage || '0')).toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Plataforma recebe</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)' }}>
                                R$ {parseFloat(feePercentage || '0').toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                <button className="btn-primary" onClick={handleSave} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px' }}>
                    <FiSave size={16} /> {saving ? 'Salvando...' : 'Salvar Taxa'}
                </button>
            </div>
        </div>
    );
}
