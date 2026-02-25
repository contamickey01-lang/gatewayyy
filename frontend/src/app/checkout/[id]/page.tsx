'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsAPI, checkoutAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiCreditCard, FiSmartphone, FiCheck, FiCopy, FiPackage, FiArrowRight } from 'react-icons/fi';

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [result, setResult] = useState<any>(null);
    const [pixPaid, setPixPaid] = useState(false);
    const pollingRef = useRef<any>(null);
    const [countdown, setCountdown] = useState(5);
    const countdownRef = useRef<any>(null);
    const [form, setForm] = useState({
        name: '', email: '', cpf: '', phone: '',
        card_number: '', card_holder: '', card_exp_month: '', card_exp_year: '', card_cvv: '', installments: 1
    });

    useEffect(() => {
        if (params.id) loadProduct(params.id as string);
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [params.id]);

    const loadProduct = async (id: string) => {
        try {
            const { data } = await productsAPI.getPublic(id);
            setProduct(data.product);
        } catch (err) {
            toast.error('Produto não encontrado');
        } finally {
            setLoading(false);
        }
    };

    const autoLoginAndRedirect = (authData: any) => {
        if (authData?.token && authData?.user) {
            localStorage.setItem('token', authData.token);
            localStorage.setItem('user', JSON.stringify(authData.user));
        }
        // Start countdown to redirect
        let count = 5;
        setCountdown(count);
        countdownRef.current = setInterval(() => {
            count--;
            setCountdown(count);
            if (count <= 0) {
                clearInterval(countdownRef.current);
                router.push('/area-membros');
            }
        }, 1000);
    };

    const startPixPolling = (orderId: string) => {
        pollingRef.current = setInterval(async () => {
            try {
                const { data } = await checkoutAPI.getOrderStatus(orderId);
                if (data.order?.status === 'paid') {
                    clearInterval(pollingRef.current);
                    setPixPaid(true);
                    toast.success('Pagamento confirmado! 🎉');
                    if (data.auth) {
                        autoLoginAndRedirect(data.auth);
                    }
                }
            } catch (err) {
                // Silently retry
            }
        }, 3000);
    };

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const payload: any = {
                product_id: params.id,
                payment_method: paymentMethod,
                buyer: {
                    name: form.name,
                    email: form.email,
                    cpf: form.cpf,
                    phone: form.phone
                }
            };

            if (paymentMethod === 'credit_card') {
                payload.card_data = {
                    number: form.card_number.replace(/\s/g, ''),
                    holder_name: form.card_holder,
                    exp_month: parseInt(form.card_exp_month),
                    exp_year: parseInt(form.card_exp_year),
                    cvv: form.card_cvv,
                    installments: form.installments
                };
            }

            const { data } = await checkoutAPI.pay(payload);
            setResult(data);

            if (data.order?.status === 'paid') {
                toast.success('Pagamento aprovado! 🎉');
                if (data.auth) {
                    autoLoginAndRedirect(data.auth);
                }
            } else if (paymentMethod === 'pix') {
                toast.success('QR Code gerado!');
                startPixPolling(data.order.id);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao processar pagamento');
        } finally {
            setProcessing(false);
        }
    };

    const copyPixCode = () => {
        if (result?.pix?.qr_code) {
            navigator.clipboard.writeText(result.pix.qr_code);
            toast.success('Código Pix copiado!');
        }
    };

    const update = (field: string, value: string) => setForm({ ...form, [field]: value });

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!product) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 24 }}>
                <div className="glass-card" style={{ padding: 48, textAlign: 'center', maxWidth: 400 }}>
                    <FiPackage size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Produto não encontrado</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Este produto não existe ou foi desativado.</p>
                </div>
            </div>
        );
    }

    // Success Screen (Credit Card instant or PIX confirmed)
    if (result && (result.order?.status === 'paid' || pixPaid)) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 24 }}>
                <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: 500, padding: 48, textAlign: 'center' }}>
                    {/* Success animation */}
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
                        background: 'rgba(0,206,201,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'scaleIn 0.5s ease'
                    }}>
                        <FiCheck size={40} style={{ color: 'var(--success)' }} />
                    </div>

                    <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                        Pagamento <span className="gradient-text">Confirmado!</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 15 }}>
                        Seu pagamento foi processado com sucesso.
                    </p>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 13 }}>
                        Seu acesso ao produto já está disponível no Painel do Aluno.
                    </p>

                    <div className="stat-card" style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Valor pago</div>
                        <div style={{ fontSize: 32, fontWeight: 700 }} className="gradient-text">R$ {result.order.amount_display}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button
                            className="btn-primary animate-pulse-glow"
                            onClick={() => router.push('/area-membros')}
                            style={{
                                width: '100%', padding: '16px', fontSize: 15,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                border: 'none', cursor: 'pointer'
                            }}
                        >
                            Acessar Painel do Aluno <FiArrowRight size={18} />
                        </button>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                            Redirecionando automaticamente em {countdown}s...
                        </p>
                    </div>
                </div>
                <style jsx>{`
                    @keyframes scaleIn {
                        from { transform: scale(0); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                `}</style>
            </div>
        );
    }

    // PIX QR Code screen (waiting for payment)
    if (result && result.pix) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 24 }}>
                <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: 480, padding: 40, textAlign: 'center' }}>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Pague via Pix</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                        Escaneie o QR Code ou copie o código abaixo
                    </p>
                    {result.pix?.qr_code_url && (
                        <div style={{
                            background: 'white', borderRadius: 16, padding: 16,
                            display: 'inline-block', marginBottom: 20
                        }}>
                            <img src={result.pix.qr_code_url} alt="QR Code Pix" style={{ width: 220, height: 220 }} />
                        </div>
                    )}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Valor</div>
                        <div style={{ fontSize: 28, fontWeight: 700 }} className="gradient-text">R$ {result.order.amount_display}</div>
                    </div>
                    {result.pix?.qr_code && (
                        <div>
                            <div style={{
                                background: 'var(--bg-secondary)', borderRadius: 10, padding: '12px 16px',
                                fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all',
                                maxHeight: 80, overflow: 'auto', marginBottom: 12
                            }}>
                                {result.pix.qr_code}
                            </div>
                            <button className="btn-primary" onClick={copyPixCode} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <FiCopy size={14} /> Copiar Pix Copia e Cola
                            </button>
                        </div>
                    )}

                    {/* Polling indicator */}
                    <div style={{
                        marginTop: 24, padding: '16px', borderRadius: 12,
                        background: 'rgba(108,92,231,0.08)', border: '1px solid rgba(108,92,231,0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: 'var(--accent-secondary)' }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)',
                                animation: 'pulse 1.5s ease infinite'
                            }} />
                            Aguardando confirmação do pagamento...
                        </div>
                    </div>
                </div>
                <style jsx>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.4; transform: scale(0.8); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 24 }}>
            {/* Header */}
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 0 40px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8, background: 'var(--accent-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white'
                    }}>G</div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>GouPay</span>
                </div>
            </div>

            <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
                {/* Product Info */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{
                        height: 220, background: 'linear-gradient(135deg, rgba(108,92,231,0.2) 0%, rgba(162,155,254,0.1) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <FiShoppingCart size={48} style={{ opacity: 0.3 }} />
                        )}
                    </div>
                    <div style={{ padding: 28 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                            Vendido por {product.seller_name}
                        </span>
                        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8, marginBottom: 12 }}>{product.name}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                            {product.description || 'Sem descrição disponível'}
                        </p>
                        <div style={{ fontSize: 32, fontWeight: 800 }} className="gradient-text">
                            R$ {product.price_display}
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <div className="glass-card animate-fade-in" style={{ padding: 28 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Finalizar Compra</h2>

                    <form onSubmit={handlePay}>
                        {/* Buyer info */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Nome completo</label>
                            <input className="input-field" placeholder="Seu nome" required value={form.name} onChange={e => update('name', e.target.value)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Email</label>
                                <input type="email" className="input-field" placeholder="seu@email.com" required value={form.email} onChange={e => update('email', e.target.value)} />
                            </div>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>CPF</label>
                                <input className="input-field" placeholder="000.000.000-00" required value={form.cpf} onChange={e => update('cpf', e.target.value)} />
                            </div>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Telefone</label>
                            <input className="input-field" placeholder="(11) 99999-9999" required value={form.phone} onChange={e => update('phone', e.target.value)} />
                        </div>

                        {/* Payment method */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 10, display: 'block' }}>Forma de pagamento</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {[
                                    { key: 'pix', label: 'Pix', icon: <FiSmartphone size={18} /> },
                                    { key: 'credit_card', label: 'Cartão de Crédito', icon: <FiCreditCard size={18} /> }
                                ].map(m => (
                                    <button key={m.key} type="button" onClick={() => setPaymentMethod(m.key)}
                                        style={{
                                            padding: '14px', borderRadius: 12, cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 500,
                                            transition: 'all 0.2s ease', fontFamily: 'Inter, sans-serif',
                                            background: paymentMethod === m.key ? 'rgba(108,92,231,0.12)' : 'var(--bg-secondary)',
                                            border: `1px solid ${paymentMethod === m.key ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                            color: paymentMethod === m.key ? 'var(--accent-secondary)' : 'var(--text-secondary)'
                                        }}>
                                        {m.icon} {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Credit Card Fields */}
                        {paymentMethod === 'credit_card' && (
                            <div className="animate-fade-in" style={{ marginBottom: 20 }}>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Número do cartão</label>
                                    <input className="input-field" placeholder="0000 0000 0000 0000" required value={form.card_number} onChange={e => update('card_number', e.target.value)} />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Nome no cartão</label>
                                    <input className="input-field" placeholder="Nome como está no cartão" required value={form.card_holder} onChange={e => update('card_holder', e.target.value)} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Mês</label>
                                        <input className="input-field" placeholder="MM" maxLength={2} required value={form.card_exp_month} onChange={e => update('card_exp_month', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Ano</label>
                                        <input className="input-field" placeholder="AA" maxLength={2} required value={form.card_exp_year} onChange={e => update('card_exp_year', e.target.value)} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>CVV</label>
                                        <input className="input-field" placeholder="000" maxLength={4} required value={form.card_cvv} onChange={e => update('card_cvv', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn-primary animate-pulse-glow" disabled={processing}
                            style={{ width: '100%', padding: '16px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {processing ? 'Processando...' : (
                                <>
                                    {paymentMethod === 'pix' ? <FiSmartphone size={18} /> : <FiCreditCard size={18} />}
                                    Pagar R$ {product.price_display}
                                </>
                            )}
                        </button>
                        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
                            🔒 Pagamento seguro processado via Pagar.me
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
