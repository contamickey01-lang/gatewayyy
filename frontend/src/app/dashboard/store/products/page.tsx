'use client';

import { useEffect, useState } from 'react';
import { productsAPI, storeCategoriesAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';

export default function StoreProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingParams, setUpdatingParams] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                productsAPI.list({ limit: 100 }), // Fetching more to ensure we see all options for now
                storeCategoriesAPI.list()
            ]);
            setProducts(prodRes.data.products || []);
            setCategories(catRes.data.categories || []);
        } catch (error) {
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const toggleVisibility = async (product: any) => {
        setUpdatingParams(product.id);
        try {
            const newStatus = !product.show_in_store;
            await productsAPI.update(product.id, { show_in_store: newStatus });
            setProducts(products.map(p => p.id === product.id ? { ...p, show_in_store: newStatus } : p));
            toast.success(newStatus ? 'Produto adicionado à loja' : 'Produto removido da loja');
        } catch (error) {
            toast.error('Erro ao atualizar visibilidade');
        } finally {
            setUpdatingParams(null);
        }
    };

    const changeCategory = async (productId: string, categoryId: string) => {
        setUpdatingParams(productId);
        try {
            const val = categoryId === '' ? null : categoryId;
            await productsAPI.update(productId, { store_category_id: val });
            setProducts(products.map(p => p.id === productId ? { ...p, store_category_id: val } : p));
            toast.success('Categoria atualizada');
        } catch (error) {
            toast.error('Erro ao mudar categoria');
        } finally {
            setUpdatingParams(null);
        }
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>Produtos da Vitrine</h2>
                <button onClick={loadData} className="btn-secondary" style={{ padding: '8px 12px' }}>
                    <FiRefreshCw size={14} /> Atualizar
                </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
                Selecione quais dos seus produtos criados no gateway devem aparecer na sua loja pública, e organize-os em categorias.
            </p>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Preço</th>
                            <th>Categoria na Loja</th>
                            <th style={{ textAlign: 'center' }}>Mostrar na Loja?</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} style={{ opacity: updatingParams === product.id ? 0.5 : 1 }}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                📦
                                            </div>
                                        )}
                                        <div style={{ fontWeight: 500 }}>{product.name}</div>
                                    </div>
                                </td>
                                <td>R$ {product.price_display}</td>
                                <td>
                                    <select
                                        className="input-field"
                                        style={{ padding: '6px 10px', fontSize: 13, height: 'auto', minWidth: 150 }}
                                        value={product.store_category_id || ''}
                                        onChange={e => changeCategory(product.id, e.target.value)}
                                        disabled={updatingParams === product.id}
                                    >
                                        <option value="">-- Sem Categoria --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <button
                                        onClick={() => toggleVisibility(product)}
                                        disabled={updatingParams === product.id}
                                        style={{
                                            background: product.show_in_store ? 'rgba(0, 206, 201, 0.1)' : 'var(--bg-secondary)',
                                            color: product.show_in_store ? 'var(--success)' : 'var(--text-muted)',
                                            border: `1px solid ${product.show_in_store ? 'rgba(0, 206, 201, 0.3)' : 'var(--border-color)'}`,
                                            padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                                            fontWeight: 600, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6
                                        }}
                                    >
                                        {product.show_in_store ? <FiCheck size={14} /> : <FiX size={14} />}
                                        {product.show_in_store ? 'Visível' : 'Oculto'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {products.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        Nenhum produto cadastrado no Gateway ainda.
                    </div>
                )}
            </div>
        </div>
    );
}
