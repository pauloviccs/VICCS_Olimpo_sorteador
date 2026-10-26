# Diretrizes de UI/UX: Identidade Olimpo & Liquid Glass

## 1. Identidade Visual Olimpo (Açaiteria & Sorveteria)
- **Paleta de Cores Oficial**:
  - `olimpo-purple-dark`: `#2d0f2e` e `#39173d` (fundo principal e superfícies profundas)
  - `olimpo-purple-card`: `rgba(57, 23, 61, 0.65)` (cartões liquid glass)
  - `olimpo-purple-vibrant`: `#662771` e `#7f3b8e` (destaques, badges ativos e gradientes)
  - `olimpo-gold-start`: `#f8d292` (gradiente dourado - botão primário e bordas luminosas)
  - `olimpo-gold-end`: `#c49146` (gradiente dourado - final)
  - `olimpo-cream`: `#f7ead8` (texto principal, alto contraste e aconchego visual)
- **Tipografia**:
  - Títulos/Destaques: `Agenor` ou tipografia geométrica equivalente, com tracking espaçado.
  - Interface/Corpo: `Inter` para legibilidade extrema em números, tabelas e regras.
- **Símbolos da Marca**:
  - Monte Olimpo (montanhas recortadas)
  - Fruto do Açaí (círculos orgânicos com folhinha dourada)

## 2. Padrão "Liquid Glass" com Responsabilidade
- Vidro fosco real: `backdrop-blur-md` com fundo translúcido em tom roxo profundo.
- Bordas sutis: `border border-white/10` ou `border-[rgba(248,210,146,0.2)]` para um brilho dourado etéreo.
- Acessibilidade: Nunca sacrifique contraste. Formulários, inputs e tabelas devem ter fundo contrastante e texto creme/branco visível sob qualquer iluminação.
- Movimento Reduzido: Todas as animações do Framer Motion devem verificar `useReducedMotion()` para respeitar usuários sensíveis a movimento.
