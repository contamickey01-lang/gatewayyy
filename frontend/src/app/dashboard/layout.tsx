'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiHome, FiPackage, FiDollarSign, FiSettings, FiLogOut, FiMenu, FiX, FiPercent, FiBookOpen, FiUser, FiMessageCircle } from 'react-icons/fi';
import { ThemeToggle } from '@/components/theme-toggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const avatarRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!token || !userData) {
            router.push('/login');
            return;
        }
        setUser(JSON.parse(userData));
    }, [router]);

    // Close profile dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                profileRef.current && !profileRef.current.contains(e.target as Node) &&
                avatarRef.current && !avatarRef.current.contains(e.target as Node)
            ) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const navItems = [
        { href: '/dashboard', icon: <FiHome size={18} />, label: 'Dashboard' },
        { href: '/dashboard/products', icon: <FiPackage size={18} />, label: 'Produtos' },
        { href: '/dashboard/withdrawals', icon: <FiDollarSign size={18} />, label: 'Saques' },
        { href: '/dashboard/fees', icon: <FiPercent size={18} />, label: 'Taxas' },
        { href: '/dashboard/settings', icon: <FiSettings size={18} />, label: 'Configurações' },
        { href: '/dashboard/contact', icon: <FiMessageCircle size={18} />, label: 'Falar com a gente' },
    ];

    if (!user) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div onClick={() => setSidebarOpen(false)} style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40,
                    display: 'none',
                }} className="mobile-overlay" />
            )}

            {/* Sidebar */}
            <aside style={{
                width: 260, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50,
                transform: sidebarOpen ? 'translateX(0)' : undefined,
                transition: 'transform 0.3s ease',
            }}>
                {/* Logo */}
                <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src="/logo.png" alt="GouPay Logo" style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} />
                    <span style={{ fontSize: 18, fontWeight: 700 }}>Gou<span className="gradient-text">Pay</span></span>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}
                            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}>
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* User info */}
                <div style={{
                    padding: '16px 12px', borderTop: '1px solid var(--border-color)',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                        borderRadius: 10, background: 'rgba(108,92,231,0.06)', marginBottom: 8
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, background: 'var(--accent-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0
                        }}>
                            {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="sidebar-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                        <FiLogOut size={18} /> Sair
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main style={{ flex: 1, marginLeft: 260, minHeight: '100vh' }}>
                {/* Top bar */}
                <header style={{
                    padding: '16px 32px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--header-bg)', backdropFilter: 'blur(10px)',
                    position: 'sticky', top: 0, zIndex: 30
                }}>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
                        display: 'none', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer'
                    }} className="mobile-menu-btn">
                        {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                    </button>
                    <h2 style={{ fontSize: 18, fontWeight: 600 }}>
                        {navItems.find(n => n.href === pathname)?.label || 'Dashboard'}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                        <ThemeToggle />
                        <span className="badge badge-success" style={{ fontSize: 11 }}>Online</span>
                        <button ref={avatarRef} onClick={() => setProfileOpen(!profileOpen)} style={{
                            width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 15, fontWeight: 700, color: 'white', border: '2px solid transparent',
                            cursor: 'pointer', transition: 'all 0.2s',
                            outline: profileOpen ? '2px solid var(--accent-primary)' : 'none',
                            outlineOffset: 2
                        }}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </button>
                    </div>
                </header>

                {/* Profile Dropdown - rendered via portal */}
                {profileOpen && createPortal(
                    <div ref={profileRef} style={{
                        position: 'fixed', top: 60, right: 24, zIndex: 99999,
                        width: 280, background: 'var(--bg-card, #1a1a2e)', borderRadius: 16,
                        border: '1px solid var(--border-color)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                        overflow: 'hidden', animation: 'dropIn 0.2s ease'
                    }}>
                        {/* User Info */}
                        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, background: 'var(--accent-gradient)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 18, fontWeight: 700, color: 'white', flexShrink: 0
                                }}>
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div style={{ padding: '8px' }}>
                            <Link href="/area-membros" onClick={() => setProfileOpen(false)} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px',
                                borderRadius: 10, color: 'var(--text-primary)', textDecoration: 'none',
                                fontSize: 14, fontWeight: 500, transition: 'background 0.15s',
                                background: 'transparent'
                            }} className="profile-menu-item">
                                <FiBookOpen size={16} style={{ color: 'var(--accent-secondary)' }} />
                                Painel do Aluno
                            </Link>
                            <button onClick={() => { setProfileOpen(false); handleLogout(); }} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px',
                                borderRadius: 10, color: 'var(--danger)', textDecoration: 'none',
                                fontSize: 14, fontWeight: 500, transition: 'background 0.15s',
                                background: 'transparent', border: 'none', width: '100%', cursor: 'pointer'
                            }} className="profile-menu-item">
                                <FiLogOut size={16} />
                                Sair
                            </button>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Page content */}
                <div style={{ padding: 32 }}>
                    {children}
                </div>
            </main>

            <style jsx global>{`
      @media (max-width: 768px) {
          aside { transform: translateX(-100%) !important; }
          aside[style*="translateX(0)"] { transform: translateX(0) !important; }
          main { margin-left: 0 !important; }
          .mobile-overlay { display: block !important; }
          .mobile-menu-btn { display: block !important; }
        }
        .profile-menu-item:hover {
          background: rgba(255,255,255,0.06) !important;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
