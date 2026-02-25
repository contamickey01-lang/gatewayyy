'use client';

import Link from 'next/link';
import { HiOutlineShieldCheck, HiOutlineCreditCard, HiOutlineCurrencyDollar, HiOutlineChartBar, HiOutlineLightningBolt, HiOutlineGlobeAlt } from 'react-icons/hi';
import { FiArrowRight, FiZap, FiLock, FiTrendingUp } from 'react-icons/fi';

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(10, 10, 15, 0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(42, 42, 58, 0.3)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: 'white'
            }}>G</div>
            <span style={{ fontSize: 20, fontWeight: 700 }}>Gou<span className="gradient-text">Pay</span></span>
          </div>
          <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <Link href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}>Entrar</Link>
            <Link href="/register" className="btn-primary" style={{ padding: '10px 24px', fontSize: 13 }}>Criar Conta Grátis</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        paddingTop: 160, paddingBottom: 100, textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 600, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(108,92,231,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          <div style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: 20,
            background: 'rgba(108,92,231,0.12)', border: '1px solid rgba(108,92,231,0.25)',
            fontSize: 13, fontWeight: 600, color: 'var(--accent-secondary)', marginBottom: 28,
            letterSpacing: 0.5
          }}>
            <FiZap style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} size={14} />
            Plataforma de Pagamentos Inteligente
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: -1.5 }}>
            Venda online com <br />
            <span className="gradient-text">split automático</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>
            Crie sua loja, cadastre produtos e receba pagamentos via Pix e cartão de crédito. O valor é dividido automaticamente entre você e a plataforma.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn-primary" style={{ padding: '16px 36px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              Começar Agora <FiArrowRight size={18} />
            </Link>
            <Link href="#features" className="btn-secondary" style={{ padding: '16px 36px', fontSize: 16 }}>
              Ver Recursos
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 60, marginTop: 80, flexWrap: 'wrap' }}>
            {[
              { value: '99.9%', label: 'Uptime' },
              { value: '< 1s', label: 'Pix Instantâneo' },
              { value: '0%', label: 'Taxa de Adesão' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800 }} className="gradient-text">{stat.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16 }}>Tudo que você precisa para <span className="gradient-text">vender online</span></h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            Ferramentas profissionais para gerenciar seu negócio digital
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {[
            { icon: <FiLock size={24} />, title: 'Checkout Seguro', desc: 'Página de pagamento profissional com Pix e cartão de crédito. SSL e antifraude integrados.' },
            { icon: <FiTrendingUp size={24} />, title: 'Split Automático', desc: 'O valor é dividido automaticamente. Você define a porcentagem para cada venda.' },
            { icon: <FiZap size={24} />, title: 'Pix Instantâneo', desc: 'Receba via Pix em segundos. QR Code gerado automaticamente para cada pagamento.' },
            { icon: <HiOutlineChartBar size={24} />, title: 'Dashboard Completo', desc: 'Acompanhe vendas, saldo, saques e métricas em tempo real com gráficos interativos.' },
            { icon: <HiOutlineCurrencyDollar size={24} />, title: 'Saques via Pix', desc: 'Solicite saques a qualquer momento. O valor é transferido diretamente para sua conta.' },
            { icon: <HiOutlineShieldCheck size={24} />, title: 'Segurança Total', desc: 'Controle de chargeback, logs de transações e proteção contra fraude integrados.' },
          ].map((feature, i) => (
            <div key={i} className="glass-card animate-fade-in" style={{ padding: 32, animationDelay: `${i * 0.1}s` }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(108,92,231,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-secondary)', marginBottom: 20
              }}>{feature.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div className="glass-card" style={{
          maxWidth: 700, margin: '0 auto', padding: '60px 40px',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: -80, right: -80,
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(108,92,231,0.2) 0%, transparent 70%)',
          }} />
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16, position: 'relative' }}>
            Pronto para <span className="gradient-text">começar a vender</span>?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 16 }}>
            Crie sua conta em menos de 2 minutos. Sem taxa de adesão.
          </p>
          <Link href="/register" className="btn-primary" style={{ padding: '16px 40px', fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Criar Conta Grátis <FiArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)', padding: '40px 24px',
        textAlign: 'center', color: 'var(--text-muted)', fontSize: 13
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: 'white'
          }}>G</div>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>GouPay</span>
        </div>
        © {new Date().getFullYear()} GouPay. Todos os direitos reservados.
      </footer>
    </div>
  );
}
