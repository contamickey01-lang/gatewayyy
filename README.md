# PayGateway - Gateway de Pagamentos SaaS

Sistema completo de gateway de pagamentos / marketplace integrado com a API Pagar.me v5. Permite que vendedores cadastrem produtos, recebam pagamentos via Pix e cartão de crédito com split automático, e realizem saques via Pix.

## 🚀 Tech Stack

### Frontend
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** + CSS customizado (dark fintech theme)
- **Chart.js** + React-Chartjs-2 (gráficos)
- **React Hot Toast** (notificações)
- **Axios** (HTTP client)

### Backend
- **Node.js** + **Express.js**
- **Supabase** (PostgreSQL)
- **Pagar.me API v5** (processamento de pagamentos)
- **JWT** + **bcryptjs** (autenticação)

## 📁 Estrutura do Projeto

```
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Pagar.me, schema SQL
│   │   ├── controllers/     # Auth, Products, Checkout, Webhooks, Admin, Dashboard, Withdrawals
│   │   ├── middlewares/      # Auth JWT, Validation, Error handler
│   │   ├── routes/           # API routes
│   │   ├── services/         # Pagar.me service
│   │   └── server.js         # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── login/                # Login
│   │   │   ├── register/             # Cadastro
│   │   │   ├── forgot-password/      # Recuperação de senha
│   │   │   ├── checkout/[id]/        # Checkout público
│   │   │   ├── dashboard/            # Painel do vendedor
│   │   │   │   ├── products/         # Gestão de produtos
│   │   │   │   ├── withdrawals/      # Saques
│   │   │   │   └── settings/         # Configurações
│   │   │   └── admin/                # Painel administrativo
│   │   │       ├── sellers/          # Gestão de vendedores
│   │   │       ├── transactions/     # Transações
│   │   │       └── settings/         # Configurações da plataforma
│   │   ├── lib/
│   │   │   └── api.ts               # API client
│   │   └── globals.css              # Design system
│   └── package.json
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

**Backend** — copie `.env.example` para `.env` e preencha:

```env
PORT=3001
JWT_SECRET=sua-chave-secreta-jwt

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=sua-key
SUPABASE_SERVICE_KEY=sua-service-key

PAGARME_API_KEY=sk_xxx
PAGARME_PUBLIC_KEY=pk_xxx
PAGARME_WEBHOOK_SECRET=xxx

PLATFORM_RECIPIENT_ID=rp_xxx
PLATFORM_FEE_PERCENTAGE=15
PLATFORM_NAME=PayGateway

FRONTEND_URL=http://localhost:3000
```

**Frontend** — copie `.env.local.example` para `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=PayGateway
```

### 2. Banco de Dados

Execute o arquivo `backend/src/config/supabase_schema.sql` no seu projeto Supabase para criar todas as tabelas necessárias.

### 3. Instalar dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 4. Executar

```bash
# Backend (porta 3001)
cd backend
npm run dev

# Frontend (porta 3000)
cd frontend
npm run dev
```

## 🎨 Design

- **Dark Theme** fintech premium com glass morphism
- **Gradientes** e micro-animações
- **Design responsivo** com sidebar mobile
- Inspirado em Stripe, Mercado Pago e Hotmart

## 🔒 Segurança

- Autenticação JWT com bcrypt
- RBAC (admin/seller)
- Rate limiting no backend
- Helmet headers
- CORS configurado
- Validação de inputs com express-validator

## 📊 Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Cadastro** | Registro de vendedores com criação automática de recebedor Pagar.me |
| **Produtos** | CRUD completo com link de checkout público |
| **Checkout** | Pix (QR Code) e Cartão de Crédito |
| **Split Automático** | Divisão automática do valor entre vendedor e plataforma |
| **Saques Pix** | Solicitação de saques para chave Pix cadastrada |
| **Dashboard** | Estatísticas, gráficos de vendas, pedidos recentes |
| **Admin** | Gestão de vendedores, transações e taxas da plataforma |
| **Webhooks** | Confirmação automática de pagamentos via Pagar.me |

## 📄 API Endpoints

| Rota | Método | Descrição |
|---|---|---|
| `/api/auth/register` | POST | Cadastro de vendedor |
| `/api/auth/login` | POST | Login |
| `/api/products` | GET/POST | Listar/Criar produtos |
| `/api/products/:id` | PUT/DELETE | Editar/Excluir produto |
| `/api/checkout/pay` | POST | Processar pagamento |
| `/api/webhooks/pagarme` | POST | Webhook Pagar.me |
| `/api/withdrawals` | GET/POST | Listar/Solicitar saque |
| `/api/withdrawals/balance` | GET | Consultar saldo |
| `/api/dashboard/stats` | GET | Estatísticas do vendedor |
| `/api/admin/dashboard` | GET | Estatísticas da plataforma |
| `/api/admin/sellers` | GET | Listar vendedores |
| `/api/admin/settings/fees` | PUT | Configurar taxas |
