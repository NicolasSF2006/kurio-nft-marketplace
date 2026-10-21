# Matriz de conformidade — Etapa 5

Referência: [README oficial completo, seções 1–12](https://github.com/junglegaming/frontend-challenge), consultado em 21/10/2026, e requisitos das etapas solicitadas. Esta matriz descreve a implementação observada; não substitui os relatórios de execução. Resultados finais e limitações em [STAGE5_REPORT.md](STAGE5_REPORT.md). As evidências apontam arquivos reais e nomes/trechos de testes encontrados neles.

`aprovado`: implementação e verificação correspondentes; `parcial`: existe evidência, com limite explicitado; `pendente`: depende de uma ação ainda não executada. Publicação permanece pendente por instrução expressa. A fidelidade não é declarada perfeita e as metas Lighthouse são avaliadas separadamente.

## Stack e critérios eliminatórios

| Requisito | Implementação | Evidência/teste | Status |
| --- | --- | --- | --- |
| React, TypeScript strict e Vite efetivos | `src/main.tsx`, `tsconfig.app.json`, `tsconfig.tests.json`, `vite.config.ts` | Typecheck/build; `navigation.spec.ts`: abre o Kurio | aprovado |
| Router: rotas, search tipado e guards | `src/app/router.ts`, `src/routes/`, `features/auth/session.ts` | `functional.spec.ts`: catálogo/histórico e proteção; `session-recovery.spec.ts` | aprovado |
| Query: consultas, mutations e cache | `lib/query-client.ts`, `features/marketplace/api.ts`, `features/checkout/queries.ts` | Favoritos com rollback, troca de conta, carrinho, checkout | aprovado |
| Axios central e REST efetivos | `lib/api.ts`, `features/marketplace/api.ts`, `features/checkout/checkout-page.tsx` | Suítes funcionais observam resultados reais dos handlers, sem `page.route` | aprovado |
| Tailwind e shadcn/ui adaptados | `app/styles.css`, `components/ui/{button,input,textarea,skeleton}.tsx`, `components.json` | Interface, foco, campos, skeletons e screenshots | aprovado |
| MSW efetivo, separado da UI | `app/bootstrap.ts`, `mocks/browser.ts`, `mocks/handlers/`, `mocks/purchases.ts` | Todas as suítes com worker real em dev/demo | aprovado |
| Socket.IO real no cliente, sem atalhos por setters | `realtime/client.ts`, `domain-sync.tsx`, `mocks/handlers/realtime.ts`, `mocks/events.ts` | `checkout.spec.ts`: contadores de listeners, eventos, duplicatas, reconexão; ação de mock só faz REST | aprovado |
| Playwright executável, stack preservada | `playwright.config.ts`, `scripts/playwright.mjs`, `tests/e2e/` | Execuções completas dev/demo; nenhum teste anterior removido | aprovado |
| Lighthouse efetivo | `lighthouse.config.mjs`, `scripts/lighthouse.mjs` | HTML/JSON das 12 medições finais; metas e causas no relatório | parcial |
| Fluxos principais funcionais | Features catálogo/NFT/cart/auth/account/checkout; `mocks/handlers/rest.ts`, `purchases.ts` | `functional.spec.ts`, `checkout.spec.ts`, `session-recovery.spec.ts` | aprovado |
| Sucesso de compra somente após resposta da simulação | `checkout/order-page.tsx`, `mocks/purchases.ts` | Compra completa, pendente, recusa e timeout; título de sucesso condicionado a `confirmed` | aprovado |
| Isolamento entre contas e limpeza de subscriptions/cache | `auth/session.ts`, `session-boundary.tsx`, `marketplace/api.ts`, `domain-sync.tsx`, `mocks/http.ts` | Troca direta, favoritos, carrinho privado, pedido de outra conta e zero eventos privados da anterior | aprovado |
| Sem backend, blockchain ou pagamento verdadeiro | `mocks/`, `vercel.json`, referência simulada no recibo | `accessibility.spec.ts`: explorador simulado; inspeção das chamadas e configuração | aprovado |

## Telas e fluxos

| Requisito | Implementação | Evidência/teste | Status |
| --- | --- | --- | --- |
| Início: destaques, catálogo e busca | `features/catalog/catalog-page.tsx`, `components/marketplace/nft-card.tsx` | `functional.spec.ts`: catálogo; `visual.spec.ts`: home; busca sem recorte CSS | aprovado |
| Detalhe, galeria, edições, quantidade, compra | `features/nft/nft-page.tsx`, `components/marketplace/forms.tsx` | Acesso direto/404, edição esgotada e limite; diálogo e foco | aprovado |
| Carrinho: quantidades, remoção, cupom e resumo | `features/cart/cart-page.tsx`, `components/marketplace/summary.tsx` | Carrinho persiste/mescla; cupom válido/inválido/expirado/remoção | aprovado |
| Pagamento: coletor, carteira, rede, revisão e envio | `features/checkout/checkout-page.tsx`, `collector-fields.tsx` | Compra completa; validação de coletor/rede; carteira recusada/desconectada | aprovado |
| Confirmação com identificação, itens, taxas e total | `features/checkout/order-page.tsx` | Compra completa e snapshot terminal; axe do recibo | aprovado |
| Login/cadastro com validação, conflito e destino | `features/auth/auth-page.tsx`, `session.ts` | Cadastro/conflito, expiração e retorno; redirecionamento externo rejeitado | aprovado |
| Perfil, avatar, senha e carteiras principal/secundária | `features/account/account-pages.tsx` | Edição/persistência, formato/tamanho de avatar, senha inválida, carteiras | aprovado |
| Nove páginas em desktop, tablet e mobile | Features e `app/marketplace.css`, `functionality.css`, `checkout.css` | `interface.spec.ts`: nove páginas em 1440/768/390; imagens e overflow | aprovado |
| Seis frames mobile 414 × 896 | Mesmas features com composições mobile | `interface.spec.ts`: captura os seis frames; novas referências MCP locais | aprovado |
| Fidelidade a cores, fonte, imagens e composição | Tokens em `app/styles.css`, `lib/design-assets.ts`; `docs/figma/` | 15 pares examinados, `VISUAL_VALIDATION.md` e HTML comparativo; diferenças funcionais persistem | parcial |
| Links e ações auxiliares coerentes | `components/marketplace/actions.tsx`, footer/header, recibo | Feedback explícito fora do escopo; explorador simulado não abre serviço real | aprovado |

## Integração, carrinho, conta e compra

| Requisito | Implementação | Evidência/teste | Status |
| --- | --- | --- | --- |
| Busca/filtros/ordem/página compõem URL e histórico | `lib/catalog-search.ts`, `routes/index.tsx`, `catalog-page.tsx` | `functional.spec.ts`: filtros combinados, sort, refresh, voltar e página 2 | aprovado |
| Filtros combináveis, reset da página e parâmetros na API | `catalog-page.tsx`, `marketplace/api.ts`, `mocks/handlers/rest.ts` | Mesmo teste de catálogo; estado da URL e resultados | aprovado |
| Todos os resultados da página acessíveis no mobile | `app/functionality.css` | Nove cards `:visible` e último card no viewport, corrigindo CSS que escondia cinco | aprovado |
| Vazio, lentidão, 4xx/5xx, offline, recuperação e respostas obsoletas | `mocks/scenarios.ts`, handlers, `components/marketplace/{preview,feedback}.tsx` | `functional.spec.ts`: loading/vazio/HTTP/conexão/fora de ordem; `session-recovery.spec.ts` | aprovado |
| Favoritos privados, persistentes, otimistas e rollback | `marketplace/api.ts`, `favorite-button.tsx`, handlers REST | `functional.spec.ts`: favoritos e falha de mutation; troca de conta | aprovado |
| Carrinho por NFT/edição respeita estoque | `mocks/handlers/rest.ts`, `cart-page.tsx` | Limites, quantidades e remoção; edição esgotada preserva carrinho | aprovado |
| Refresh, visitante → login e isolamento do carrinho | `mocks/state.ts`, handler `authenticate`, sessão/cache | Carrinho persiste/mescla; expiração e troca direta de usuário | aprovado |
| ETH como strings, cálculo preciso e cotação como referência | `types/api.ts`, `mocks/purchases.ts`, decimal.js | Teste subtotal `2.38`, desconto `0.238`, taxa `0.016`, total `2.158`; resumos da API | aprovado |
| Cadastro/login/logout/restore/expiração via REST | `auth/`, `mocks/handlers/rest.ts` | Cadastro, restore, proteção, logout e expiração durante checkout | aprovado |
| Validações de API e alterações permanecem após refresh | Handlers REST, `Field`, `PasswordField`, account/auth | Perfil/avatar/senha/carteiras; mensagens de erro associadas | aprovado |
| Senhas não persistidas em claro e DTO sem hash/sal | `mocks/state.ts`: PBKDF2/SHA-256, 120.000 iterações | `integrity.spec.ts`: sessão sem hash e storage sem senha; credenciais públicas fictícias | aprovado |
| Contratos REST tipados e documentados, incluindo erros | `types/{api,orders,marketplace}.ts`, `docs/REST_API.md` | Fluxos REST e erros 400/401/404/409/422/503 | aprovado |
| Cache/retries/cancelamento/invalidação coerentes | `query-client.ts`, opções de query com AbortSignal, `domain-sync.tsx` | Fora de ordem, rollback, mutações e troca de conta; política documentada | aprovado |
| Validação/revisão de coletor e carteira/rede; recusa/desconexão | `collector-fields.tsx`, `checkout-page.tsx`, `mocks/purchases.ts` | `checkout.spec.ts`: carteira valida rede, recusa e desconexão | aprovado |
| Revalidar preço, estoque, cupom e taxa; exigir revisão | `issueQuote`, POST orders, `quote.revision` e checkout | Preço/socket, edição esgotada, taxa/cupom; botão bloqueado até revisar | aprovado |
| Expiração da cotação | Prazo 120 s, timer do checkout e validação no POST | `integrity.spec.ts`: relógio avança 121 s, atualiza/revisa, zero POST antes da confirmação | aprovado |
| Idempotência por conta/chave/corpo; impedir duplicatas | `mocks/purchases.ts`, `lib/checkout-attempt.ts` | Clique repetido/reenvio, mesmo pedido e conteúdo diferente 409 | aprovado |
| Timeout após criação recupera sem nova compra | `checkout/Recovery`, GET by-key, tentativa persistida | Timeout após criar; um POST; mesma chave e pedido após recuperação | aprovado |
| Pendente/confirmado/recusado, estados terminais | `mocks/purchases.ts`, `order-page.tsx`, `checkout/queries.ts` | Compra completa/recusa; eventos antigos não revertem recibo | aprovado |
| Refresh/reconexão/expiração recuperam pedido | `scheduleOrders`, consultas por chave/id e reconciliação | Pedido pendente recupera; expiração após criação retoma com login | aprovado |
| Falhas preservam carrinho; confirmação subtrai só o comprado | `settleOrder` em `mocks/purchases.ts` | Recusa preserva; confirmação conserva adições posteriores | aprovado |
| Recibo imutável com valores capturados na criação | Snapshot clonado em `mocks/purchases.ts`, DTO `Order` | Preço/eventos antigos posteriores não alteram total terminal | aprovado |

## Mocks, tempo real, qualidade e entrega

| Requisito | Implementação | Evidência/teste | Status |
| --- | --- | --- | --- |
| MSW na rede, sem fixtures importadas nos componentes/hooks/Axios | `mocks/fixtures/`, `handlers/`, inicialização configurável | Inspeção de imports; suítes usam Axios/worker, controles fazem POST ao mock | aprovado |
| Estado consistente, persistência, dois usuários e reset completo | `mocks/state.ts`, `purchases.ts`, bootstrap reset | Nova/Luna, troca de conta, persistência e reset após eventos na mesma SPA | aprovado |
| Cenários determinísticos exigidos | `types/api.ts`, `mocks/scenarios.ts`, `applyPurchaseScenario/applyAction` | Erros, latência variável, fora de ordem, cupons, sessão, estoque, timeout e pagamentos | aprovado |
| Mocks disponíveis no build demo e por configuração | `.env.demo`, `.env.development`, `app/bootstrap.ts`, `vercel.json` | Suíte demo contra arquivos otimizados; build padrão sem flag ativa | aprovado |
| Protocolo Socket.IO compatível com MSW | Binding 0.2.0, MSW 2.15.0, Socket.IO Client 4.8.4, namespace `/`, WebSocket | Diagnóstico e eventos de domínio atravessam o cliente; limites documentados em REST/Socket docs | aprovado |
| `nft.updated`: preço/estoque e resumo/cotação | `mocks/events.ts`, `realtime/domain-sync.tsx` | Preço alterado e esgotamento no checkout; resumo e revisão bloqueada | aprovado |
| `order.updated`: resultado privado da compra | Mesmos arquivos + `order-page.tsx` | Contador do listener > 1, confirmação/recusa e outra conta não recebe | aprovado |
| Identidade, recurso, versão; duplicatas/antigos não regridem | DTOs, mapas de versão e structuralSharing de pedidos | `checkout.spec.ts`: eventos duplicados e antigos | aprovado |
| Reconexão reconcilia REST; cleanup por sessão | `DomainSync` effect, `realtime/client.ts`, `SessionBoundary` | Pedido pendente desconecta, resolve e recupera após reconectar; troca de usuário | aprovado |
| Shimmer, dimensões de loading e movimento reduzido | `Skeleton`, PreviewData/NetworkState, CSS | Slow scenario e teste de duração da animação reduzida; CLS medido no Lighthouse | parcial |
| Teclado, foco de diálogo/drawer e labels | Radix Dialog, campos com useId, foco global | `interface.spec.ts`: Tab/Escape/retorno; `accessibility.spec.ts`: axe e foco | aprovado |
| Erros associados, alt, contraste, feedback acessível | Campos ARIA, roles status/alert, tokens, imagens locais | Axe nas nove telas/recibo e erro de confirmação de senha; Lighthouse A | aprovado |
| Sem overflow e conteúdo ampliado | Layouts responsivos e regras CSS corrigidas | Nove telas em três viewports, seis em 414, texto 200%; automação não certifica todos os tipos de zoom/leitor de tela | parcial |
| Regressão visual com dados estáveis e baselines fonte | `visual.spec.ts`, `helpers/visual.ts`, `tests/baselines/win32/` | 16 PNGs revisados; comparações dev/demo sem autoatualização | aprovado |
| E2E isolados, relatórios HTML e traces | Playwright config/helpers/reset/cenários/relógio | Suítes completas; diffs e traces da revisão preservados; sem remoção de cobertura | aprovado |
| Lighthouse início/detalhe, dois perfis, três medições e medianas | Config/runner e relatórios HTML/JSON | Resumo final com P/A/BP/SEO, LCP/CLS/TBT, ambiente e origens | aprovado |
| Metas Lighthouse 90/95/95/90 | Build demo integral, sem filtros de auditoria | Ver resultados finais: há categorias abaixo da meta; injeção HTTP Kaspersky identificada | parcial |
| Ausência de segredos reais/chamadas de negócio de produção | Env públicos locais; inspeção de src/config/build; dependências auditadas | `integrity.spec.ts`, npm audit; origens de rede registradas separando injeção externa | aprovado |
| Rotas diretas/refresh/404 no app | Router, guards e feedback; fallback SPA preparado | Navigation/interface/functional/checkout; HTTP 200 do fallback estático não é status 404 de servidor | aprovado |
| Arquitetura, contratos, cache, sessão, idempotência e limitações documentados | README, ARCHITECTURE, REST_API, SOCKET_EVENTS, AUDIT | Leitura cruzada com código e comandos executados | aprovado |
| Fonte, lockfile, assets, mocks, testes e configs entregues | Árvore do projeto; dependências fixadas | Instalação por lockfile, typecheck, lint e builds | aprovado |
| Configuração para publicação com mocks e deep links | `vercel.json`, `.env.demo` | Revisão com documentação Vercel; comportamento local demo comprovado | parcial |
| URL pública, repositório e validação remota | Dependem de publicação autorizada | Nenhum commit/push/deploy executado nesta etapa | pendente |

Os critérios eliminatórios funcionais têm evidências nos testes. Isso não converte automaticamente a entrega em conformidade integral: publicação e metas Lighthouse continuam registradas com seus limites.
