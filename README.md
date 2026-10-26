# Olimpo — Sorteador Oficial do Instagram

> **Plataforma de sorteios moderna, auditável e segura para a Olimpo Açaíteria & Sorveteria.**  
> Desenvolvido com **Next.js 16+ (App Router com Turbopack)**, **Tailwind CSS v4**, **Liquid Glass Olimpo** e persistência no **Supabase Postgres (RLS)**, 100% compliant com a API oficial da Meta Graph API v21.0.

---

## 🎯 Objetivo & Diferenciais
- **Tela de Login & Conexão Oficial Meta**: Interface de autenticação com o App já registrado na Meta (`App ID: 28628987183389511`), garantindo acesso seguro via OAuth aos perfis profissionais do Instagram.
- **100% API Oficial da Meta**: Sem scraping, sem extensões ou robôs piratas e sem risco de banimento da conta da Olimpo.
- **Auditoria Criptográfica Imutável**: Sorteio server-side com CSPRNG, Fisher-Yates e geração de snapshot imutável em hash SHA-256 para comprovação pública dos vencedores e suplentes.
- **Proteção Rigorosa de Cotas (Supabase Free)**:
  - **Zero Egress para Branding**: Todos os 14 SVGs e PNGs da Olimpo são servidos estaticamente via Vercel (`/public/brand/`).
  - **Chunked Batch Import**: Importação paginada em fatias curtas (< 2s) para contornar o limite de timeout da Vercel (10-15s) e rate limits da Meta.
  - **Retenção de 30 Dias**: Dados brutos de comentários expiram após 30 dias para manter o banco bem abaixo dos 500 MB da franquia gratuita.
- **Identidade Visual Premium**: Liquid Glass com a paleta oficial da Olimpo (Roxo Açaí Profundo `#2d0f2e`, `#39173d`, Dourado `#f8d292` ➔ `#c49146` e Creme `#f7ead8`).

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16+ (App Router, Turbopack) & React 19
- **Linguagem**: TypeScript (Strict Mode)
- **Estilização**: Tailwind CSS v4, Lucide Icons, Framer Motion, Canvas Confetti
- **Backend & Dados**: Supabase Postgres (PostgreSQL 17 com RLS), Vercel Route Handlers
- **APIs Externas**: Meta Graph API v21.0 (Instagram Login for Business)

---

## 📁 Estrutura de Diretórios
```text
VICCS_Sorteador/
├── .agent/
│   └── overview/                 # PROJECT_STATUS.md
├── Olimpo/
│   ├── .agent/
│   │   ├── assets/visual-identity/   # Manual de Marca da Olimpo, SVGs e PNGs oficiais
│   │   ├── context/                  # Arquitetura, stack e plano de implementação
│   │   ├── guidelines/               # Estilo de código e UI/UX Liquid Glass
│   │   ├── memory/                   # active_task, todos e changelog
│   │   └── overview/                 # PROJECT_STATUS.md
│   ├── public/
│   │   └── brand/                    # Assets visuais da Olimpo servidos estaticamente
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── auth/meta/url/          # Gera URL oficial de OAuth da Meta
│   │   │   │   ├── auth/meta/callback/     # Recebe código e troca por Long-Lived Token (60 dias)
│   │   │   │   ├── instagram/media/        # Lista posts e Reels recentes da conta
│   │   │   │   ├── instagram/import-chunk/ # Motor de importação paginada em fatias
│   │   │   │   └── draw/execute/           # Sorteio com semente CSPRNG e hash SHA-256
│   │   │   ├── globals.css                 # Tokens de design da Olimpo e Liquid Glass utilities
│   │   │   ├── layout.tsx                  # Metadata oficial e Inter Font
│   │   │   └── page.tsx                    # Tela de Login Oficial Meta & Workspace de Sorteio
│   │   └── lib/
│   │       ├── meta/api.ts                 # Integração com a Meta Graph API v21.0
│   │       ├── security.ts                 # Criptografia AES-256 e SHA-256
│   │       └── supabase/                   # Clientes Supabase SSR e Admin
│   ├── supabase/
│   │   └── migrations/                     # 20261019_init_olimpo_schema.sql (8 tabelas + RLS)
│   ├── package.json
│   └── README.md
└── README.md
```

---

## 🚀 Como Executar Localmente

### 1. Clonar e Instalar Dependências
```bash
cd Olimpo
npm install
```

### 2. Configurar Variáveis de Ambiente
Configure suas credenciais no `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://okwylcdhmcnwoykxshfh.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
META_APP_ID="28628987183389511"
META_APP_SECRET="..."
NEXT_PUBLIC_META_REDIRECT_URI="http://localhost:3000/api/auth/meta/callback"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_SECRET="..."
```

### 3. Rodar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🔒 Segurança & Auditoria
- **Autenticação Oficial Meta**: Integração via OAuth com consentimento explícito dos escopos necessários.
- **Tokens Criptografados**: Tokens armazenados com criptografia **AES-256-GCM** no Postgres.
- **Prova Criptográfica**: Cada apuração gera um snapshot com hash SHA-256 imutável.
- **Row Level Security (RLS)**: Habilitado nas 8 tabelas do banco de dados Supabase.
