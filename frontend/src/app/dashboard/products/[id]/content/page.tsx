'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { contentAPI, productsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp,
    FiVideo, FiFileText, FiArrowLeft, FiX, FiCheck, FiPlay
} from 'react-icons/fi';

export default function ContentEditorPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [product, setProduct] = useState<any>(null);
    const [modules, setModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [editingModule, setEditingModule] = useState<any>(null);
    const [editingLesson, setEditingLesson] = useState<any>(null);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

    const [moduleForm, setModuleForm] = useState({ title: '', order: 0 });
    const [lessonForm, setLessonForm] = useState({
        title: '', description: '', video_url: '', video_source: 'youtube', order: 0, content: ''
    });

    const loadData = useCallback(async () => {
        try {
            const [prodRes, modRes] = await Promise.all([
                productsAPI.getById(productId),
                contentAPI.listModules(productId)
            ]);
            setProduct(prodRes.data.product);

            // Load lessons for each module
            const modulesWithLessons = await Promise.all((modRes.data.modules || []).map(async (mod: any) => {
                const lessRes = await contentAPI.listLessons(mod.id);
                return { ...mod, lessons: lessRes.data.lessons || [] };
            }));

            setModules(modulesWithLessons);
        } catch (err) {
            toast.error('Erro ao carregar dados do produto');
            router.push('/dashboard/products');
        } finally {
            setLoading(false);
        }
    }, [productId, router]);

    useEffect(() => { loadData(); }, [loadData]);

    // Module Actions
    const handleModuleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingModule) {
                await contentAPI.updateModule(editingModule.id, moduleForm);
                toast.success('Módulo atualizado!');
            } else {
                await contentAPI.createModule(productId, moduleForm);
                toast.success('Módulo criado!');
            }
            setShowModuleModal(false);
            loadData();
        } catch (err: any) {
            toast.error('Erro ao salvar módulo');
        }
    };

    const deleteModule = async (id: string) => {
        if (!confirm('Excluir este módulo e todas as suas aulas?')) return;
        try {
            await contentAPI.deleteModule(id);
            toast.success('Módulo excluído!');
            loadData();
        } catch (err) {
            toast.error('Erro ao excluir módulo');
        }
    };

    // Lesson Actions
    const handleLessonSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeModuleId && !editingLesson) return;
        try {
            if (editingLesson) {
                await contentAPI.updateLesson(editingLesson.id, lessonForm);
                toast.success('Aula atualizada!');
            } else {
                await contentAPI.createLesson(activeModuleId!, lessonForm);
                toast.success('Aula criada!');
            }
            setShowLessonModal(false);
            loadData();
        } catch (err: any) {
            toast.error('Erro ao salvar aula');
        }
    };

    const deleteLesson = async (id: string) => {
        if (!confirm('Excluir esta aula?')) return;
        try {
            await contentAPI.deleteLesson(id);
            toast.success('Aula excluída!');
            loadData();
        } catch (err) {
            toast.error('Erro ao excluir aula');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <Link href="/dashboard/products" style={{
                    width: 40, height: 40, borderRadius: 12, background: 'var(--bg-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)'
                }}>
                    <FiArrowLeft size={18} />
                </Link>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>Gerenciar Conteúdo</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{product?.name}</p>
                </div>
            </header>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>Módulos e Aulas</h2>
                <button className="btn-primary" onClick={() => {
                    setEditingModule(null);
                    setModuleForm({ title: '', order: modules.length + 1 });
                    setShowModuleModal(true);
                }} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                    <FiPlus size={16} /> Novo Módulo
                </button>
            </div>

            {modules.length === 0 ? (
                <div className="glass-card" style={{ padding: 48, textAlign: 'center', opacity: 0.8 }}>
                    <FiFileText size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Nenhum módulo criado ainda. Comece criando o primeiro!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {modules.map((module) => (
                        <div key={module.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            {/* Module Header */}
                            <div style={{
                                padding: '16px 24px', background: 'rgba(255,255,255,0.02)',
                                borderBottom: '1px solid var(--border-color)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 6, background: 'var(--accent-gradient)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white'
                                    }}>{module.order}</div>
                                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{module.title}</h3>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => {
                                        setEditingModule(module);
                                        setModuleForm({ title: module.title, order: module.order });
                                        setShowModuleModal(true);
                                    }} className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }}>
                                        <FiEdit2 size={14} />
                                    </button>
                                    <button onClick={() => deleteModule(module.id)} className="btn-danger" style={{ padding: '6px 10px', fontSize: 12 }}>
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Lessons List */}
                            <div style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {module.lessons?.map((lesson: any) => (
                                        <div key={lesson.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10,
                                            border: '1px solid transparent', transition: 'all 0.2s'
                                        }} className="lesson-item">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <FiPlay size={14} style={{ color: 'var(--accent-secondary)' }} />
                                                <span style={{ fontSize: 14 }}>{lesson.title}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => {
                                                    setEditingLesson(lesson);
                                                    setLessonForm({
                                                        title: lesson.title,
                                                        description: lesson.description || '',
                                                        video_url: lesson.video_url || '',
                                                        video_source: lesson.video_source || 'youtube',
                                                        order: lesson.order,
                                                        content: lesson.content || ''
                                                    });
                                                    setActiveModuleId(module.id);
                                                    setShowLessonModal(true);
                                                }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                                    <FiEdit2 size={14} />
                                                </button>
                                                <button onClick={() => deleteLesson(lesson.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.6 }}>
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => {
                                        setActiveModuleId(module.id);
                                        setEditingLesson(null);
                                        setLessonForm({ title: '', description: '', video_url: '', video_source: 'youtube', order: (module.lessons?.length || 0) + 1, content: '' });
                                        setShowLessonModal(true);
                                    }} style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
                                        background: 'none', border: '1px dashed var(--border-color)', borderRadius: 10,
                                        color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', marginTop: 4
                                    }}>
                                        <FiPlus size={14} /> Adicionar Aula
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Module Modal */}
            {showModuleModal && createPortal(
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: 500, padding: 40 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{editingModule ? 'Editar Módulo' : 'Novo Módulo'}</h3>
                            <button onClick={() => setShowModuleModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
                        </div>
                        <form onSubmit={handleModuleSubmit}>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Título do Módulo</label>
                                <input className="input-field" required value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Ex: Introdução" />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Ordem</label>
                                <input type="number" className="input-field" value={moduleForm.order} onChange={e => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) })} />
                            </div>
                            <button className="btn-primary" style={{ width: '100%' }}>Salvar Módulo</button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Lesson Modal */}
            {showLessonModal && createPortal(
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: 650, padding: 40, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{editingLesson ? 'Editar Aula' : 'Nova Aula'}</h3>
                            <button onClick={() => setShowLessonModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
                        </div>
                        <form onSubmit={handleLessonSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Título da Aula</label>
                                <input className="input-field" required value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Ex: Aula 01 - Boas vindas" />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>URL do Vídeo (YouTube/Vimeo)</label>
                                <input className="input-field" value={lessonForm.video_url} onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Descrição da Aula</label>
                                <textarea className="input-field" rows={3} value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} placeholder="Explique o que será ensinado nesta aula..." />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Ordem</label>
                                <input type="number" className="input-field" value={lessonForm.order} onChange={e => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) })} />
                            </div>
                            <button className="btn-primary" style={{ width: '100%' }}>Salvar Aula</button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <style jsx>{`
                .lesson-item:hover {
                    background: rgba(255,255,255,0.05) !important;
                    border-color: rgba(142,68,173,0.3) !important;
                    transform: translateX(4px);
                }
            `}</style>
        </div>
    );
}
