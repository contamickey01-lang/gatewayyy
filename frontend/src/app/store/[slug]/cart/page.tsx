'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { FiArrowLeft, FiTrash2, FiMinus, FiPlus, FiZap, FiCreditCard, FiTag, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { storeAPI } from '@/lib/api';

export default function CartPage() {
    const params = useParams();
    const router = useRouter();
    const { items, updateQuantity, removeItem, totalAmount, clearCart } = useCart();

    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        if (items.length === 0) return toast.error("Carrinho vazio!");
        if (!email || email !== confirmEmail) return toast.error("E-mails não coincidem ou estão vazios!");

        try {
            setLoading(true);

            const payload = {
                store_slug: params.slug,
                email,
                items: items.map(i => ({ id: i.id, quantity: i.quantity, price: i.price, name: i.name })),
                payment_method: paymentMethod,
                total: totalAmount
            };

            const { data } = await storeAPI.createOrder(payload);

            clearCart();
            toast.success("Pedido gerado com sucesso!");
            router.push(`/store/${params.slug}/payment/${data.order.id}`);
        } catch (err: any) {
            console.error('Checkout error:', err);
            toast.error(err.response?.data?.error || "Erro ao processar pedido");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0c', color: '#e2e8f0', fontFamily: 'Outfit, Inter, sans-serif', padding: '40px 24px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <button
                    onClick={() => router.back()}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 32, fontWeight: 600 }}
                >
                    <FiArrowLeft /> Voltar para a loja
                </button>

                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Carrinho de compras</h1>
                <p style={{ color: '#64748b', marginBottom: 40, fontSize: 14 }}>Nesta página, você encontra os produtos adicionados ao seu carrinho.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32 }}>

                    {/* Left Column: Payment & Cart Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* Payment Info (Image 3 inspired) */}
                        <div style={{ background: '#141417', borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.03)' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Informações de pagamento</h2>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 12 }}>Selecione o método</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button
                                        onClick={() => setPaymentMethod('pix')}
                                        style={{
                                            flex: 1, padding: '16px', borderRadius: 12, border: '1px solid',
                                            display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, cursor: 'pointer',
                                            background: paymentMethod === 'pix' ? 'rgba(0, 206, 201, 0.1)' : 'transparent',
                                            borderColor: paymentMethod === 'pix' ? '#00cec9' : 'rgba(255,255,255,0.05)',
                                            color: paymentMethod === 'pix' ? '#00cec9' : '#94a3b8'
                                        }}
                                    >
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#00cec9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}>
                                            <FiZap size={14} />
                                        </div>
                                        Pix
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('card')}
                                        style={{
                                            flex: 1, padding: '16px', borderRadius: 12, border: '1px solid',
                                            display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, cursor: 'pointer',
                                            background: paymentMethod === 'card' ? 'rgba(108, 92, 231, 0.1)' : 'transparent',
                                            borderColor: paymentMethod === 'card' ? '#6c5ce7' : 'rgba(255,255,255,0.05)',
                                            color: paymentMethod === 'card' ? '#6c5ce7' : '#94a3b8'
                                        }}
                                    >
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#6c5ce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                            <FiCreditCard size={14} />
                                        </div>
                                        Cartão
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>Informe o seu e-mail</label>
                                    <input
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        style={{ width: '100%', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 16px', color: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 8 }}>Informe novamente o seu e-mail</label>
                                    <input
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={confirmEmail}
                                        onChange={e => setConfirmEmail(e.target.value)}
                                        style={{ width: '100%', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 16px', color: 'white' }}
                                    />
                                </div>
                            </div>

                            <button style={{ marginTop: 32, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, color: '#64748b', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <FiTag /> Cupom de desconto
                                </div>
                                <div style={{ color: 'white', fontWeight: 700 }}>Adicionar</div>
                            </button>
                        </div>

                        {/* Products in Cart (Image 3 inspired) */}
                        <div style={{ background: '#141417', borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Produtos no carrinho</h2>
                                <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>{items.length} itens</span>
                            </div>

                            {items.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>Seu carrinho está vazio.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {items.map(item => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0c', padding: 12, borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', background: '#141417' }}>
                                                    {item.image_url ? <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FiPackage style={{ margin: 20, opacity: 0.1 }} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 4 }}>{item.name}</div>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <FiTrash2 size={16} style={{ color: '#ff7675', cursor: 'pointer' }} onClick={() => removeItem(item.id)} />
                                                        <FiZap size={16} style={{ color: '#00cec9' }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#141417', borderRadius: 8, padding: '4px 8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <FiMinus size={14} style={{ cursor: 'pointer' }} onClick={() => updateQuantity(item.id, -1)} />
                                                    <span style={{ fontSize: 14, fontWeight: 800 }}>{item.quantity}</span>
                                                    <FiPlus size={14} style={{ cursor: 'pointer' }} onClick={() => updateQuantity(item.id, 1)} />
                                                </div>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: 'white', minWidth: 80, textAlign: 'right' }}>
                                                    R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div style={{ position: 'sticky', top: 40 }}>
                        <div style={{ background: '#141417', borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.03)' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Resumo da compra</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                                    <span>Subtotal</span>
                                    <span style={{ color: 'white', fontWeight: 700 }}>R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                                    <span>Método</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00cec9', fontWeight: 700 }}>
                                        <FiZap size={14} /> Pix
                                    </div>
                                </div>
                                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: 'white' }}>
                                    <span>Total</span>
                                    <span>R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={loading || items.length === 0}
                                style={{
                                    width: '100%', padding: '18px', borderRadius: 14, background: 'white', color: '#0a0a0c',
                                    fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer',
                                    opacity: (loading || items.length === 0) ? 0.5 : 1, transition: 'transform 0.2s'
                                }}
                            >
                                {loading ? 'Processando...' : 'Gerar pagamento'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
