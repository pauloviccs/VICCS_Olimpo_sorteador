# Changelog: Sorteador Olimpo Instagram

## [0.2.0] - 2026-10-19
### Adicionado
- Configuração segura das variáveis de ambiente reais no `.env.local` (Supabase e Meta Graph API).
- Sanitização preventiva do `.env.example` para evitar exposição de secrets em repositórios públicos.
- Execução e aplicação bem-sucedida da migração SQL no projeto Supabase do cliente (`okwylcdhmcnwoykxshfh`) via Supabase MCP (`apply_migration`).
- Criação das 8 tabelas centrais com Row Level Security (RLS) habilitado e índices otimizados para proteção de egress e disco:
  - `workspaces`
  - `instagram_accounts`
  - `giveaways`
  - `giveaway_rules`
  - `import_jobs`
  - `giveaway_entries`
  - `draw_results`
  - `audit_logs`
- Implementação dos Route Handlers de Backend:
  - `/api/auth/meta/url`: Geração da URL oficial de login da Meta com proteção contra CSRF.
  - `/api/auth/meta/callback`: Troca de código OAuth por Long-Lived Token (60 dias) e armazenamento criptografado (AES-256-GCM) no Postgres.
  - `/api/instagram/media`: Consulta oficial de postagens e Reels recentes da conta conectada.
  - `/api/instagram/import-chunk`: Motor de importação em fatias paginadas (Chunked Batch) para contornar timeouts de Serverless e rate limits.
  - `/api/draw/execute`: Algoritmo de sorteio auditável com semente CSPRNG, Fisher-Yates, snapshot SHA-256 e gravação imutável no Supabase.
- Integração da interface Liquid Glass com os novos endpoints e suporte a conexão de conta oficial da Meta.

## [0.1.0] - 2026-10-19
### Adicionado
- Leitura e análise do `PLANO_IMPLEMENTACAO_SORTEADOR_INSTAGRAM.md`.
- Inspeção e catalogação completa dos assets da marca Olimpo (Açaiteria & Sorveteria): 14 SVGs, manual PDF, paleta de cores e tipografia Agenor + Inter.
- Mapeamento e documentação da integração Meta Graph API (Instagram Business/Creator, escopos, paginação e rate limits).
- Diagnóstico de limites e cotas para Supabase Free (5GB egress, 500MB DB) e Vercel Hobby (timeout de Serverless Functions).
- Estruturação inicial do cérebro `.agent` (memory, context, guidelines, overview).
- Formulação e aprovação do Protocolo de 12 Perguntas de Engenharia e Arquitetura.
