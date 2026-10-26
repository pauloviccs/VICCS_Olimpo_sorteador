# Diretrizes de Código: Sorteador Olimpo

## 1. Princípios Gerais
- **Explicação ELI5 nos Comentários**: Comente funções críticas ou não triviais explicando o PORQUÊ antes do COMO, usando analogias simples quando útil.
- **TypeScript Estrito**: Sem `any` solto. Tipos fortes para todas as respostas da Meta Graph API, entidades de banco de dados e payloads de regras.
- **Fail-Safe & Idempotência**: Todo endpoint de importação ou execução de sorteio deve ser idempotente (se for chamado 2x com os mesmos parâmetros, não duplica dados nem altera o resultado).
- **Segurança de Tokens**: NUNCA envie tokens de acesso da Meta ou chaves `service_role` para o navegador. Tokens ficam exclusivamente no backend ou guardados criptografados no banco.
- **Zero Polling Excessivo**: Não use `setInterval` agressivo nem conexões Realtime abertas desnecessariamente para não esgotar as cotas do Supabase. Use fetch orientado a eventos ou polling espaçado com backoff.
