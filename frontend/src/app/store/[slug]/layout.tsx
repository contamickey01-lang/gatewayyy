'use client';

import { useParams } from 'next/navigation';
import { CartProvider } from '@/contexts/CartContext';

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const slug = params.slug as string;

    return (
        <CartProvider storeSlug={slug}>
            {children}
        </CartProvider>
    );
}
