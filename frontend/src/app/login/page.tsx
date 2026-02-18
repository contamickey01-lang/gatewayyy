'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await authAPI.login(form);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            toast.success('Login realizado com sucesso!');
            if (data.user.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-primary)', padding: 24, position: 'relative', overflow: 'hidden'
        }}>
            {/* Background glow */}
            <div style={{
                position: 'absolute', top: '20%', left: '30%',
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(108,92,231,0.08) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />

            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: 440, padding: 40, position: 'relative' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, margin: '0 auto 16px',
                        background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 800, color: 'white'
                    }}>P</div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Bem-vindo de volta</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Entre na sua conta para continuar</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <FiMail style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                            <input
                                type="email" className="input-field" placeholder="seu@email.com" required
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                style={{ paddingLeft: 44 }}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Senha</label>
                            <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--accent-secondary)', textDecoration: 'none' }}>Esqueceu a senha?</Link>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <FiLock style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                            <input
                                type="password" className="input-field" placeholder="••••••••" required
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                style={{ paddingLeft: 44 }}
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 28px' }}>
                        {loading ? 'Entrando...' : <>Entrar <FiArrowRight size={16} /></>}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--text-secondary)' }}>
                    Não tem uma conta?{' '}
                    <Link href="/register" style={{ color: 'var(--accent-secondary)', textDecoration: 'none', fontWeight: 600 }}>Cadastre-se</Link>
                </p>
            </div>
        </div>
    );
}
