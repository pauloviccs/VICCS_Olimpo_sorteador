# Olimpo — Plano de implementação do sorteador para Instagram

> Documento de contexto para o agente que vai implementar o produto no Antigravity com Gemini 3.8 High. Este arquivo é a referência inicial de produto, arquitetura, segurança, design e operação. O agente pode reorganizar o trabalho em fases, propor uma sequência melhor e registrar decisões técnicas atualizadas neste documento.

## 1. Objetivo do produto

Construir para a Olimpo um website moderno, responsivo e confiável para criar, configurar, auditar e divulgar sorteios baseados em comentários do Instagram. O produto deve oferecer uma experiência simples para quem organiza o sorteio e resultados claros para participantes, com painel de métricas e gráficos compreensíveis.

A implementação deve usar Vercel para o website e execução das rotas/backend apropriadas e Supabase para os serviços de dados. **O Supabase deve permanecer no plano Free**: não planejar funcionalidades que dependam de ultrapassar a franquia, e desenhar controles para limitar consumo antes de qualquer teto. Não fazer scraping, automação de navegador ou coleta por senha do Instagram; usar integrações permitidas pela Meta e sinalizar limitações de autorização.

## 2. Diretrizes para o agente

- Use suas capacidades e boas práticas de front-end, back-end, UX, acessibilidade, segurança, banco de dados, observabilidade e deploy.
- Comece inspecionando o repositório, instruções locais e a pasta de assets da Olimpo. **A identidade visual real do cliente é requisito prioritário**: reutilize logos, tipografia, cores, ícones, fotografias e demais assets fornecidos; não invente uma marca substituta. Se os assets não estiverem no repositório, registre isso e crie tokens visuais provisórios fáceis de substituir.
- O contexto atual não identificou assets da Olimpo junto a este documento. Confirme o caminho correto dos arquivos no início da implementação e não assuma que assets de outro projeto pertencem à Olimpo.
- Use superfícies de “liquid glass” com moderação: transparência, desfoque, reflexos e profundidade devem reforçar hierarquia e legibilidade, sem comprometer contraste, desempenho ou acessibilidade. Modais elegantes devem ter animações curtas, consistentes e com suporte a `prefers-reduced-motion`.
- Entregue uma aplicação funcional, com fluxos reais e estados completos; não deixe telas centrais apenas como protótipos visuais.
- Comente trechos de lógica não óbvios no frontend e backend, explicando intenção e invariantes; prefira código autoexplicativo a comentários redundantes.
- Depure continuamente, trate erros e estados vazios/carregamento, revise o código para remover duplicações e confirme a qualidade dos fluxos antes de considerar cada fase concluída.
- Separe o desenvolvimento em fases se isso melhorar a execução. Registre decisões, limitações de API e critérios de aceite.
- Use o MCP do Supabase para inspeção, configuração e alterações no projeto Supabase sempre que essa integração estiver disponível e a alteração for necessária. Gere migrações versionadas no repositório para mudanças de schema; não faça mudanças de produção sem avaliar o ambiente/destino.
- Nunca exponha tokens, chaves administrativas, secrets de Meta ou `service_role` no navegador, commits, logs ou documentação pública.

## 3. Referência de mercado: produtos e funcionalidades observados

Pesquisa realizada em **19/10/2026**. A lista representa produtos encontrados e recursos anunciados por seus próprios sites/documentação; popularidade e uso não foram auditados por métricas independentes. Use como referência de cobertura, sem copiar marca, interface ou código.

| Produto | Capacidades públicas observadas | O que considerar para a Olimpo |
|---|---|---|
| **Easypromos Instagram Giveaway** | Importação de comentários de posts e Reels; combinação de até 25 posts; filtros e regras; critérios de menções/hashtags; entradas extras; múltiplos ganhadores e suplentes; teste antes do sorteio final; verificação dos vencedores; exportação de participantes/comentários; certificado de validade e página pública de resultados; gestão de prêmios e fluxo de resgate; listas de bloqueio e exclusão de ganhadores anteriores; suporte a posts colaborativos e campanhas avançadas. | Referência forte para campanha ponta a ponta, transparência, suplentes, exportação e publicação de resultados. Recursos de multi-post, premiação e certificado podem ser faseados. |
| **Gleam Instagram Comment Picker / Quick Draws** | Conexão de conta Instagram Business/Creator; seleção de post; importação de comentários; filtros por hashtag, palavra-chave e menções; regra de quantidade de comentários/entradas por participante; múltiplos ganhadores; animação de revelação; página de resultado dedicada e exportação. | Referência para fluxo curto: selecionar publicação → configurar critérios → revisar entradas → sortear → revelar/exportar. |
| **AppSorteos** | Sorteio de comentários; regras personalizadas; remoção de comentários/usuários duplicados; filtro por mínimo de menções e hashtags; exportação da lista de participantes; planos com limites e usos gratuitos. | Referência para simplicidade, deduplicação e controle explícito de regras. |
| **InstaPicker** | Importação/consulta de comentários por ferramenta de picker; filtro para remover participantes repetidos; critério de marcação de amigos; seleção aleatória. | Referência para ferramentas de entrada rápida e regras de marcações. Deve-se validar elegibilidade e fonte dos dados via integração permitida antes de implementar abordagem equivalente. |

