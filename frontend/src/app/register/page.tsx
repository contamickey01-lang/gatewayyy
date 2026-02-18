'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiArrowRight, FiFileText } from 'react-icons/fi';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '', cpf_cnpj: '', phone: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            return toast.error('As senhas não coincidem');
        }
        setLoading(true);
        try {
            const { data } = await authAPI.register({
                name: form.name,
                email: form.email,
                password: form.password,
                cpf_cnpj: form.cpf_cnpj,
                phone: form.phone
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            toast.success('Conta criada com sucesso!');
            router.push('/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    const update = (field: string, value: string) => setForm({ ...form, [field]: value });

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-primary)', padding: 24, position: 'relative', overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute', bottom: '10%', right: '20%',
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(162,155,254,0.06) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />

            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: 480, padding: 40, position: 'relative' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, margin: '0 auto 16px',
                        background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 800, color: 'white'
                    }}>P</div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Criar sua conta</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Comece a vender online em minutos</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Nome completo</label>
                            <input type="text" className="input-field" placeholder="Seu nome" required
                                value={form.name} onChange={e => update('name', e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Telefone</label>
                            <input type="tel" className="input-field" placeholder="(11) 99999-9999"
                                value={form.phone} onChange={e => update('phone', e.target.value)} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
                        <input type="email" className="input-field" placeholder="seu@email.com" required
                            value={form.email} onChange={e => update('email', e.target.value)} />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>CPF ou CNPJ</label>
                        <input type="text" className="input-field" placeholder="000.000.000-00" required
                            value={form.cpf_cnpj} onChange={e => update('cpf_cnpj', e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Senha</label>
                            <input type="password" className="input-field" placeholder="••••••••" required minLength={6}
                                value={form.password} onChange={e => update('password', e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Confirmar</label>
                            <input type="password" className="input-field" placeholder="••••••••" required minLength={6}
                                value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 28px' }}>
                        {loading ? 'Criando conta...' : <>Criar Conta <FiArrowRight size={16} /></>}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
                    Já possui conta?{' '}
                    <Link href="/login" style={{ color: 'var(--accent-secondary)', textDecoration: 'none', fontWeight: 600 }}>Entrar</Link>
                </p>
            </div>
        </div>
    );
}
