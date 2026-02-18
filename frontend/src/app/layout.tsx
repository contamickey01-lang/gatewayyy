import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "PayGateway — Plataforma de Pagamentos",
  description: "Gateway de pagamentos e marketplace SaaS. Venda seus produtos online com checkout profissional, split de pagamentos e saques via Pix.",
  keywords: "gateway de pagamentos, marketplace, pix, cartão de crédito, split, vendas online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#16161f',
              color: '#f0f0f5',
              border: '1px solid #2a2a3a',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#00cec9', secondary: '#16161f' },
            },
            error: {
              iconTheme: { primary: '#ff6b6b', secondary: '#16161f' },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