### Funcionalidades esperadas no produto

**Essenciais para o MVP**

1. Autenticação do organizador e área de trabalho privada.
2. Conexão Instagram via OAuth oficial, quando elegível, com explicação clara de conta profissional, permissões e acesso necessários.
3. Criação de campanha: nome, prêmio, regulamento, datas, publicação elegível, quantidade de ganhadores e suplentes.
4. Importação paginada dos comentários acessíveis pela API oficial, com progresso, retomada/idempotência e indicação de limitações/falhas.
5. Regras configuráveis: palavras-chave, hashtags, quantidade mínima de `@menções`, permitir ou remover comentários repetidos, uma entrada por pessoa ou entradas por comentário, bloquear perfis, excluir ganhadores anteriores, período de participação e exclusões manuais auditadas.
6. Prévia da lista final, contagem de comentários e participantes, resumo das regras e etapa explícita de confirmação antes do sorteio.
7. Sorteio aleatório executado no servidor, com seleção sem reposição por padrão, registro imutável do snapshot de elegíveis/regras/horário/versão do algoritmo e tratamento de re-sorteio com justificativa.
8. Ganhadores e suplentes, status de validação/contato/resgate, substituição por suplente e trilha de auditoria.
9. Página pública compartilhável de resultados, com identificação da campanha e método, data/hora, critérios resumidos e resultado; exportação controlada CSV.
10. Dashboard claro com métricas e gráficos animados: comentários coletados, participantes únicos, taxa de elegibilidade, motivos de exclusão, evolução de comentários ao longo do período, distribuição de entradas e estado dos ganhadores. Não alegar métricas que a API não fornece.
11. Estados de erro, vazio, carregamento, importação em andamento, limite de uso e conexão expirada; acessibilidade por teclado/leitor de tela e versão mobile.

**Evoluções possíveis, condicionadas à API e aos limites**

- Combinar publicações próprias e campanhas multi-post, desde que cada publicação seja acessível ao token conectado e respeite os limites de volume.
- Certificado ou comprovante verificável com hash do snapshot, regras e resultado, sem expor dados pessoais desnecessários.
- Link/formulário de resgate do prêmio com prazo configurável e opção de consentimento para dados de entrega.
- Modo de apresentação em tela cheia, animação de sorteio e compartilhamento de arte de resultado.
- Lista de bloqueio por workspace, exclusão de ganhadores anteriores e campos administrativos para entradas extras com motivo e autor.
- Notificações e lembretes por email apenas após definir provedor, consentimento e custo; não presumir Supabase como provedor de email transacional.
- Conector para Stories ou respostas privadas somente se a Meta disponibilizar a API e as permissões aprovadas para o caso. Não prometer extração de Stories arbitrárias.

## 4. Limites de integração Instagram/Meta

- Priorize a Instagram Platform/API oficial e autenticação OAuth. A documentação consultada descreve acesso profissional (Business/Creator), permissões específicas e diferenças entre as configurações Instagram Login e Facebook Login.
- O acesso a comentários e mídias depende da conta, token, permissões concedidas, modo do app, acesso avançado/revisão da Meta quando aplicável, escopos e elegibilidade da publicação. Validar o fluxo atual da Meta no começo da implementação, pois APIs e permissões mudam.
- A API não equivale a um coletor universal de comentários de qualquer perfil/post público. Se a campanha não puder ser importada oficialmente, oferecer instruções de conexão ou importação de arquivo autorizado, explicando limitações; não recorrer a scraping.
- Solicite apenas escopos indispensáveis. Para o escopo de comentários, verificar a permissão atual equivalente a `instagram_business_manage_comments` (Instagram Login) ou a permissão correspondente do fluxo selecionado.
- Proteger access tokens: armazenar somente no backend, criptografados/geridos por secret store sempre que possível; remover de logs; implementar renovação, revogação e desconexão; não devolver token ao cliente.
- Revisar as políticas de plataforma, retenção e remoção de dados. Persistir o mínimo necessário para reproduzir/auditar sorteios; aplicar retenção curta para texto integral de comentário e dados pessoais, com exclusão automatizada documentada.

