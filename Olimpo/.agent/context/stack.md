# Stack Tecnológica: Sorteador Olimpo

## Core
- **Framework Web**: Next.js 15+ (App Router) com React 19
- **Linguagem**: TypeScript (Strict Mode)
- **Hospedagem & Compute**: Vercel (Hobby/Pro compatible)
- **Banco de Dados & Autenticação**: Supabase Postgres (PostgreSQL 17) + Supabase Auth
- **ORM / Query**: Supabase JS Client (`@supabase/ssr` e `@supabase/supabase-js`) com Tipos Gerados

## UI & Styling
- **CSS**: Tailwind CSS v3/v4 com tokens personalizados da marca Olimpo
- **Componentes Base**: Radix UI Primitives / Lucide Icons
- **Efeito Visual**: Liquid Glass customizado (backdrop-blur, border glows sutis, reflexos dourados)
- **Animações**: Framer Motion (com chaveamento para `prefers-reduced-motion`)
- **Visualização de Dados**: Recharts (gráficos responsivos de barras, áreas e pizza sem ruído 3D)

## APIs Externas
- **Meta Graph API v21.0+**: Endpoint `/me/media`, `/{media-id}/comments`, `/{comment-id}/replies`
- **Autenticação Instagram**: OAuth 2.0 (Instagram Login for Business / Facebook Login for Business)
