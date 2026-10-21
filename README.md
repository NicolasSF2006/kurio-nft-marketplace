# Kurio — NFT Marketplace

Marketplace de NFTs desenvolvido em **React e TypeScript** como solução para o [desafio Frontend da Jungle Gaming](https://github.com/junglegaming/frontend-challenge), com interface responsiva baseada no [Figma do desafio](https://www.figma.com/design/LMZL4sxsnNYDlLjA7uJ7gV/Frontend-Challenge--Copy-?node-id=0-1).

O Kurio simula uma experiência de compra de NFTs de ponta a ponta: exploração do catálogo, autenticação, favoritos, carrinho, carteiras e checkout com acompanhamento de pedidos em tempo real.

> **Demo online:** link a adicionar após a publicação na Vercel.
>
> **Nota:** este projeto usa APIs e carteiras simuladas. Não há transações reais, blockchain ou processamento de pagamentos.

## Funcionalidades

- **Catálogo:** pesquisa, filtros combinados, ordenação e paginação sincronizados com a URL.
- **NFTs:** página de detalhes, edições, disponibilidade e limites de estoque.
- **Contas:** cadastro, login, sessão, perfil, avatar, alteração de senha e proteção de rotas.
- **Favoritos e carrinho:** persistência, isolamento por usuário, mesclagem do carrinho visitante e cupons.
- **Checkout:** cotação precisa em ETH, validação de dados, seleção e conexão simulada de carteira.
- **Pedidos:** estados pendente, confirmado e recusado; proteção contra compras duplicadas por chave de idempotência.
- **Tempo real:** eventos `nft.updated` e `order.updated`, com controle de versões e recuperação após reconexão.
- **Resiliência:** cenários reproduzíveis de lentidão, erros HTTP, sessão expirada, mudança de preço e falta de estoque.
- **Responsividade e acessibilidade:** layouts desktop, tablet e mobile, navegação por teclado e feedback acessível.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Interface | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Rotas e dados | TanStack Router, TanStack Query, Axios |
| APIs simuladas | MSW (Mock Service Worker), REST |
| Tempo real | Socket.IO Client, `@mswjs/socket.io-binding` |
| Valores monetários | decimal.js |
| Qualidade | Playwright, axe-core, Lighthouse, Oxlint |

## Executar localmente

**Pré-requisitos:** Node.js 24.11+ (linha 24 LTS) e npm 11.

```bash
git clone https://github.com/NicolasSF2006/kurio-nft-marketplace.git
cd kurio-nft-marketplace
npm ci
npm run dev
```

Acesse **http://127.0.0.1:5173/**. A configuração de desenvolvimento já habilita os mocks, sem necessidade de backend externo.

Para executar a versão de demonstração, equivalente à configuração de publicação:

```bash
npm run build:demo
npm run preview
```

Acesse **http://127.0.0.1:4173/**.

## Credenciais de demonstração

| Conta | E-mail | Senha |
| --- | --- | --- |
| Nova Sato | `nova@kurio.test` | `Kurio123!` |
| Luna Costa | `luna@kurio.test` | `Kurio123!` |

**Cupom de teste:** `KURIO10` (10% de desconto).

Os dados são persistidos localmente no navegador e podem ser restaurados em **`/system`**. Essa página também permite simular falhas, alterações de preço/estoque e eventos em tempo real.

### Fluxo recomendado para avaliação

1. Explore o catálogo e abra um NFT, por exemplo `/nfts/emerald-ape-042`.
2. Adicione uma edição ao carrinho e aplique `KURIO10`.
3. Faça login com uma conta de demonstração.
4. Cadastre uma carteira em `/wallets` (Ethereum; endereço de teste `0x1111111111111111111111111111111111111111`).
5. Prossiga para `/checkout`, conecte a carteira simulada e confirme a compra.
6. Acompanhe o estado do pedido em `/orders` e experimente outros cenários em `/system`.

## Testes e validação

```bash
npm run typecheck       # TypeScript
npm run lint            # Análise estática
npm run build:demo      # Build com mocks habilitados
npm run test:install    # Instala o Chromium do Playwright
npm run test:e2e        # Testes E2E
npm run test:e2e:demo   # Testes contra a build demo
npm run test:visual     # Regressão visual
npm run test:a11y       # Acessibilidade
npm run lighthouse      # Auditorias Lighthouse
```

**Verificação local (21/10/2026):** 112 testes Playwright aprovados, nenhuma falha e dois testes intencionalmente ignorados (capturas mobile fora do projeto mobile). Typecheck, lint e build também foram aprovados.

Os resultados de Lighthouse, inclusive métricas abaixo das metas do desafio, estão registrados em [docs/AUDIT.md](docs/AUDIT.md).

## Arquitetura e documentação

- [ARCHITECTURE.md](ARCHITECTURE.md) — organização, decisões técnicas e persistência.
- [Contratos REST](docs/REST_API.md) — recursos, autenticação, carrinho, cotação e pedidos.
- [Eventos Socket.IO](docs/SOCKET_EVENTS.md) — mensagens, versões e reconciliação.
- [Matriz de requisitos](docs/COMPLIANCE_MATRIX.md) — implementação e evidências.
- [Auditoria e testes](docs/AUDIT.md) — reprodução das verificações.
- [Validação visual](docs/VISUAL_VALIDATION.md) — comparação com o Figma.

## Limitações conhecidas

O backend é simulado com MSW e os dados ficam restritos ao navegador/origem; usuários em dispositivos diferentes não compartilham um banco de dados. A conexão de carteira é demonstrativa, sem interação com extensões ou redes blockchain. O projeto foi desenvolvido para avaliação técnica, não para transações financeiras reais.

---

Desenvolvido por **Nicolas Silva Frazão** para o desafio Frontend da Jungle Gaming.
