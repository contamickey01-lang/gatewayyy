'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { storeAPI } from '@/lib/api';
import { FiShoppingCart, FiArrowRight, FiPackage } from 'react-icons/fi';

export default function StorePage() {
    const params = useParams();
    const router = useRouter();
    const [store, setStore] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.slug) loadStore(params.slug as string);
    }, [params.slug]);

    const loadStore = async (slug: string) => {
        try {
            const { data } = await storeAPI.getStoreBySlug(slug);
            setStore(data.store);
            setProducts(data.products);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!store) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 24 }}>
                <div style={{ padding: 48, textAlign: 'center', maxWidth: 400, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                    <FiPackage size={48} style={{ opacity: 0.3, color: 'var(--text-primary)', marginBottom: 16 }} />
                    <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Loja não encontrada</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Esta loja não existe ou está inativa.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', paddingBottom: 60 }}>
            {/* Header/Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(108,92,231,0.1), rgba(108,92,231,0.03))',
                padding: '60px 24px',
                textAlign: 'center',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    {store.avatar_url ? (
                        <img src={store.avatar_url} alt={store.name} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 20px', border: '4px solid var(--bg-card)' }} />
                    ) : (
                        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, margin: '0 auto 20px', border: '4px solid var(--bg-card)' }}>
                            {store.name?.charAt(0) || 'L'}
                        </div>
                    )}
                    <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>{store.name}</h1>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
                        {store.description || 'Bem-vindo à nossa loja digital! Confira nossos produtos abaixo.'}
                    </p>
                </div>
            </div>

            {/* Products Grid */}
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>Produtos Disponíveis ({products.length})</h2>
                </div>

                {products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                        <FiShoppingCart size={40} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Nenhum produto</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Esta loja ainda não possui produtos ativos no momento.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                        {products.map(product => (
                            <div key={product.id} className="glass-card" style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: 180, background: 'rgba(108,92,231,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <FiPackage size={40} style={{ color: 'var(--text-muted)' }} />
                                    )}
                                </div>
                                <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, flex: 1 }}>{product.name}</h3>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 20 }}>
                                        R$ {product.price_display}
                                    </div>
                                    <button onClick={() => router.push(`/checkout/${product.id}`)} style={{
                                        width: '100%', padding: '12px', borderRadius: 10, background: 'var(--accent-primary)',
                                        color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                                        transition: 'background 0.2s'
                                    }}>
                                        Comprar <FiArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
