# Project Overview

## Project Name
Olimpo — Sorteador Oficial do Instagram

## Description
Aplicação web moderna, responsiva, segura e auditável para criação, configuração, apuração e divulgação de sorteios baseados em comentários do Instagram para a marca Olimpo Açaíteria & Sorveteria. 100% compliant com a API oficial da Meta Graph API v21.0 (sem scraping), hospedada na Vercel e persistida no Supabase Postgres dentro dos limites estritos do plano Free (5GB egress, 500MB DB).

## Tech Stack
- Languages: TypeScript, SQL, CSS
- Frameworks: Next.js 16+ (App Router com Turbopack), React 19
- Styling & UI: Tailwind CSS v4, Liquid Glass Olimpo, Lucide Icons, Framer Motion, Canvas Confetti
- Services: Supabase (PostgreSQL 17, RLS ativado, Auth SSR/Admin), Vercel (Hosting & Route Handlers), Meta Graph API v21.0

## Folder Structure
```text
VICCS_Sorteador/
├── .agent/
│   └── overview/
│       └── PROJECT_STATUS.md
├── Olimpo/
│   ├── .agent/
│   │   ├── assets/
│   │   │   └── visual-identity/ (Manual de Marca PDF, SVGs e PNGs 2x/3x)
│   │   ├── context/
│   │   │   ├── PLANO_IMPLEMENTACAO_SORTEADOR_INSTAGRAM.md
│   │   │   ├── architecture.md
│   │   │   └── stack.md
│   │   ├── guidelines/
│   │   │   ├── code_style.md
│   │   │   └── ui_ux.md
│   │   ├── memory/
│   │   │   ├── active_task.md
│   │   │   ├── todos.md
│   │   │   └── changelog.md
│   │   └── overview/
│   │       └── PROJECT_STATUS.md
│   ├── public/
│   │   └── brand/ (14 SVGs, logos e símbolos Olimpo servidos estaticamente)
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── auth/meta/url/route.ts       # Gera URL oficial de autorização OAuth
│   │   │   │   ├── auth/meta/callback/route.ts  # Troca de código por token e persistência AES-256
│   │   │   │   ├── instagram/media/route.ts     # Busca mídias da conta oficial
│   │   │   │   ├── instagram/import-chunk/route.ts # Importação paginada em fatias
│   │   │   │   └── draw/execute/route.ts        # Algoritmo de sorteio auditável com SHA-256
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                         # Tela de Login Oficial Meta & Workspace de Sorteio
│   │   └── lib/
│   │       ├── meta/api.ts                      # Cliente oficial Meta Graph API v21.0
│   │       ├── security.ts                      # Criptografia AES-256 e hash SHA-256
│   │       └── supabase/                        # client.ts, server.ts, admin.ts
│   ├── supabase/
│   │   └── migrations/                          # 20261019_init_olimpo_schema.sql (8 tabelas RLS)
│   ├── package.json
│   └── README.md
└── README.md
```

## Current URLs & Endpoints
- **App Local URL**: `http://localhost:3000`
- **Meta Redirect URI**: `http://localhost:3000/api/auth/meta/callback`
- **Supabase Project URL**: `https://okwylcdhmcnwoykxshfh.supabase.co`
- **Meta Auth URL Endpoint**: `GET /api/auth/meta/url`
- **Meta Callback Endpoint**: `GET /api/auth/meta/callback`
- **Instagram Media Endpoint**: `GET /api/instagram/media`
- **Chunked Batch Import Endpoint**: `POST /api/instagram/import-chunk`
- **Audit Draw Execution Endpoint**: `POST /api/draw/execute`

## Current Features Implemented
- **Tela de Login Dedicada & Conexão Oficial Meta**: Interface de entrada em Liquid Glass com exibição do App Meta ID (`28628987183389511`), escopos da Graph API v21.0, criptografia AES-256 e botão de fallback para homologação/demonstração imediata.
- **Identidade Visual Olimpo**: Design system completo com a paleta oficial (`#2d0f2e`, `#39173d`, `#662771`, `#f8d292` ➔ `#c49146`, `#f7ead8`), tipografia Agenor + Inter e 14 assets servidos estaticamente via Vercel (Zero Egress no Supabase).
- **Banco de Dados Supabase (okwylcdhmcnwoykxshfh)**: Migração aplicada com 8 tabelas centrais com Row Level Security (RLS) habilitado e índices de alta performance.
- **Autenticação & Ciclo de Token Meta**: Geração de URL de autorização oficial com CSRF state token, troca por Long-Lived Token (60 dias) e armazenamento com criptografia AES-256-GCM.
- **Motor de Importação em Fatias (Chunked Batch Import)**: Arquitetura paginada que busca 50 comentários por vez com checkpoints no banco, contornando o limite de timeout da Vercel e rate limits da Meta.
- **Algoritmo de Sorteio Auditável**: Semente criptográfica CSPRNG, embaralhamento Fisher-Yates, seleção de ganhadores e suplentes, e geração de snapshot imutável em hash SHA-256.
- **Workspace Interativo Liquid Glass**: Prévia reativa de cupons com validação dinâmica de regras (menções `@`, hashtags, chance única), contagem regressiva, comemoração com confetti e medidor de cota do Supabase Free.

## Work-in-Progress Items
- Homologação final com usuário ao vivo logando diretamente no Facebook OAuth.
- Página pública dedicada para conferência externa de resultados (`/s/[id]`).

## Known TODOs or Missing Parts
- Modo de apresentação em tela cheia para lives no Instagram.
- Rotina automatizada de purga de comentários crus após 30 dias para proteção de disco.
