-- ==============================================================================
-- SCHEMA DO SORTEADOR OLIMPO INSTAGRAM
-- Versão: 20261019_init_olimpo_schema.sql
-- Descrição: Tabelas com isolamento RLS, índices otimizados para proteção
--            de egress e suporte à auditoria imutável dos sorteios.
-- ==============================================================================

-- 1. Tabela de Workspaces (Áreas de trabalho isoladas)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    max_monthly_draws INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Conexões do Instagram via Meta Graph API Oficial
CREATE TABLE IF NOT EXISTS public.instagram_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    ig_user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    profile_picture_url TEXT,
    access_token_enc TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_ig_user UNIQUE (workspace_id, ig_user_id)
);

-- 3. Campanhas de Sorteio
CREATE TABLE IF NOT EXISTS public.giveaways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    instagram_account_id UUID REFERENCES public.instagram_accounts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    prize_name TEXT NOT NULL,
    media_id TEXT NOT NULL,
    media_url TEXT,
    media_permalink TEXT,
    media_caption TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'importing', 'ready', 'drawn', 'archived')),
    winners_count INTEGER NOT NULL DEFAULT 1,
    alternates_count INTEGER NOT NULL DEFAULT 1,
    total_comments_fetched INTEGER NOT NULL DEFAULT 0,
    eligible_entries_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    drawn_at TIMESTAMPTZ,
    retention_purge_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + interval '30 days')
);

-- 4. Regras Configuráveis do Sorteio
CREATE TABLE IF NOT EXISTS public.giveaway_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE UNIQUE,
    min_mentions INTEGER NOT NULL DEFAULT 1,
    require_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    block_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    allow_duplicate_users BOOLEAN NOT NULL DEFAULT false, -- false = 1 chance por pessoa
    entries_per_comment BOOLEAN NOT NULL DEFAULT false,   -- se cada comentário gera uma chance extra
    include_replies BOOLEAN NOT NULL DEFAULT false,       -- se inclui respostas além do nível 1
    blocked_usernames TEXT[] DEFAULT ARRAY[]::TEXT[],
    exclude_previous_winners BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Jobs de Importação em Fatias (Chunked Batch Checkpoints)
CREATE TABLE IF NOT EXISTS public.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'paused', 'failed')),
    cursor_after TEXT,
    pages_processed INTEGER NOT NULL DEFAULT 0,
    comments_processed INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Entradas e Participantes Coletados
CREATE TABLE IF NOT EXISTS public.giveaway_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
    comment_id TEXT NOT NULL,
    ig_user_id TEXT NOT NULL,
    ig_username TEXT NOT NULL,
    comment_snippet TEXT,
    mentions_found TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_eligible BOOLEAN NOT NULL DEFAULT true,
    rejection_reason TEXT,
    entry_number INTEGER, -- Número sequencial de sorteio (1 a N) atribuído aos elegíveis
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_giveaway_comment UNIQUE (giveaway_id, comment_id)
);

-- 7. Vencedores e Suplentes Auditados
CREATE TABLE IF NOT EXISTS public.draw_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES public.giveaway_entries(id) ON DELETE CASCADE,
    position INTEGER NOT NULL, -- 1 = Vencedor Principal, 2 = 2º Vencedor, etc.
    is_alternate BOOLEAN NOT NULL DEFAULT false, -- true = Suplente
    status TEXT NOT NULL DEFAULT 'selected' CHECK (status IN ('selected', 'verified', 'disqualified', 'claimed')),
    disqualification_reason TEXT,
    snapshot_sha256 TEXT NOT NULL, -- Hash imutável do snapshot de todos os participantes no momento do sorteio
    drawn_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Trilha de Auditoria Geral
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ÍNDICES DE ALTA PERFORMANCE (Proteção de CPU e Egress)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_eligible 
    ON public.giveaway_entries(giveaway_id, is_eligible, entry_number);

CREATE INDEX IF NOT EXISTS idx_giveaway_entries_user 
    ON public.giveaway_entries(giveaway_id, ig_username);

CREATE INDEX IF NOT EXISTS idx_giveaways_workspace 
    ON public.giveaways(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_draw_results_giveaway 
    ON public.draw_results(giveaway_id, is_alternate);

-- ==============================================================================
-- HABILITAÇÃO DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de Isolamento por Dono do Workspace
CREATE POLICY "Usuário acessa seus próprios workspaces" 
    ON public.workspaces FOR ALL 
    USING (auth.uid() = owner_id);

CREATE POLICY "Usuário acessa contas do IG de seus workspaces" 
    ON public.instagram_accounts FOR ALL 
    USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()));

CREATE POLICY "Usuário acessa seus sorteios" 
    ON public.giveaways FOR ALL 
    USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()));

CREATE POLICY "Usuário acessa regras dos seus sorteios" 
    ON public.giveaway_rules FOR ALL 
    USING (giveaway_id IN (SELECT g.id FROM public.giveaways g JOIN public.workspaces w ON g.workspace_id = w.id WHERE w.owner_id = auth.uid()));

CREATE POLICY "Usuário acessa entradas dos seus sorteios" 
    ON public.giveaway_entries FOR ALL 
    USING (giveaway_id IN (SELECT g.id FROM public.giveaways g JOIN public.workspaces w ON g.workspace_id = w.id WHERE w.owner_id = auth.uid()));

-- Leitura pública para conferência de resultados
CREATE POLICY "Qualquer pessoa pode consultar resultados públicos de sorteios concluídos" 
    ON public.draw_results FOR SELECT 
    USING (giveaway_id IN (SELECT id FROM public.giveaways WHERE status = 'drawn'));
