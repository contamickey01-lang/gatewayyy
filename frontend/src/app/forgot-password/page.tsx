'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiMail, FiArrowLeft } from 'react-icons/fi';

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.forgotPassword(email);
            setSent(true);
            toast.success('Email de recuperação enviado!');
        } catch {
            toast.error('Erro ao enviar email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-primary)', padding: 24
        }}>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: 440, padding: 40 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, margin: '0 auto 16px',
                        background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 800, color: 'white'
                    }}>P</div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Recuperar senha</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        {sent ? 'Verifique seu email para as instruções' : 'Digite seu email para receber um link de recuperação'}
                    </p>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Email</label>
                            <input type="email" className="input-field" placeholder="seu@email.com" required
                                value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px 28px' }}>
                            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                        </button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
                            Se uma conta existir com este email, você receberá as instruções de recuperação.
                        </p>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Link href="/login" style={{ color: 'var(--accent-secondary)', textDecoration: 'none', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <FiArrowLeft size={14} /> Voltar para login
                    </Link>
                </div>
            </div>
        </div>
    );
}
