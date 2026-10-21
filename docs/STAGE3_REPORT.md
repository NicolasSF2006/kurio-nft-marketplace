# Entrega — Etapa 3

## Escopo concluído

Catálogo remoto com busca, filtros combinados, ordenação, paginação, estado de URL e histórico; detalhe direto/404, edições e estoque; cadastro/login/logout, restore/expiração, guards e destino original; perfil/avatar/senha; carteiras principal/secundária; favoritos privados com atualização otimista/rollback; carrinho visitante/conta, mesclagem, persistência, cupons e cotação decimal pela API. Estados loading/empty/error e recuperação preservam a identidade visual e os assets anteriores.

## Endpoints, uso e persistência

Os contratos e operações MSW estão em [REST_API.md](REST_API.md). O [README](../README.md) contém instalação, credenciais, comandos, instruções para cada fluxo e tabela de cenários. A [arquitetura](../ARCHITECTURE.md) registra chaves de cache, cancelamento, invalidação, isolamento e limites da simulação.

Sessões são tokens opacos de 30 minutos. O banco local versionado mantém somente hashes PBKDF2 de senha, além de dados das contas e carrinhos. O cliente guarda token/UUID visitante separados. Logout/troca/expiração cancelam queries privadas e limpam caches; os dados persistidos da conta permanecem isolados. Reset completo e troca de cenário estão disponíveis em `/system` e `window.kurioMocks`.

## Arquivos principais criados ou modificados

| Camada | Arquivos |
| --- | --- |
| Contratos | `src/types/api.ts` |
| Rede e utilitários | `src/lib/api.ts`, `api-error.ts`, `catalog-search.ts`, `session-storage.ts` |
| Mocks | `src/mocks/state.ts`, `scenarios.ts`, `browser.ts`, `fixtures/catalog.ts`, `handlers/rest.ts` |
| Bootstrap e shell | `src/app/bootstrap.ts`, `styles.css`, `functionality.css`, `src/components/app-shell.tsx` |
| Rotas e proteção | `src/routes/index.tsx`, `marketplace.ts`, `src/features/auth/session.ts`, `session-boundary.tsx` |
| Queries/mutations | `src/features/marketplace/api.ts` |
| Telas conectadas | `src/features/catalog/catalog-page.tsx`, `nft/nft-page.tsx`, `cart/cart-page.tsx`, `auth/auth-page.tsx`, `account/account-pages.tsx`, `checkout/checkout-page.tsx` |
| Componentes compartilhados | `src/components/marketplace/forms.tsx`, `feedback.tsx`, `favorite-button.tsx`, `nft-card.tsx`, `header.tsx`, `footer.tsx`, `summary.tsx` |
| Diagnóstico e cenários | `src/features/system/mock-controls.tsx`, `system-status.tsx` |
| E2E | `tests/e2e/functional.spec.ts`, `session-recovery.spec.ts`, `interface.spec.ts`, `tests/helpers/flows.ts` |
| Dependências | `package.json`, `package-lock.json`: adição de `decimal.js@10.6.0` |
| Documentação | `README.md`, `ARCHITECTURE.md`, `docs/REST_API.md`, `VISUAL_VALIDATION.md`, este relatório |

Os testes anteriores de navegação, infraestrutura e 404 foram mantidos. Os testes da interface foram adaptados às rotas protegidas e às ações implementadas, mantendo renderização das nove telas, foco, imagens, responsividade e confirmação pendente.

## Cobertura automatizada

Os fluxos observam a interface e passam pelas chamadas Axios/MSW. Cada contexto começa isolado; fixtures de conta/carrinho para capturas são criadas pela UI/API. Não há interceptações Playwright que substituam a camada MSW por respostas estáticas.

