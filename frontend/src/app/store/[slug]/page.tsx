'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { storeAPI } from '@/lib/api';
import { FiShoppingCart, FiArrowRight, FiPackage, FiFilter } from 'react-icons/fi';
import Head from 'next/head';

export default function StorePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [store, setStore] = useState<any>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const activeCategory = searchParams.get('category') || '';

    useEffect(() => {
        if (params.slug) loadStore(params.slug as string, activeCategory);
    }, [params.slug, activeCategory]);

    const loadStore = async (slug: string, category: string) => {
        try {
            setLoading(true);
            const { data } = await storeAPI.getStoreBySlug(slug, category);
            setStore(data.store);
            setCategories(data.categories || []);
            setProducts(data.products || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (catSlug: string) => {
        if (catSlug === activeCategory) {
            router.push(`/store/${params.slug}`);
        } else {
            router.push(`/store/${params.slug}?category=${catSlug}`);
        }
    };

    if (loading && !store) {
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

    // Apply store theme dynamically
    const themeBg = store.theme === 'dark' ? '#0f0f13' : '#f8f9fa';
    const themeText = store.theme === 'dark' ? '#e2e8f0' : '#1e293b';
    const themeCard = store.theme === 'dark' ? '#1e1e24' : '#ffffff';
    const themeBorder = store.theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    return (
        <div style={{ minHeight: '100vh', background: themeBg, color: themeText, paddingBottom: 60, fontFamily: 'Inter, sans-serif' }}>
            <Head>
                <title>{store.name} - Loja Oficial</title>
            </Head>

            {/* Header/Banner */}
            <div style={{
                position: 'relative',
                background: store.banner_url ? `url(${store.banner_url}) center/cover no-repeat` : 'linear-gradient(135deg, rgba(108,92,231,0.2), rgba(108,92,231,0.05))',
                padding: '80px 24px 60px',
                textAlign: 'center',
                borderBottom: `1px solid ${themeBorder}`
            }}>
                {store.banner_url && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2))' }} />}

                <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    {store.avatar_url ? (
                        <img src={store.avatar_url} alt={store.name} style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 20px', border: `4px solid ${themeBg}`, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }} />
                    ) : (
                        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, margin: '0 auto 20px', border: `4px solid ${themeBg}`, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                            {store.name?.charAt(0) || 'L'}
                        </div>
                    )}
                    <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, color: store.banner_url ? 'white' : themeText, textShadow: store.banner_url ? '0 2px 8px rgba(0,0,0,0.5)' : 'none' }}>{store.name}</h1>
                    <p style={{ fontSize: 16, color: store.banner_url ? 'rgba(255,255,255,0.9)' : (store.theme === 'dark' ? '#94a3b8' : '#64748b'), lineHeight: 1.6, maxWidth: 600, margin: '0 auto', textShadow: store.banner_url ? '0 2px 4px rgba(0,0,0,0.5)' : 'none' }}>
                        {store.description || 'Bem-vindo à nossa loja digital! Confira nossos produtos abaixo.'}
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', gap: 40, alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap' }}>

                {/* Categories Sidebar */}
                <div style={{ flex: '1 1 250px', maxWidth: 300 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiFilter size={18} /> Categorias
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button
                            onClick={() => handleCategoryClick('')}
                            style={{
                                padding: '12px 16px', background: !activeCategory ? 'var(--accent-primary)' : themeCard,
                                color: !activeCategory ? 'white' : themeText, borderRadius: 12, border: `1px solid ${!activeCategory ? 'var(--accent-primary)' : themeBorder}`,
                                textAlign: 'left', fontWeight: !activeCategory ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s', display: 'block', width: '100%'
                            }}>
                            Todos os Produtos
                        </button>

                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.slug)}
                                style={{
                                    padding: '12px 16px', background: activeCategory === cat.slug ? 'var(--accent-primary)' : themeCard,
                                    color: activeCategory === cat.slug ? 'white' : themeText, borderRadius: 12, border: `1px solid ${activeCategory === cat.slug ? 'var(--accent-primary)' : themeBorder}`,
                                    textAlign: 'left', fontWeight: activeCategory === cat.slug ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s', display: 'block', width: '100%'
                                }}>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                <div style={{ flex: '3 1 600px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 700 }}>{activeCategory ? categories.find(c => c.slug === activeCategory)?.name : 'Todos os Produtos'}</h2>
                        <span style={{ background: themeCard, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: `1px solid ${themeBorder}` }}>
                            {products.length} {products.length === 1 ? 'produto' : 'produtos'}
                        </span>
                    </div>

                    {loading ? (
                        <div style={{ padding: 60, textAlign: 'center' }}>
                            <div style={{ width: 30, height: 30, border: `3px solid ${themeBorder}`, borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                        </div>
                    ) : products.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 60, background: themeCard, borderRadius: 16, border: `1px solid ${themeBorder}` }}>
                            <FiShoppingCart size={40} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Nenhum produto</h3>
                            <p style={{ color: '#94a3b8' }}>Não encontramos produtos para esta categoria no momento.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                            {products.map(product => (
                                <div key={product.id} style={{
                                    background: themeCard, borderRadius: 16, border: `1px solid ${themeBorder}`, padding: 0,
                                    overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column',
                                    boxShadow: store.theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.03)',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                    className="store-product-card"
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = store.theme === 'dark' ? '0 12px 24px rgba(0,0,0,0.5)' : '0 12px 24px rgba(0,0,0,0.08)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = store.theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.03)' }}
                                >
                                    <div style={{ height: 180, background: store.theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <FiPackage size={40} style={{ color: store.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                                        )}
                                    </div>
                                    <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, flex: 1, color: themeText }}>{product.name}</h3>
                                        {/* Optional: Add product description snippet here if needed */}
                                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 20 }}>
                                            R$ {product.price_display}
                                        </div>
                                        <button onClick={() => router.push(`/checkout/${product.id}`)} style={{
                                            width: '100%', padding: '14px', borderRadius: 12, background: 'var(--accent-primary)',
                                            color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                                            transition: 'background 0.2s, transform 0.1s'
                                        }}
                                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            Comprar Agora <FiArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <style jsx global>{`
                @media (max-width: 768px) {
                    .store-product-card {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
