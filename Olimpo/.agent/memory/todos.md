# TODOs do Projeto: Sorteador Olimpo Instagram

## Fase 0: Descoberta e Viabilidade (Concluída)
- [x] Inspecionar diretório e pasta de assets visuais (`.agent/assets/visual-identity/`)
- [x] Extrair paleta de cores oficial, tipografia e diretrizes do Manual de Marca (Olimpo Açaiteria & Sorveteria)
- [x] Analisar limites, escopos e fluxo oficial da Meta Graph API (Instagram Business/Creator)
- [x] Mapear cotas de Egress, DB e Storage do Supabase Free e limites de Serverless da Vercel
- [x] Identificar estado atual das instâncias no Supabase MCP
- [x] Validar protocolo de 12 perguntas arquiteturais e UX com o usuário (Aprovado)

## Fase 1: Fundação e Setup Inicial (Concluída)
- [x] Inicializar projeto Next.js (App Router) + TypeScript + Tailwind CSS
- [x] Configurar tokens visuais Olimpo (Cores: `#39173d`, `#662771`, Dourado `#f8d292`-`#c49146`, Creme `#f7ead8`)
- [x] Copiar e disponibilizar assets da Olimpo (SVGs da montanha, açaí, logos) no `/public/brand/`
- [x] Criar migração SQL inicial do Supabase com RLS e índices de egress (`supabase/migrations/20261019_init_olimpo_schema.sql`)
- [x] Criar clientes de integração do Supabase (`client.ts` e `server.ts`)
- [x] Elaborar Guia Didático (ELI5) de Obtenção das APIs da Meta e Supabase para o usuário
- [x] Criar interface interativa Liquid Glass completa com fluxo simulado e auditável
- [x] Conectar credenciais reais do Supabase e Meta no `.env.local`
- [x] Sanitizar `.env.example` para evitar vazamento acidental em repositórios públicos
- [x] Executar e aplicar a migração no Supabase real (`okwylcdhmcnwoykxshfh`) via Supabase MCP (8 tabelas com RLS)

## Fase 2: Conexão e Importação Resiliente (Concluída no Backend & Frontend)
- [x] Implementar fluxo de OAuth Meta (Instagram Login for Business) com CSRF state token (`/api/auth/meta/url` e `/api/auth/meta/callback`)
- [x] Implementar endpoint de seleção de mídia/publicação (`/api/instagram/media`)
- [x] Criar motor de importação paginada em fatias (Chunked Batch) para respeitar limites da Vercel (10-15s) e Meta (`/api/instagram/import-chunk`)
- [x] Implementar algoritmo de sorteio auditável com CSPRNG, Fisher-Yates e hash SHA-256 (`/api/draw/execute`)
- [x] Conectar botão de conexão da Meta no cabeçalho da interface
- [x] Validação de compilação sem erros (`npm run build` bem-sucedido)

## Fase 3: Regras, Validação e Sorteio Auditável
- [x] Criação da lógica de apuração com regras ativas (menções `@`, hashtag obrigatória, 1 cupom por perfil)
- [ ] Criação de página pública dedicada para conferência externa de resultados (`/s/[id]`)

## Fase 4: Dashboard, Métricas e Estética Liquid Glass
- [ ] Implementar gráficos Recharts avançados com histórico de campanhas
- [ ] Adicionar modo de visualização em tela cheia para transmissão ao vivo do sorteio (Live Stream Mode)

## Fase 5: Operação, Proteção de Egress e Deploy
- [ ] Rotina de retenção automática (30 dias para expiração de comentários crus)
- [ ] Checklist final de deploy na Vercel