- Busca, combinação de filtros, ordenação, paginação, refresh e voltar no histórico.
- NFT inexistente, seleção de edição esgotada, limite de quantidade e adição.
- Cadastro com confirmação inválida, conflito, login e sessão restaurada.
- Expiração, destino original, logout, troca de conta com/sem logout e isolamento de perfil, favoritos e carrinho.
- Favoritos sincronizados entre detalhe/catálogo, persistência, falha e rollback.
- Quantidade e remoção de carrinho, refresh, mesclagem sem linhas duplicadas e total decimal.
- Cupom válido, inválido, expirado e remoção.
- Perfil, avatar (tipo/tamanho), senha atual incorreta, nova senha e login com senha alterada.
- Criação/edição de carteira principal e criação/persistência de secundária, com endereço inválido.
- Skeleton lento, resultado vazio, HTTP 400/503, falha de rede, estoque indisponível, respostas de buscas fora de ordem e recuperação.
- Sessão expirada no pagamento com retorno ao mesmo contexto/carrinho após login.
- Reset pelos controles da interface e URLs numéricas para preço/busca.
- Renderização de nove páginas em 1440/768/390, navegação/diálogos por teclado, assets locais carregados e ausência de overflow/pageerrors; seis capturas adicionais em 414 × 896.

## Resultado final das verificações

Ambiente: Windows, Node 24.11.0, npm 11.6.1, Chromium instalado pelo Playwright 1.64.1. Todos os fluxos principais foram executados em desktop 1440 × 900, tablet 768 × 1024 e mobile 390 × 844, além das seis capturas mobile em 414 × 896. Data: 20/10/2026.

| Verificação | Resultado |
| --- | --- |
| `npm install decimal.js@10.6.0` | Concluído, audit sem vulnerabilidades |
| `npm run typecheck` | Aprovado |
| `npm run lint` | Aprovado, zero warnings |
| `npm run build` | Aprovado |
| `npm run build:demo` | Aprovado |
| `npm run test:e2e` | **46 aprovados, 2 ignorados**, 3,5 min, zero falhas |
| `npm run test:e2e:demo` | **46 aprovados, 2 ignorados**, 2,5 min, zero falhas |

As duas execuções ignoradas são somente a captura específica de referência mobile nos projetos desktop e tablet. Nenhum fluxo funcional foi ignorado. A suíte inclui os testes anteriores e as regressões corrigidas: botão de logout escondido em mobile, feedback de criação de carteiras perdido por remount e normalização de parâmetros numéricos da URL. Os testes aguardam a conclusão de mutations antes de refresh/navegação completa, preservando a avaliação otimista de favoritos.

Relatórios locais: [desenvolvimento](../reports/playwright-development/index.html) e [build demo](../playwright-report/index.html). Capturas em `reports/visual/{chromium-desktop,chromium-tablet,chromium-mobile,figma-mobile-414}`; [comparação com as referências já obtidas](../reports/visual/comparison.html). Foram examinadas capturas de carrinho desktop e perfil tablet/mobile; todas as nove páginas passaram nas verificações automatizadas de imagens, overflow e erros. Relatórios e capturas estão no `.gitignore`.

Lighthouse não foi executado nesta etapa; scripts/configuração anteriores foram preservados. Não houve commit, push, deploy ou modificação de arquivos fora da pasta do projeto.

## Limitações restantes

Sem fechamento de compra/pedidos/idempotência, pagamentos ou eventos Socket.IO de domínio, conforme solicitado. Checkout protegido apresenta revisão real do carrinho/cotação, mas conectar carteira e confirmar continuam pendentes. O transporte Socket.IO anterior e seu evento de diagnóstico foram preservados.

O banco é um simulador no navegador: não oferece segurança ou transações multiaba de um backend real. Endereços têm validação sintática; não há verificação on-chain. Não houve nova leitura do Figma MCP nesta etapa; foram usados os componentes, tokens e assets já obtidos. Estados funcionais acrescentam espaço/conteúdo e foram documentados; não se declara fidelidade pixel a pixel. Lighthouse final, baselines visuais aprovadas e deploy ficam para as próximas etapas. Nenhum commit, push ou deploy foi realizado.
