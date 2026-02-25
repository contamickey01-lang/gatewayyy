'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { memberAPI } from '@/lib/api';
import Link from 'next/link';
import {
    FiChevronLeft, FiChevronRight, FiCheckCircle, FiCircle,
    FiPlay, FiFileText, FiDownload, FiArrowLeft, FiMenu, FiX, FiVideo
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ClassroomPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [modules, setModules] = useState<any[]>([]);
    const [currentLesson, setCurrentLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const loadContent = useCallback(async () => {
        try {
            const { data } = await memberAPI.getCourseContent(productId);
            setModules(data.modules || []);

            // Auto-select first lesson if available
            if (data.modules?.length > 0 && data.modules[0].lessons?.length > 0) {
                selectLesson(data.modules[0].lessons[0].id);
            }
        } catch (err) {
            toast.error('Erro ao acessar conteúdo do curso');
            router.push('/area-membros');
        } finally {
            setLoading(false);
        }
    }, [productId, router]);

    useEffect(() => { loadContent(); }, [loadContent]);

    const selectLesson = async (lessonId: string) => {
        try {
            const { data } = await memberAPI.getLesson(lessonId);
            setCurrentLesson(data.lesson);
            // On mobile, close sidebar after selecting
            if (window.innerWidth < 768) setSidebarOpen(false);
        } catch (err) {
            toast.error('Erro ao carregar aula');
        }
    };

    // Helper to extract YouTube video ID
    const getYouTubeEmbedUrl = (url: string) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
        return url; // Return as is if not YouTube (vimeo or direct embed)
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', overflow: 'hidden' }}>

            {/* Sidebar Mobile Toggle */}
            {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} style={{
                    color: 'var(--text-primary)', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)'
                }}>
                    <FiMenu size={20} />
                </button>
            )}

            {/* Sidebar */}
            <aside style={{
                width: 320, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)',
                display: sidebarOpen ? 'flex' : 'none', flexDirection: 'column',
                position: 'relative', zIndex: 90, flexShrink: 0
            }}>
                <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link href="/area-membros" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
                        <FiArrowLeft /> Meus Cursos
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                        <FiX size={18} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
                    {modules.map((module, mIdx) => (
                        <div key={module.id} style={{ marginBottom: 8 }}>
                            <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.02)', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Módulo {mIdx + 1}: {module.title}
                            </div>
                            <div>
                                {module.lessons?.map((lesson: any) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => selectLesson(lesson.id)}
                                        style={{
                                            width: '100%', textAlign: 'left', padding: '14px 20px', border: 'none',
                                            display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer',
                                            background: currentLesson?.id === lesson.id ? 'rgba(108,92,231,0.1)' : 'transparent',
                                            borderLeft: `3px solid ${currentLesson?.id === lesson.id ? 'var(--accent-primary)' : 'transparent'}`,
                                            color: currentLesson?.id === lesson.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ opacity: currentLesson?.id === lesson.id ? 1 : 0.4 }}>
                                            <FiPlay size={14} />
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: currentLesson?.id === lesson.id ? 600 : 400 }}>{lesson.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                {currentLesson ? (
                    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
                        {/* Video Area */}
                        <div style={{
                            width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 16,
                            overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', marginBottom: 32,
                            border: '1px solid var(--border-color)'
                        }}>
                            {currentLesson.video_url ? (
                                <iframe
                                    src={getYouTubeEmbedUrl(currentLesson.video_url)}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                                    <FiVideo size={64} style={{ opacity: 0.1 }} />
                                    <p style={{ color: 'var(--text-muted)' }}>Esta aula não possui vídeo.</p>
                                </div>
                            )}
                        </div>

                        {/* Title & Actions */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 32 }}>
                            <div>
                                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{currentLesson.title}</h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Acessando conteúdo de {modules.find(m => m.id === currentLesson.module_id)?.title}</p>
                            </div>
                            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px' }}>
                                <FiCheckCircle size={18} /> Marcar como concluída
                            </button>
                        </div>

                        {/* Content Area */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 40 }}>
                            <div className="glass-card" style={{ padding: 32 }}>
                                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Descrição da Aula</h4>
                                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 15, whiteSpace: 'pre-wrap' }}>
                                    {currentLesson.description || 'Nenhuma descrição fornecida para esta aula.'}
                                </div>
                                {currentLesson.content && (
                                    <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-color)' }}>
                                        {currentLesson.content}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Materiais Complementares</h4>
                                {currentLesson.files?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {currentLesson.files.map((file: any) => (
                                            <a key={file.id} href={file.file_url} target="_blank" rel="noopener noreferrer" className="glass-card" style={{
                                                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
                                                border: '1px solid var(--border-color)', borderRadius: 12
                                            }}>
                                                <FiFileText size={18} style={{ color: 'var(--accent-secondary)' }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.title}</p>
                                                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Download</p>
                                                </div>
                                                <FiDownload size={14} style={{ color: 'var(--text-muted)' }} />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', fontSize: 13, italic: 'true' } as any}>
                                        Não há arquivos anexados.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                        Selecione uma aula para começar
                    </div>
                )}
            </main>

            <style jsx>{`
                aside::-webkit-scrollbar { width: 4px; }
                aside::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
                a.glass-card:hover { border-color: var(--accent-primary) !important; transform: translateY(-2px); }
            `}</style>
        </div>
    );
}
