'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { FiUsers, FiShoppingCart, FiDollarSign, FiPercent } from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Filler, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function AdminDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminAPI.getDashboard().then(res => setData(res.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    const chartData = {
        labels: data?.monthly_revenue?.map((m: any) => m.month) || [],
        datasets: [{
            label: 'Receita (R$)',
            data: data?.monthly_revenue?.map((m: any) => parseFloat(m.amount)) || [],
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            fill: true, tension: 0.4,
            pointBackgroundColor: '#ff6b6b', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5,
        }]
    };

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderWidth: 1, padding: 12, cornerRadius: 10 } },
        scales: {
            x: { grid: { color: 'rgba(42,42,58,0.3)' }, ticks: { color: '#55556a' } },
            y: { grid: { color: 'rgba(42,42,58,0.3)' }, ticks: { color: '#55556a', callback: (v: any) => `R$${v}` } }
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: '#ff6b6b', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 28 }}>Painel Administrativo</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
                {[
                    { label: 'Vendedores', value: data?.stats?.total_sellers || 0, icon: <FiUsers size={20} />, color: '#6c5ce7', isCurrency: false },
                    { label: 'Total Pedidos', value: data?.stats?.total_orders || 0, icon: <FiShoppingCart size={20} />, color: '#74b9ff', isCurrency: false },
                    { label: 'Receita Total', value: data?.stats?.total_revenue || '0.00', icon: <FiDollarSign size={20} />, color: '#00cec9' },
                    { label: 'Taxas Recebidas', value: data?.stats?.total_fees || '0.00', icon: <FiPercent size={20} />, color: '#ff6b6b' },
                ].map((card, i) => (
                    <div key={i} className="stat-card">
                        <div style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 16, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                            {card.icon}
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                            {card.isCurrency !== false ? `R$ ${card.value}` : card.value}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{card.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Receita Mensal da Plataforma</h3>
                <div style={{ height: 300 }}>
                    <Line data={chartData} options={chartOptions as any} />
                </div>
            </div>

            {/* Recent orders */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Pedidos Recentes</h3>
                {data?.recent_orders?.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>Produto</th><th>Comprador</th><th>Valor</th><th>Status</th><th>Data</th></tr></thead>
                            <tbody>
                                {data.recent_orders.map((o: any) => (
                                    <tr key={o.id}>
                                        <td style={{ fontWeight: 500 }}>{o.products?.name || '—'}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{o.buyer_name || '—'}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>R$ {o.amount_display}</td>
                                        <td>
                                            <span className={`badge ${o.status === 'paid' ? 'badge-success' : o.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                                                {o.status === 'paid' ? 'Pago' : o.status === 'pending' ? 'Pendente' : o.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhum pedido registrado</p>
                )}
            </div>
        </div>
    );
}
