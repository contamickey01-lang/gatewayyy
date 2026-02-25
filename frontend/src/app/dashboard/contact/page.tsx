'use client';

import { FiMessageCircle, FiPhone, FiMail, FiClock } from 'react-icons/fi';

export default function ContactPage() {
    const whatsappNumber = '5532998284648';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Olá! Preciso de ajuda com a plataforma GouPay.`;

    return (
        <div className="animate-fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                {/* Logo */}
                <div style={{
                    width: 80, height: 80, borderRadius: 20, margin: '0 auto 16px',
                    background: 'var(--accent-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, fontWeight: 800, color: 'white',
                    boxShadow: '0 8px 32px rgba(108,92,231,0.3)'
                }}>
                    G
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
                    <span style={{ fontSize: 20, fontWeight: 700 }}>Gou<span className="gradient-text">Pay</span></span>
                    <span style={{
                        width: 18, height: 18, borderRadius: '50%', background: '#00CEC9',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: 'white', fontWeight: 700
                    }}>✓</span>
                </div>

                {/* Title */}
                <h1 style={{ fontSize: 30, fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                    Gerência – <span style={{ fontWeight: 600 }}>GouPay</span>
                </h1>
                <div style={{
                    width: 60, height: 2, margin: '20px auto 0',
                    background: 'var(--accent-gradient)', borderRadius: 2
                }} />
            </div>

            {/* Choose a Manager */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500
                }}>
                    <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'rgba(255,107,107,0.15)', color: '#FF6B6B',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11
                    }}>⊙</div>
                    Escolha um Gerente
                </div>
            </div>

            {/* Manager Card */}
            <div style={{
                maxWidth: 380, margin: '0 auto',
                background: 'var(--bg-secondary)', borderRadius: 20,
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 20, padding: '24px 28px'
                }}>
                    {/* Avatar */}
                    <div style={{
                        width: 90, height: 90, borderRadius: 16, overflow: 'hidden',
                        background: 'linear-gradient(135deg, rgba(108,92,231,0.2), rgba(162,155,254,0.1))',
                        flexShrink: 0, border: '2px solid var(--border-color)'
                    }}>
                        <img
                            src="/manager-male.jpg"
                            alt="Gerente"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px">👨‍💼</div>';
                            }}
                        />
                    </div>

                    {/* Info */}
                    <div>
                        <span style={{
                            display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                            background: 'rgba(108,92,231,0.12)', color: 'var(--accent-secondary)',
                            fontSize: 11, fontWeight: 600, marginBottom: 8
                        }}>
                            Gerente de Contas
                        </span>
                        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
                            Lucas
                        </h2>
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '10px 20px', borderRadius: 12,
                                background: '#25D366', color: 'white',
                                fontSize: 13, fontWeight: 700, textDecoration: 'none',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                                boxShadow: '0 4px 16px rgba(37,211,102,0.3)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Chamar no WhatsApp
                        </a>
                    </div>
                </div>
            </div>

            {/* Extra Info */}
            <div style={{
                maxWidth: 380, margin: '32px auto 0',
                display: 'flex', flexDirection: 'column', gap: 12,
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                    background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-color)'
                }}>
                    <FiClock size={16} style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} />
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Horário de Atendimento</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Seg–Sex, 9h às 18h</div>
                    </div>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                    background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-color)'
                }}>
                    <FiMail size={16} style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} />
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Tempo de Resposta</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Normalmente respondemos em até 2h</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
