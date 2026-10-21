# Arquitetura — Kurio NFT Marketplace

## Visão geral

O Kurio é uma aplicação React e TypeScript com navegação SPA, catálogo de NFTs, autenticação, favoritos, carrinho, carteiras e checkout. O projeto implementa os contratos de uma aplicação com APIs e eventos em tempo real, mas executa esses serviços em uma camada **simulada no navegador**, sem backend remoto ou blockchain.

O código de interface não manipula diretamente o banco simulado: as operações passam pelo Axios e pelos handlers REST do MSW. A atualização em tempo real passa pelo `socket.io-client`, com o protocolo interceptado pelo `@mswjs/socket.io-binding`.

## Organização

| Diretório | Responsabilidade |
| --- | --- |
| `src/app` | Inicialização, providers, Router e estilos globais |
| `src/routes` | Rotas tipadas, parâmetros de busca e proteção de páginas |
| `src/components` | Componentes visuais, feedback e controles compartilhados |
| `src/features` | Catálogo, detalhe, carrinho, autenticação, conta, checkout e diagnóstico |
| `src/lib` | Cliente REST, estado de sessão, utilitários e validações |
| `src/mocks` | Handlers, fixtures, cenários determinísticos e persistência do backend simulado |
| `src/realtime` | Cliente Socket.IO e sincronização de dados |
| `src/types` | Contratos e tipos das integrações |
| `tests` | Testes E2E, acessibilidade, regressão visual e auxiliares |
| `scripts` | Auditorias, otimização de assets e ferramentas de teste |

## Inicialização e integração

O bootstrap inicializa o worker do MSW antes de montar a aplicação quando `VITE_ENABLE_MOCKS=true`. Isso permite que tanto as requisições REST quanto o transporte Socket.IO sejam interceptados na demonstração. Sem os mocks, a aplicação precisa de serviços externos compatíveis; nenhum backend real acompanha este repositório.

As requisições passam por uma instância centralizada do Axios. O TanStack Query administra estado assíncrono, invalidação, erros e cancelamento de requisições obsoletas. O TanStack Router mantém filtros, ordenação, paginação e navegação sincronizados com a URL.

## Sessão e dados privados

As contas de teste e as sessões são tratadas pelos endpoints simulados. O banco de demonstração fica no armazenamento local da origem e guarda credenciais apenas como hashes com sal. O cliente mantém um token opaco, consulta a sessão por API e protege rotas privadas.

A troca de conta, expiração ou saída cancela consultas e remove dados privados do cache. Favoritos, carrinhos, carteiras e pedidos são associados à conta correspondente. O carrinho visitante pode ser mesclado com o carrinho autenticado, respeitando quantidades e estoque.

**Limite:** a persistência local é uma simulação para avaliação, não um mecanismo de segurança de produção. Origens ou dispositivos diferentes não compartilham os mesmos dados.

## Carrinho, valores e pedidos

Carrinho e cotação usam endpoints REST simulados. Valores em ETH são transportados como **strings decimais**; o cálculo utiliza `decimal.js`, sem depender de floats nativos para valores monetários.

Antes da compra, a API revalida preços, estoque, descontos e taxas. Mudanças exigem revisão pelo usuário. O checkout valida os dados do colecionador e realiza uma conexão de carteira simulada, sem acessar extensões ou redes blockchain.

A tentativa de compra salva uma chave de **idempotência**: reenviar o mesmo conteúdo com a mesma chave recupera o pedido existente; conteúdo diferente retorna conflito. Um timeout não autoriza uma segunda compra. Pedidos podem ficar pendentes, ser confirmados ou recusados. Apenas a confirmação conclui a operação e desconta do carrinho as quantidades efetivamente compradas. O recibo utiliza um snapshot imutável do pedido.

## Atualizações em tempo real

O cliente usa Socket.IO 4.x, namespace `/`, transporte WebSocket, com eventos de domínio:

- `nft.updated`: alterações versionadas de preço e disponibilidade.
- `order.updated`: mudanças versionadas do estado de pedidos.

O cliente descarta eventos duplicados ou desatualizados, evita repovoar dados de sessões anteriores e reconcilia recursos por REST após reconexão. A montagem/desmontagem e a mudança de usuário encerram listeners e conexões pertinentes.

O MSW e o binding Socket.IO formam a infraestrutura de demonstração. Não se trata de um servidor compartilhado entre usuários ou abas. Detalhes de payloads, versões e cenários estão em [docs/SOCKET_EVENTS.md](docs/SOCKET_EVENTS.md).

## Interface e acessibilidade

O design é baseado nas telas do desafio, com assets locais, componentes shadcn/ui e Tailwind CSS. As adaptações mobile mantêm os mesmos fluxos e dados. Os componentes incluem estados de carregamento, erro, esgotamento, foco visível, mensagens acessíveis e preferência por movimento reduzido.

A implementação prioriza o funcionamento sobre equivalência pixel a pixel em estados que não estavam representados no Figma. As diferenças conhecidas estão em [docs/VISUAL_VALIDATION.md](docs/VISUAL_VALIDATION.md).

## Qualidade, execução e limites

O Playwright cobre fluxos em desktop, tablet e mobile, incluindo autenticação, carrinho, checkout, idempotência, reconexão, acessibilidade e regressão visual. Os comandos e resultados registrados estão em [docs/AUDIT.md](docs/AUDIT.md); a correspondência com os requisitos do desafio está em [docs/COMPLIANCE_MATRIX.md](docs/COMPLIANCE_MATRIX.md).

A publicação usa o build de demonstração, com os mocks habilitados e fallback para rotas da SPA conforme `vercel.json`. A publicação precisa ser verificada na URL definitiva, sobretudo para garantir inicialização do service worker, refresh de rotas internas e conexão Socket.IO no ambiente hospedado.

Não há pagamentos reais, contratos blockchain, custódia de carteiras nem persistência em servidor. Para esses usos seriam necessários serviços reais, autenticação segura no backend e regras de consistência entre usuários.
