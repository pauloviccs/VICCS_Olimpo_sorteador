# Arquitetura do Sistema: Sorteador Olimpo Instagram

## 1. Visão Geral (ELI5)
Imagine o sistema como uma casa de eventos premium da Olimpo:
- O **Next.js na Vercel** é o salão e os garçons rápidos: recebem os convidados, mostram as telas com visual Liquid Glass e atendem cada pedido em frações de segundo.
- O **Supabase** é o cofre forte: guarda os registros dos sorteios, as regras e os vencedores com chave de segurança (RLS - Row Level Security) para que ninguém veja o sorteio de outro cliente.
- A **API da Meta** é a portaria do Instagram: só deixa ver os comentários se o organizador mostrar o crachá oficial (OAuth) da conta profissional dona daquele post.

## 2. Diagrama de Fluxo e Componentes

```text
[ Usuário / Navegador ]
         │
         │ (HTTPS / Liquid Glass UI)
         ▼
[ Vercel: Next.js App Router ]
    ├── Frontend: React 19, Tailwind CSS, Radix UI, Framer Motion, Recharts
    └── Route Handlers (/api):
         ├── /api/auth/meta/callback (Troca code por token e guarda no Supabase)
         ├── /api/instagram/media (Lista posts da conta conectada)
         ├── /api/instagram/import-chunk (Importa 100-200 comentários por fatia)
         └── /api/draw/execute (Gera seed aleatória criptográfica, sorteia e gera hash SHA-256)
         │
         ├─── (REST com Bearer Token) ───► [ Meta Graph API ] (Leitura oficial paginada)
         │
         └─── (Supabase Client + RLS) ───► [ Supabase Postgres & Auth ]
                                               ├── profiles / workspaces
                                               ├── instagram_connections (tokens criptografados)
                                               ├── giveaways & giveaway_rules
                                               ├── import_jobs (checkpoints de paginação)
                                               ├── giveaway_entries (dados essenciais indexados)
                                               └── draw_results (audit snapshot imutável)
```

## 3. Estratégia de Importação em Fatias (Chunked Batch Import)
- **Problema**: A Vercel Hobby corta funções que duram mais de 10-15 segundos. Um post com 10.000 comentários levaria mais de 1 minuto para baixar tudo.
- **Solução**: O frontend faz chamadas curtas e iterativas para `/api/instagram/import-chunk`. Cada chamada processa 2 a 4 páginas da Meta (100 a 200 comentários), grava no Supabase, atualiza o cursor de checkpoint e responde em menos de 2 segundos. O navegador exibe uma barra de progresso viva e se cair a conexão, o usuário continua de onde parou sem perder nada!

## 4. Proteção Rigorosa de Egress e Quotas Supabase Free
1. **Zero Storage para imagens externas**: Nenhuma foto de perfil de participante é baixada ou gravada no Supabase Storage.
2. **Assets Olimpo 100% na Vercel**: Todos os SVGs, logos, fontes e montanhas ficam na pasta `public/` do Next.js. Egress no Supabase = 0 bytes para branding.
3. **Payloads mínimos**: Consultas SQL utilizam projeções explícitas de colunas (nada de `SELECT *`).
4. **Retenção Inteligente de 30 dias**: Textos completos de comentários são purgados após 30 dias do sorteio, mantendo apenas o snapshot matemático imutável (hash SHA-256) dos vencedores e estatísticas agregadas.