## 5. Arquitetura e stack proposta

Confirmar compatibilidade com o projeto existente antes de substituir dependências. Base recomendada:

### Frontend

- **Next.js (App Router) + React + TypeScript**, hospedado na Vercel.
- **Tailwind CSS** e componentes acessíveis (por exemplo, Radix UI/shadcn/ui) com design tokens específicos da Olimpo.
- **Motion / Framer Motion** para animações de interface, modais, feedback e revelação do resultado; respeitar movimento reduzido.
- **Recharts** ou biblioteca equivalente para gráficos responsivos e legíveis; evitar gráficos 3D ou efeitos que reduzam compreensão.
- Validação de formulários com Zod e React Hook Form, se compatíveis com a base atual.
- Componentes de visualização com tabelas e resumos textuais equivalentes para acessibilidade.

### Backend e dados

- **Supabase Auth** para contas do organizador; políticas RLS obrigatórias para separar workspaces/campanhas.
- **Supabase Postgres** para campanhas, regras, snapshots resumidos, resultados, métricas e auditoria.
- **Vercel Functions/Route Handlers** para OAuth callback, chamadas à Meta, importações paginadas, validação das regras e sorteio. Usar processos curtos e retomáveis; não manter requisições longas nem usar memória local como fila.
- **Supabase Edge Functions** somente quando fizer sentido operacional e couber em seus limites; o backend não deve copiar grandes volumes de dados sem necessidade.
- **Supabase Storage** só para arquivos realmente necessários, privados por padrão, com expiração e limites de tamanho. Assets estáticos da marca devem preferencialmente ser servidos junto ao site pela Vercel, reduzindo egress do Supabase.
- **Supabase MCP** para operações administrativas de banco/projeto quando disponível; migrações SQL versionadas como fonte de verdade.
- Segredos em variáveis de ambiente da Vercel e secrets do Supabase; `.env.example` sem valores reais.

### Modelo de dados inicial (ajustar com base nos fluxos)

- `profiles` / `workspaces`: proprietário, preferências e plano/limites internos.
- `instagram_connections`: identificador externo, escopos, validade e referência segura ao token; sem token em respostas de API.
- `giveaways`: workspace, nome, prêmio, status, datas, publicação(s), contadores e política de retenção.
- `giveaway_rules`: configuração validada e versão das regras.
- `import_jobs`: estado, cursor/página, tentativas, timestamps, contagens e erros sanitizados; reprocessamento idempotente.
- `entries` (se persistidas): identificadores mínimos, comentário/post de origem, validade e motivo de exclusão; índices e retenção planejados.
- `draws` / `draw_winners`: snapshot/hash, conjunto de elegíveis ou compromisso auditável, algoritmo/versão, seed segura, horário, resultado e suplentes.
- `audit_events`: ator, ação, entidade, timestamp e metadados não sensíveis.

Definir chaves estrangeiras, índices por workspace/campanha/status, constraints de integridade, paginação, RLS e acesso de menor privilégio. Avaliar cuidadosamente se texto de comentário e username precisam ser guardados após a auditoria.

## 6. Plano de proteção do Supabase Free e egress

### Referência de cotas consultada

A documentação oficial consultada informa para o Free, entre outros limites: **5 GB de egress não cacheado + 5 GB de cached egress** (sujeito à definição e elegibilidade de cache), 500 MB de banco por projeto, 1 GB de Storage, 50 mil MAU e 500 mil invocações de Edge Functions. A franquia é da organização e pode ser compartilhada entre projetos; o projeto Free pode pausar após uma semana de inatividade. Confirme os valores atuais no Dashboard antes do lançamento, pois preços e cotas podem mudar.

### Regra operacional

