'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiHome, FiPackage, FiDollarSign, FiSettings, FiLogOut, FiMenu, FiX } from 'react-icons/fi';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!token || !userData) {
            router.push('/login');
            return;
        }
        setUser(JSON.parse(userData));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const navItems = [
        { href: '/dashboard', icon: <FiHome size={18} />, label: 'Dashboard' },
        { href: '/dashboard/products', icon: <FiPackage size={18} />, label: 'Produtos' },
        { href: '/dashboard/withdrawals', icon: <FiDollarSign size={18} />, label: 'Saques' },
        { href: '/dashboard/settings', icon: <FiSettings size={18} />, label: 'Configurações' },
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
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 800, color: 'white'
                    }}>P</div>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>Pay<span className="gradient-text">Gateway</span></span>
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
                    background: 'rgba(10, 10, 15, 0.6)', backdropFilter: 'blur(10px)',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="badge badge-success" style={{ fontSize: 11 }}>Online</span>
                    </div>
                </header>

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
      `}</style>
        </div>
    );
}
