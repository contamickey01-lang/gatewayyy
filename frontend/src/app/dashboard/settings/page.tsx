'use client';

import { useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiSave, FiUser, FiCreditCard, FiKey, FiShoppingBag } from 'react-icons/fi';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState('profile');
    const [form, setForm] = useState({
        name: '', phone: '', cpf_cnpj: '',
        address_street: '', address_number: '', address_complement: '',
        address_neighborhood: '', address_city: '', address_state: '', address_zipcode: '',
        pix_key: '', pix_key_type: 'cpf',
        bank_name: '', bank_agency: '', bank_account: '', bank_account_digit: '', bank_account_type: 'checking',
        store_name: '', store_slug: '', store_description: '', store_active: false
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data } = await authAPI.getProfile();
            const u = data.user;
            setForm({
                name: u.name || '', phone: u.phone || '', cpf_cnpj: u.cpf_cnpj || '',
                address_street: u.address_street || '', address_number: u.address_number || '',
                address_complement: u.address_complement || '', address_neighborhood: u.address_neighborhood || '',
                address_city: u.address_city || '', address_state: u.address_state || '', address_zipcode: u.address_zipcode || '',
                pix_key: u.pix_key || '', pix_key_type: u.pix_key_type || 'cpf',
                bank_name: u.bank_name || '', bank_agency: u.bank_agency || '',
                bank_account: u.bank_account || '',
                bank_account_digit: u.bank_account_digit || '',
                bank_account_type: u.bank_account_type || 'checking',
                store_name: u.store_name || '', store_slug: u.store_slug || '', store_description: u.store_description || '', store_active: u.store_active || false
            });
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data } = await authAPI.updateProfile(form);

            if (data.syncError) {
                const details = data.syncError.details?.map((d: any) => d.message).join(', ') || '';
                toast.error(`Perfil salvo, mas erro no Pagar.me: ${data.syncError.message} ${details}`, { duration: 6000 });
            } else {
                toast.success('Perfil e sincronização atualizados!');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao salvar');
        } finally { setSaving(false); }
    };

    const update = (field: string, value: string) => setForm({ ...form, [field]: value });

    const tabs = [
        { key: 'profile', label: 'Perfil', icon: <FiUser size={16} /> },
        { key: 'bank', label: 'Dados Bancários', icon: <FiCreditCard size={16} /> },
        { key: 'pix', label: 'Chave Pix', icon: <FiKey size={16} /> },
        { key: 'store', label: 'Loja', icon: <FiShoppingBag size={16} /> },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <div style={{ width: 36, height: 36, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 28 }}>Configurações</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--bg-card)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: tab === t.key ? 'rgba(108,92,231,0.15)' : 'transparent',
                        color: tab === t.key ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                        fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all 0.2s ease', fontFamily: 'Inter, sans-serif'
                    }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            <div className="glass-card" style={{ padding: 32, maxWidth: 600 }}>
                {tab === 'profile' && (
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Informações Pessoais</h3>
                        <div style={{ display: 'grid', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Nome completo</label>
                                <input className="input-field" value={form.name} onChange={e => update('name', e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Telefone</label>
                                    <input className="input-field" value={form.phone} onChange={e => update('phone', e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>CPF/CNPJ</label>
                                    <input className="input-field" value={form.cpf_cnpj} onChange={e => update('cpf_cnpj', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Rua</label>
                                <input className="input-field" value={form.address_street} onChange={e => update('address_street', e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Número</label>
                                    <input className="input-field" value={form.address_number} onChange={e => update('address_number', e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Cidade</label>
                                    <input className="input-field" value={form.address_city} onChange={e => update('address_city', e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>UF</label>
                                    <input className="input-field" maxLength={2} value={form.address_state} onChange={e => update('address_state', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'bank' && (
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Dados Bancários</h3>
                        <div style={{ display: 'grid', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Banco (Código)</label>
                                <input className="input-field" placeholder="Ex: 001" value={form.bank_name} onChange={e => update('bank_name', e.target.value)} />
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Use apenas os números do código do banco (ex: 001 para BB, 260 para NuBank).</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Agência</label>
                                    <input className="input-field" placeholder="0001" value={form.bank_agency} onChange={e => update('bank_agency', e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Conta / Dígito</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input className="input-field" placeholder="12345" style={{ flex: 1 }} value={form.bank_account} onChange={e => update('bank_account', e.target.value)} />
                                        <input className="input-field" placeholder="D" style={{ width: 50, textAlign: 'center' }} maxLength={1} value={form.bank_account_digit} onChange={e => update('bank_account_digit', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Tipo de Conta</label>
                                <select className="input-field" value={form.bank_account_type} onChange={e => update('bank_account_type', e.target.value)}>
                                    <option value="checking">Corrente</option>
                                    <option value="savings">Poupança</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'pix' && (
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Chave Pix para Saques</h3>
                        <div style={{ display: 'grid', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Tipo de chave</label>
                                <select className="input-field" value={form.pix_key_type} onChange={e => update('pix_key_type', e.target.value)}>
                                    <option value="cpf">CPF</option>
                                    <option value="cnpj">CNPJ</option>
                                    <option value="email">Email</option>
                                    <option value="phone">Telefone</option>
                                    <option value="random">Aleatória</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Chave Pix</label>
                                <input className="input-field" placeholder="Sua chave Pix" value={form.pix_key} onChange={e => update('pix_key', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'store' && (
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Configurações da Loja</h3>
                        <div style={{ display: 'grid', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Status da Loja</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={form.store_active} onChange={e => setForm({ ...form, store_active: e.target.checked })} style={{ width: 16, height: 16 }} />
                                    <span style={{ fontSize: 14 }}>Ativar Loja Pública</span>
                                </label>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Nome da Loja</label>
                                    <input className="input-field" placeholder="Ex: Minha Loja Digital" value={form.store_name} onChange={e => update('store_name', e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Link / Slug da Loja</label>
                                    <input className="input-field" placeholder="Ex: minhaloja" value={form.store_slug} onChange={e => update('store_slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
                                    {form.store_slug && (
                                        <div style={{ marginTop: 8 }}>
                                            <a href={`/store/${form.store_slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                                                Abrir minha loja ↗
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Descrição da Loja</label>
                                <textarea className="input-field" rows={3} placeholder="Escreva uma breve descrição sobre a sua loja..." value={form.store_description} onChange={e => update('store_description', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                <button className="btn-primary" onClick={handleSave} disabled={saving}
                    style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px' }}>
                    <FiSave size={16} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
    );
}
