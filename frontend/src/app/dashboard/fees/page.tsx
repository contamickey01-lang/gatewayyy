'use client';

import { FiInfo, FiCreditCard, FiCheckCircle, FiZap, FiFileText } from 'react-icons/fi';

export default function FeesPage() {
    const fees = [
        {
            method: 'Pix',
            platform: '3.00%',
            gateway: '1.09%',
            total: '4.09%',
            payout: 'Na hora',
            icon: <FiZap size={24} color="#00cec9" />,
            description: 'O método mais rápido e barato para você e para o cliente.'
        },
        {
            method: 'Cartão de Crédito',
            platform: '3.00%',
            gateway: '3.10% + R$ 0,99*',
            total: '~7.10% + fixo',
            payout: '30 dias',
            icon: <FiCreditCard size={24} color="#6c5ce7" />,
            description: 'Vendas seguras com antifraude incluso. *Taxa fixa de R$ 0,55 (processamento) + R$ 0,44 (antifraude).'
        },
        {
            method: 'Boleto Bancário',
            platform: '3.00%',
            gateway: 'R$ 3,10',
            total: '3% + R$ 3,10',
            payout: '2 dias úteis',
            icon: <FiFileText size={24} color="#fdcb6e" />,
            description: 'Ideal para quem não tem cartão ou chave Pix.'
        }
    ];

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Taxas da Plataforma</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Transparência total nos seus recebíveis</p>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
                {fees.map((fee, i) => (
                    <div key={i} className="glass-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
                                {fee.icon}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20 }}>
                                Receba: {fee.payout}
                            </span>
                        </div>

                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{fee.method}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24, height: 40 }}>{fee.description}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Taxa Plataforma</span>
                                <span style={{ fontWeight: 600 }}>{fee.platform}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Taxa Gateway (Pagar.me)</span>
                                <span style={{ fontWeight: 600 }}>{fee.gateway}</span>
                            </div>
                            <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                                <span>Total Estimado</span>
                                <span className="gradient-text">{fee.total}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
                <FiCheckCircle size={32} color="var(--success)" style={{ marginBottom: 16, opacity: 0.8 }} />
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Sem Taxas Ocultas</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Você só paga quando vende. Não cobramos mensalidade, taxa de adesão ou taxas por saque.
                </p>
            </div>
        </div>
    );
}
