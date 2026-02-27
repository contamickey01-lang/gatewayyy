'use client';

import { useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function StoreSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        store_active: false,
        store_name: '',
        store_slug: '',
        store_description: '',
        store_theme: 'light',
        store_banner_url: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data } = await authAPI.getProfile();
            const user = data.user || data; // Handle both {user} and direct object structures

            setForm({
                store_active: user.store_active || false,
                store_name: user.store_name || '',
                store_slug: user.store_slug || '',
                store_description: user.store_description || '',
                store_theme: user.store_theme || 'light',
                store_banner_url: user.store_banner_url || ''
            });
        } catch (error) {
            toast.error('Erro ao carregar configurações da loja');
        } finally {
            setLoading(false);
        }
    };

    const update = (field: string, value: any) => setForm({ ...form, [field]: value });

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data } = await authAPI.updateProfile(form);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            toast.success('Configurações da loja salvas com sucesso!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao salvar loja');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Carregando...</div>;

    const runDebug = async () => {
        const token = localStorage.getItem('token');
        if (!token) return toast.error('Token não encontrado no navegador');

        const loadingToast = toast.loading('Executando diagnóstico...');
        try {
            const res = await fetch(`/api/debug/me?token=${token}`);
            const data = await res.json();
            console.log('DEBUG DATA:', data);

            // Show a summary in a simple alert for the user to copy
            const report = JSON.stringify({
                user_email: data.db_user?.email,
                user_id: data.db_user?.id,
                store_slug: data.db_user?.store_slug,
                store_active: data.db_user?.store_active
            }, null, 2);

            alert(`DIAGNÓSTICO CONCLUÍDO!\n\nCopie este texto e mande para o chat:\n\n${report}`);
            toast.dismiss(loadingToast);
        } catch (err) {
            toast.error('Erro ao executar diagnóstico', { id: loadingToast });
        }
    };

    return (
        <div style={{ maxWidth: 800 }}>
            <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Ativação da Loja</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Defina se sua vitrine pública está visível para clientes.</p>
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.store_active} onChange={e => update('store_active', e.target.checked)} style={{ width: 44, height: 24, appearance: 'none', background: form.store_active ? 'var(--success)' : 'var(--bg-secondary)', borderRadius: 12, position: 'relative', outline: 'none', transition: 'all 0.3s' }} />
                        <span style={{ position: 'absolute', width: 20, height: 20, background: 'white', borderRadius: '50%', transition: 'all 0.3s', transform: `translateX(${form.store_active ? '22px' : '2px'})`, pointerEvents: 'none' }} />
                    </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Nome da Loja</label>
                        <input className="input-field" placeholder="Ex: Cursos do João" value={form.store_name} onChange={e => update('store_name', e.target.value)} />
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

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Pequena Descrição da Loja</label>
                    <textarea className="input-field" rows={3} placeholder="Escreva um recado de boas vindas para quem acessar sua loja..." value={form.store_description} onChange={e => update('store_description', e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Capa da Loja (Banner)</label>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            {form.store_banner_url && (
                                <img src={form.store_banner_url} alt="Banner" style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const formData = new FormData();
                                    formData.append('file', file);

                                    const loadingToast = toast.loading('Enviando imagem...');
                                    try {
                                        const res = await fetch('/api/upload', {
                                            method: 'POST',
                                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                                            body: formData
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error || 'Erro no upload');

                                        update('store_banner_url', data.url);
                                        toast.success('Imagem enviada!', { id: loadingToast });
                                    } catch (err: any) {
                                        toast.error(err.message, { id: loadingToast });
                                    }
                                }}
                                style={{
                                    fontSize: 13,
                                    padding: '6px',
                                    border: '1px dashed var(--border-color)',
                                    borderRadius: 8,
                                    width: '100%',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Tema da Loja</label>
                        <select className="input-field" value={form.store_theme} onChange={e => update('store_theme', e.target.value)} style={{ paddingRight: 32 }}>
                            <option value="light">Claro (Light Mode)</option>
                            <option value="dark">Escuro (Dark Mode)</option>
                        </select>
                    </div>
                </div>

                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: '100%', marginBottom: 12 }}>
                    {saving ? 'Salvando...' : 'Salvar Configurações da Loja'}
                </button>

                <button
                    onClick={runDebug}
                    style={{
                        width: '100%',
                        background: 'none',
                        border: '1px dashed var(--border-color)',
                        color: 'var(--text-secondary)',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        cursor: 'pointer'
                    }}
                >
                    🔍 Não está funcionando? Clique aqui para Diagnosticar
                </button>
            </div>
        </div>
    );
}