- Objetivo é ficar abaixo do Free; **não tratar quota como orçamento para consumir até o fim**.
- Definir limite interno conservador inicial: alerta amarelo em 50% da cota mensal aplicável e bloqueio/redução de operações não essenciais em 70%, deixando margem para variação e serviços compartilhados. Confirmar o comportamento real de alertas/restrições no painel Supabase.
- O sistema deve monitorar utilização do Supabase no Dashboard e mostrar aviso administrativo; se não houver API oficial/estável para leitura automatizada da quota, não simular precisão: disponibilizar checklist manual e telemetria de volume do próprio app.
- Limitar importação por campanha, tamanho de página, número de campanhas ativas, exportações, reprocessamentos e concorrência. Aplicar rate limiting e cooldown por workspace/conta.
- Fazer importação sob demanda, em páginas/cursors, com checkpoints para retomar e não guardar payloads completos repetidamente. Selecionar somente colunas necessárias; não enviar registros inteiros de volta ao frontend.
- Manter métricas agregadas pré-calculadas e paginar listas. Cachear leituras públicas de páginas de resultado quando seguro; nunca cachear dados privados ou respostas com tokens. Não usar polling frequente nem Realtime se atualizações sob demanda forem suficientes.
- Não armazenar imagens/avatares/comentários em Storage sem caso de uso indispensável. Servir assets Olimpo pela Vercel.
- Exportações devem ser limitadas, iniciadas pelo usuário e geradas de forma enxuta, sem expor segredos. Preferir descarte dos dados brutos após janela de retenção.
- Criar proteção contra consultas sem limite, `select *`, respostas volumosas, retries infinitos, loops de importação e abuso automatizado.
- Usar compressão e payloads pequenos. Lembrar que egress do Supabase inclui dados enviados por Database, Auth, Storage, Edge Functions e Realtime; mover processamento para Vercel não elimina bytes servidos pelo Supabase se o backend continuar consultando grandes volumes.
- Adicionar métricas locais por operação (bytes aproximados, linhas, chamadas, duração e erro) e um procedimento de pausa de importações/exportações quando um limite interno for atingido.
- Validar comportamento quando o Free restringe serviço por quota: mensagem clara, preservação do estado do sorteio e caminho de retomada após o próximo ciclo, sem loops de retry.

## 7. Experiência visual e design

- Inspecionar e inventariar os assets existentes antes de desenhar. Registrar cores/tipografia/logo usados e criar tokens CSS reaproveitáveis.
- Criar uma direção visual contemporânea alinhada à Olimpo: confiança, celebração e transparência. Não associar “Olimpo” automaticamente a dourado/mitologia sem evidência nos assets ou aprovação de identidade do próprio projeto.
- Fundo e cartões podem usar camada translúcida/liquid glass, mas formularios e tabelas precisam de contraste forte e leitura imediata.
- Modais para configurar regras, confirmar sorteio e revelar ganhador devem ter hierarquia e animação funcional; confirmação do sorteio deve ser acessível sem animação e não permitir disparo acidental.
- Dashboard deve priorizar leitura didática: título e período do gráfico, unidade, tooltip, legenda, resumo em texto e indicação de ausência de dados. Evitar gráficos 3D, excesso de cores, animação contínua e números sem definição.
- Desenvolver desktop e mobile; estados de foco, hover, disabled, erro, sucesso, loading, vazio e sessão expirada.
- Aplicar acessibilidade WCAG como alvo de projeto: contraste, foco visível, navegação por teclado, textos alternativos e suporte a redução de movimento.

## 8. Fases de implementação sugeridas

O agente pode alterar a ordem, dividir ou combinar etapas se justificar a escolha.

### Fase 0 — Descoberta e viabilidade

- Inspecionar código, estrutura, instruções do projeto, assets Olimpo e status dos projetos Vercel/Supabase.
- Confirmar fluxo de API da Meta, permissões e limitações do caso de uso; listar requisitos de App Review e credenciais necessárias sem registrar secrets no documento.
- Validar cota Free real, política de retenção e estimativas de tráfego.
- Produzir mapa de rotas, fluxo de usuário e ADRs das decisões que mudem a arquitetura.

**Aceite:** inventário de assets, integração viável documentada, riscos de API explicitados, estrutura e orçamento de uso conhecidos.

### Fase 1 — Fundação

- Configurar Next.js/TypeScript e pipeline de deploy Vercel mantendo convenções do repositório.
- Configurar Supabase, migrações, Auth, RLS e separação de workspace.
- Criar design tokens com assets reais da Olimpo e shell responsivo.
- Configurar observabilidade mínima, tratamento de erros, secrets e política de privacidade/retention.

**Aceite:** preview deploy, login seguro, acesso isolado por workspace, migrações reproduzíveis e base visual aplicada.

