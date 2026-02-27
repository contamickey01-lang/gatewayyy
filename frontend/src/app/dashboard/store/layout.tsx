'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { href: '/dashboard/store/settings', label: 'Configurações' },
        { href: '/dashboard/store/categories', label: 'Categorias' },
        { href: '/dashboard/store/products', label: 'Produtos da Loja' }
    ];

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Minha Loja</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Personalize sua vitrine de vendas e defina as categorias.</p>
            </div>

            {/* Sub-navigation Tabs */}
            <div style={{
                display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)',
                marginBottom: 32, overflowX: 'auto', paddingBottom: 2
            }}>
                {tabs.map(tab => (
                    <Link key={tab.href} href={tab.href} style={{
                        padding: '12px 20px', fontSize: 14, fontWeight: 600,
                        color: pathname === tab.href ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        borderBottom: `2px solid ${pathname === tab.href ? 'var(--accent-primary)' : 'transparent'}`,
                        textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap'
                    }}>
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Tab content */}
            <div>
                {children}
            </div>
        </div>
    );
}
