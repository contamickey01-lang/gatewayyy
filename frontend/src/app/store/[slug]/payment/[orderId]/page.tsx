'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiCopy, FiCheck, FiSmartphone, FiClock, FiShield, FiCheckCircle, FiPackage, FiArrowLeft, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { checkoutAPI } from '@/lib/api';
export default function PaymentPage() {
    const params = useParams();
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(86400); // 24 hours in seconds
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOrder = async () => {
            try {
                const { data } = await checkoutAPI.getOrderStatus(params.orderId as string);
                setOrder(data.order);
            } catch (err) {
                console.error('Failed to load order:', err);
                toast.error("Pedido não encontrado");
            } finally {
                setLoading(false);
            }
        };

        if (params.orderId) loadOrder();
    }, [params.orderId]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleCopy = () => {
        if (!order?.pix_qr_code) return;
        navigator.clipboard.writeText(order.pix_qr_code);
        setCopied(true);
        toast.success("Código copiado!");
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c' }}>
                <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#00cec9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', padding: 24 }}>
                <div style={{ padding: 48, textAlign: 'center', maxWidth: 400, background: '#141417', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <FiPackage size={48} style={{ opacity: 0.3, color: 'white', marginBottom: 16 }} />
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'white' }}>Pedido não encontrado</h2>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>Não conseguimos localizar as informações deste pagamento.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0c', color: '#e2e8f0', fontFamily: 'Outfit, Inter, sans-serif', padding: '0 24px 60px' }}>

            {/* Top Bar (Image 2 inspired) */}
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Página de pagamento</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{new Date(order.created_at).toLocaleDateString('pt-BR')} {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div style={{ maxWidth: 1000, margin: '40px auto' }}>

                {/* Order Summary Strip (Image 2) */}
                <div style={{ background: '#141417', borderRadius: 20, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>ID do Pedido</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>#{order.id.substring(0, 8)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Total</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#00cec9' }}>R$ {order.amount_display}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Método</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#00cec9' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00cec9' }} /> {order.payment_method?.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Main QR Code Box (Image 2 Content) - Only for Pix */}
                {order.payment_method === 'pix' ? (
                    <div style={{ background: '#141417', borderRadius: 32, padding: 48, textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)', position: 'relative' }}>

                        <div style={{ marginBottom: 32 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Tempo restante</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                <FiClock size={20} /> {formatTime(timeLeft)}
                            </div>
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 20 }}>QR Code</div>

                        <div style={{
                            width: '100%', maxWidth: 300, margin: '0 auto 32px', background: 'white', padding: 12, borderRadius: 24,
                            border: '4px solid #ff9f43', boxShadow: '0 0 30px rgba(255, 159, 67, 0.2)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 240
                        }}>
                            {order.pix_qr_code ? (
                                <QRCodeSVG value={order.pix_qr_code} size={216} bgColor="#ffffff" fgColor="#000000" />
                            ) : (
                                <div style={{ padding: 20 }}>
                                    <div style={{ color: '#e74c3c', fontWeight: 800, fontSize: 16, marginBottom: 8 }}>QR Code Indisponível</div>
                                    <div style={{ color: '#555', fontSize: 12, lineHeight: 1.4 }}>
                                        Ocorreu um problema ao gerar o código com o Pagar.me.<br />
                                        <div style={{ marginTop: 12, padding: 8, background: '#f8f9fa', borderRadius: 8, border: '1px solid #ddd', textAlign: 'left' }}>
                                            <strong>Status:</strong> {order.status}<br />
                                            <strong>ID:</strong> {order.pagarme_order_id || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ maxWidth: 500, margin: '0 auto' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 12, textAlign: 'left' }}>PIX Copia e cola</div>
                            <div style={{
                                background: '#0a0a0c', padding: '16px', borderRadius: 12, fontSize: 12, color: '#64748b',
                                textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16
                            }}>
                                {order.pix_qr_code || '---'}
                            </div>

                            <button
                                onClick={handleCopy}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: 12, background: 'white', color: '#0a0a0c',
                                    fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    transition: 'transform 0.2s'
                                }}
                            >
                                {copied ? <FiCheck /> : <FiCopy />} {copied ? 'Copiado!' : 'Copiar Código Pix'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ background: '#141417', borderRadius: 32, padding: 48, textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <FiCheckCircle size={64} style={{ color: '#00cec9', marginBottom: 24 }} />
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 12 }}>Pagamento em processamento</h2>
                        <p style={{ color: '#94a3b8' }}>Estamos aguardando a confirmação da sua operadora de cartão.</p>
                    </div>
                )}

                {/* Important Section (Image 2 Footer) */}
                <div style={{ marginTop: 40, background: 'rgba(0, 206, 201, 0.03)', borderRadius: 24, padding: 32, border: '1px solid rgba(0, 206, 201, 0.1)' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FiShield style={{ color: '#00cec9' }} /> Importante: Como pagar com o Pix
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FiSmartphone style={{ color: '#00cec9' }} size={20} />
                            </div>
                            <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>Utilize o app de seu banco para escanear o código QR acima.</div>
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FiCopy style={{ color: '#00cec9' }} size={20} />
                            </div>
                            <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>Copie o código PIX acima e cole no seu internet banking.</div>
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FiCheckCircle style={{ color: '#00cec9' }} size={20} />
                            </div>
                            <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>Após o pagamento ser identificado, você receberá seus produtos instantaneamente.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
