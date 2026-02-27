'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { productsAPI, storeCategoriesAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiRefreshCw, FiPlus, FiImage, FiEdit2 } from 'react-icons/fi';
import axios from 'axios';

export default function StoreProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingParams, setUpdatingParams] = useState<string | null>(null);

    // Product Creation State
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({
        name: '', description: '', price: '', image_url: '', type: 'digital', status: 'active'
    });
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                productsAPI.list({ limit: 100 }),
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

    // --- Product Creation Methods ---
    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', description: '', price: '', image_url: '', type: 'digital', status: 'active' });
        setSelectedFile(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const openEdit = (product: any) => {
        setEditing(product);
        setForm({
            name: product.name,
            description: product.description || '',
            price: product.price_display || (product.price / 100).toFixed(2),
            image_url: product.image_url || '',
            type: product.type,
            status: product.status
        });
        setSelectedFile(null);
        setImagePreview(product.image_url || null);
        setShowModal(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const updateForm = (field: string, value: string) => setForm({ ...form, [field]: value });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let finalImageUrl = form.image_url;

            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);

                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                const { data } = await axios.post('/api/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                });
                finalImageUrl = data.url;
            }

            const productData = {
                ...form,
                image_url: finalImageUrl,
                price: parseFloat(form.price),
                // By default, if they create it here, optionally set it to show in store immediately
                show_in_store: editing ? undefined : true
            };

            if (editing) {
                await productsAPI.update(editing.id, productData);
                toast.success('Produto atualizado!');
            } else {
                await productsAPI.create(productData);
                toast.success('Produto criado e adicionado à loja!');
            }
            setShowModal(false);
            loadData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao salvar produto');
        } finally {
            setUploading(false);
        }
    };
    // --------------------------------

    if (loading) return <div>Carregando...</div>;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>Produtos da Vitrine</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={loadData} className="btn-secondary" style={{ padding: '8px 12px' }}>
                        <FiRefreshCw size={14} /> Atualizar
                    </button>
                    <button onClick={openCreate} className="btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiPlus size={16} /> Novo Produto
                    </button>
                </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
                Crie novos produtos ou gerencie a visibilidade dos produtos existentes na sua loja pública.
            </p>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Preço</th>
                            <th>Categoria na Loja</th>
                            <th style={{ textAlign: 'center' }}>Ações</th>
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
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
                                            title="Mostrar na vitrine da loja"
                                        >
                                            {product.show_in_store ? <FiCheck size={14} /> : <FiX size={14} />}
                                            {product.show_in_store ? 'Vitrine' : 'Oculto'}
                                        </button>
                                        <button
                                            onClick={() => openEdit(product)}
                                            style={{
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-color)',
                                                color: 'var(--text-primary)',
                                                padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title="Editar Detalhes"
                                        >
                                            <FiEdit2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {products.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        <p style={{ marginBottom: 16 }}>Nenhum produto cadastrado ainda.</p>
                        <button onClick={openCreate} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, margin: '0 auto' }}>
                            <FiPlus size={16} /> Criar Primeiro Produto
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && createPortal(
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: 500, padding: 40, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{editing ? 'Editar Produto' : 'Novo Produto'}</h3>
                            <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <FiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Nome do produto</label>
                                <input type="text" className="input-field" placeholder="Ex: E-book de Vendas" required
                                    value={form.name} onChange={e => updateForm('name', e.target.value)} />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Descrição</label>
                                <textarea className="input-field" placeholder="Descreva seu produto..." rows={2}
                                    value={form.description} onChange={e => updateForm('description', e.target.value)}
                                    style={{ resize: 'vertical' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Preço (R$)</label>
                                    <input type="number" step="0.01" min="0.01" className="input-field" placeholder="99.90" required
                                        value={form.price} onChange={e => updateForm('price', e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Tipo</label>
                                    <select className="input-field" value={form.type} onChange={e => updateForm('type', e.target.value)}>
                                        <option value="digital">Digital (Infoproduto)</option>
                                        <option value="physical">Físico</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Imagem do produto</label>
                                    <div style={{
                                        border: '1px dashed var(--border-color)',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 12,
                                        padding: 12,
                                        position: 'relative',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12
                                    }} onClick={() => document.getElementById('storeFileInput')?.click()}>
                                        {imagePreview ? (
                                            <img src={imagePreview} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} alt="Preview" />
                                        ) : (
                                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FiImage size={18} style={{ color: 'var(--text-muted)' }} />
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {selectedFile ? selectedFile.name : 'Selecione uma imagem'}
                                            </p>
                                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>JPG, PNG ou GIF. Máx 2MB.</p>
                                        </div>
                                        <input id="storeFileInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Status</label>
                                    <select className="input-field" value={form.status} onChange={e => updateForm('status', e.target.value)}>
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" disabled={uploading} style={{ width: '100%' }}>
                                {uploading ? 'Salvando...' : (editing ? 'Salvar Alterações' : 'Criar Produto na Loja')}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
