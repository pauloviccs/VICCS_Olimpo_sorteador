# Plano de Implementação dos Fixes (Protocolo de 12 Perguntas UEoE)

> **Documento Oficial de Handoff & Especificação Técnica**  
> **Projeto**: Olimpo Sorteador Instagram  
> **Meta App ID**: `28628987183389511`  
> **Engenheiro**: UEoE 1 ($500k/yr equivalent)  
> **Data**: 26 de Outubro de 2026  

---

## 🧭 Visão Geral Executiva

Este plano detalha a implementação contínua e as melhorias arquiteturais levantadas no **12-Question Improvement Protocol**. Ele consolida as correções já entregues (Tela de Login Meta, simulação dinâmica de cupons, build de produção Next.js 16) e estabelece o cronograma das fases subsequentes para garantir escalabilidade, segurança e integridade auditável.

---

## 🧱 Matriz dos 12 Fixes & Ações de Implementação

| # | Pilar / Pergunta | Diagnóstico & Fix Aprovado | Ação de Implementação | Arquivos Impactados |
|---|------------------|---------------------------|-----------------------|---------------------|
| **1** | **The "North Star" Utility** | Separação estrita de fluxos: Portal de Entrada vs. Cockpit de Apuração. | Renderização condicional estrita por estado de sessão (`!connectedUser` ➔ Tela Login; `connectedUser` ➔ Cockpit). | `src/app/page.tsx` |
| **2** | **The User's Mental Model** | Foco exclusivo em *Gerenciar* e *Apurar*. Eliminar dados inertes. | Reorganizar cards em 2 colunas lógicas: Mídia Selecionada à esquerda; Regras, Prévia e Ação à direita. | `src/app/page.tsx` |
| **3** | **The "3-Second Rule"** | Operador e público devem saber instantaneamente que o sorteio é 100% oficial e legal. | Badges explícitas: `Meta Graph API v21.0 Oficial` e `App ID: 28628987183389511` no topo. | `src/app/page.tsx`, `globals.css` |
| **4** | **Data Source of Truth** | Fallback resiliente contra oscilações de rede da Meta ou Supabase. | Mock interativo no cliente caso o OAuth não seja invocado e tratamento de retry no backend. | `src/app/page.tsx`, `src/lib/meta/api.ts` |
| **5** | **Happy Path vs. Edge** | Evitar cliques acidentais quando zero participantes atenderem às regras. | Desabilitar o botão dourado de sorteio se a lista de participantes elegíveis for zero, exibindo tooltip. | `src/app/page.tsx` |
| **6** | **Visual Hierarchy** | Somente as ações prioritárias recebem o gradiente dourado (`#f8d292` ➔ `#c49146`). | Botão `btn-gold` reservado estritamente para `Conectar Conta` e `Realizar Sorteio Oficial`. | `src/app/globals.css`, `src/app/page.tsx` |
| **7** | **Interaction Cost** | Reduzir atrito de digitação antes de transmissões ao vivo. | Regras padrão da Olimpo já vêm ativadas (2 amigos `@`, `#OlimpoAcai`, 1 chance por pessoa). | `src/app/page.tsx` |
| **8** | **The Vibe & Aesthetic** | Estética Liquid Glass Olimpo (Roxo Açaí Profundo + Dourado). | Cards com `backdrop-blur-xl`, reflexos dourados nos cantos e confetti oficial personalizado. | `src/app/globals.css` |
| **9** | **Integration Friction** | Zero exposição de chaves e dados sensíveis no cliente. | Troca OAuth e criptografia AES-256 restritas às Route Handlers do Next.js no servidor. | `src/app/api/auth/meta/*`, `src/lib/security.ts` |
| **10** | **Future Proofing** | Suportar campanhas com > 100.000 comentários sem estourar Vercel ou Meta. | Chunked batch import de 50 comentários com checkpoints salvos na tabela `import_jobs`. | `src/app/api/instagram/import-chunk/route.ts` |
| **11** | **The Grandma Test** | Contraste de acessibilidade superior a 7:1 e botões com área de toque >= 44px. | Tipografia `#f7ead8` sobre `#200a21`, tamanhos de texto ampliados e suporte mobile. | `src/app/page.tsx` |
| **12** | **Kill Your Darlings** | Zero desperdício de banco no plano Supabase Free (500 MB / 5 GB egress). | Não salvar fotos ou mídias no Supabase; armazenar apenas textos curtos e hash SHA-256 imutável. | `supabase/migrations/20261019_init_olimpo_schema.sql` |

---

## 🚀 Fases de Implementação & Roadmap

### Fase 1: Fundação & Autenticação (Concluída ✅)
- [x] Criação da Tela de Login dedicada Liquid Glass com Meta App ID `28628987183389511`.
- [x] Geração de URL OAuth oficial com cookie CSRF (`/api/auth/meta/url`).
- [x] Troca de token por Long-Lived Token (60 dias) com criptografia AES-256-GCM.
- [x] Modo demonstração/homologação imediato para testes sem bloqueio de permissões.

### Fase 2: Apuração e Feedback em Tempo Real (Concluída ✅)
- [x] Prévia de cupons com recálculo reativo conforme sliders de menção e hashtag.
- [x] Medidor em tempo real de consumo do Supabase Free (0.8% de egress).
- [x] Modal cerimonial com contagem regressiva de 3s e confetes Olimpo.
- [x] Prova de auditoria pública com hash criptográfico SHA-256.

### Fase 3: Próximos Passos (Próximas Iterações 🎯)
- [ ] **Página Pública de Consulta (`/s/[id]`)**: Rota onde qualquer seguidor pode colar o hash SHA-256 e conferir a lista de cupons e o ganhador.
- [ ] **Modo Live Stream (Tela Cheia)**: Alternância para visualização sem barras ou botões, perfeita para espelhamento em lives do Instagram.
- [ ] **Purga Automática de 30 Dias**: Job cron no Supabase para limpar comentários brutos e manter o banco leve permanentemente.

---

## 🔒 Diretrizes de Segurança para Deploy
1. **Proteção de Segredos**: Nunca comitar arquivos `.env.local` ou credenciais do Supabase/Meta.
2. **Ambiente Vercel**: Adicionar as variáveis no painel da Vercel (`META_APP_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_SECRET`).
3. **URL de Redirecionamento da Meta**: Certificar que tanto o domínio de produção (`https://seu-app.vercel.app/api/auth/meta/callback`) quanto o local (`http://localhost:3000/api/auth/meta/callback`) estejam autorizados no console de desenvolvedores da Meta.