### Fase 2 — Conexão e importação

- OAuth oficial da Meta, ciclo de token, desconexão e callbacks seguros.
- Seleção de post elegível, importação paginada e retomável, deduplicação e indicadores de progresso.
- Controles de volume, idempotência, rate limit e limpeza de dados.

**Aceite:** importação real autorizada funciona sem duplicar entradas em retry; erros de permissão/limite são entendíveis e não vazam secrets.

### Fase 3 — Regras e sorteio auditável

- Editor de regras e validação, prévia de elegibilidade, ajustes auditados.
- Sorteio server-side, suplentes, re-sorteio justificado, snapshot verificável e página de resultado.
- Exportação com controles e remoção/expiração de dados.

**Aceite:** execução determinística no sentido de auditabilidade (reproduzir entradas, regras e prova do resultado, sem permitir manipular o vencedor); regras de inclusão/exclusão verificáveis; resultados persistem com trilha de auditoria.

### Fase 4 — Dashboard e refinamento visual

- Métricas didáticas, gráficos claros e filtros por campanha/período.
- Modais liquid glass, animações de transição e revelação, modo reduzido de movimento.
- Responsividade, acessibilidade, performance e estados de falha.

**Aceite:** usuário compreende os principais números e motivos de inelegibilidade; fluxos principais funcionam em tamanhos de tela usuais e com teclado.

### Fase 5 — Publicação e operação

- Revisar variáveis por ambiente, domínio, segurança, consentimento, retenção e instruções de suporte.
- Revisar limites e dashboards de uso do Supabase/Vercel antes e após liberar tráfego.
- Criar plano de contingência para token expirado, quota atingida, pausa do projeto, indisponibilidade da Meta e restauração.

**Aceite:** implantação de produção reproduzível, alertas e procedimento de pausa definidos, documentação operacional entregue.

## 9. Qualidade, segurança e depuração

- Validar autorização em toda leitura/escrita e testar isolamento entre workspaces; nunca confiar em `workspace_id` enviado pelo cliente sem conferir sessão e política.
- Validar entrada no servidor, escapar conteúdo de comentários/nomes ao renderizar e aplicar proteção contra XSS, CSRF conforme o fluxo, SQL injection via queries parametrizadas, abuso e exposição de PII.
- Usar logs estruturados sem tokens, texto integral de comentários ou dados pessoais desnecessários.
- Definir rastreamento de importação e sorteio por IDs internos; erros com códigos úteis para suporte.
- Executar revisão de TypeScript/lint/build e testes unitários/de integração/e2e apropriados em cada marco; testes devem cobrir regras de elegibilidade, duplicatas, paginação, idempotência, sorteio, RLS e quotas internas.
- Não afirmar “aleatório certificado” ou “100% imparcial” sem processo e certificação verificáveis. Documentar método de seleção e como o snapshot impede mudanças posteriores.
- Fazer revisão final de dependências, bundle, queries, animações, mobile, acessibilidade e consumo de egress.

## 10. Fontes consultadas

- [Easypromos — Instagram Giveaway e funcionalidades](https://www.easypromosapp.com/instagram-giveaway/)
- [Easypromos — tutorial de campanha multi-rede](https://soporte.easypromosapp.com/hc/en-us/articles/360013764092-Tutorial-How-to-run-a-Multi-Network-Giveaway)
- [Gleam — Instagram Comment Picker](https://gleam.io/tools/instagram-comment-picker)
- [Gleam — Quick Draws / Instagram Picker](https://gleam.io/docs/competitions/quick-draws/instagram-comment-picker)
- [AppSorteos — FAQ e filtros](https://app-sorteos.com/en/faqs)
- [AppSorteos — página de funcionalidades](https://app-sorteos.com/en?logout=1)
- [Meta — Instagram API with Instagram Login (Postman da Meta)](https://www.postman.com/meta/instagram/folder/1z5vxzu/instagram-api-with-instagram-login)
- [Meta Developers — Instagram Platform](https://developers.meta.com/resources/)
- [Supabase — quotas e billing](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Supabase — como medir e controlar egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress)
- [Supabase — limites de Edge Functions](https://supabase.com/docs/guides/functions/limits)
- [Vercel — planos de conta](https://vercel.com/docs/plans)
- [Vercel — limites de Functions](https://vercel.com/docs/functions/limitations)

---

**Última pesquisa das referências:** 19/10/2026. Conferir novamente os links e limites oficiais antes da implementação e do lançamento.
