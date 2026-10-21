# Auditoria final — Etapa 5

Data: 21/10/2026. Estado deste registro: **auditoria interrompida durante otimizações finais; evidências disponíveis consolidadas, revalidação ainda necessária**. Nenhum commit, push ou deploy foi autorizado/executado. O resultado de prontidão só será concluído após registrar as medições finais.

## Requisitos e evidências

O [README oficial](https://github.com/junglegaming/frontend-challenge) foi relido integralmente, incluindo os critérios eliminatórios. A [matriz completa](COMPLIANCE_MATRIX.md) relaciona requisitos, arquivos, testes e status. Stack preservada, chamadas reais Axios/MSW, isolamento por conta, idempotência e `socket.io-client` com binding compatível foram conferidos em código e testes. Sucesso é condicionado a pedido `confirmed`; `/order-preview` é explicitamente ilustrativo.

## Correções realizadas

- Busca desktop: remoção do `clip-path` residual de `sr-only`, que recortava um campo com dimensões aparentemente válidas.
- Catálogo mobile/tablet: a API/DOM tinham nove itens, mas CSS ocultava cinco. Todos ficam acessíveis; o teste agora exige nove cards visíveis e rola até o último.
- Hero, tabs e favoritos mobile: alinhamento desktop, descrição sem invadir imagem em 390, tabs em uma linha com rolagem e ícone original de coração/círculo.
- Autenticação desktop: modal fixo no topo previsto, com rolagem interna em alturas pequenas, sem deslocamento pela margem do body.
- Capturas: espera por carregamento, `aria-busy`, conexão, fontes e imagens, corrigindo screenshots de skeleton em carrinho/carteiras.
- Semântica ARIA: estrelas têm papel de imagem e contador do carrinho integra o nome acessível do link.
- Erro de rede da carteira associado ao select por `aria-invalid`/`aria-describedby`, com mensagem específica e limpeza ao corrigir a seleção.
- Detalhe: contrato/direitos corretamente associados; metadados vêm do DTO/fixture, com rede coerente e indicação de simulação.
- Mensagens antigas sobre compra pendente atualizadas. Avisos do catálogo não cobrem pedidos/recibos; explorador do recibo é explicitamente simulado.
- Carregamento: módulos independentes do bootstrap em paralelo, mantendo worker antes de Router/Socket.IO; divisão das rotas de conta/carrinho/checkout/pedidos/diagnóstico e preload da fonte local.
- CLS: skeleton do catálogo reserva hero, sidebar e nove cards; durante a consulta, os próprios cards mantêm a grade, evitando um bloco genérico extra que deslocava os resultados. O teste lento mede CLS real com PerformanceObserver e exige menos de 0,02, sem relaxar o limite após as falhas encontradas.
- Fonte: o mesmo TTF variável foi comprimido para WOFF2, 183.700 → 105.240 bytes, sem subsetting. TTF/licença preservados e hashes em `optimized-font.json`; as 16 comparações visuais passaram sem atualização das referências.
- Imagens: 16 WebPs responsivos gerados a partir dos quatro PNGs locais, sem substituição da arte. Originais preservados e fallback PNG; derivados somam **1.285.574 bytes**, frente a aproximadamente 7,96 MB dos quatro originais. Manifesto/SHA-256 em `optimized-assets.json`.
- `vercel.json` preparado para build demo, fallback SPA, assets imutáveis, worker sem cache e headers básicos. Nenhuma publicação efetuada.

Três dependências novas de desenvolvimento: `@axe-core/playwright@4.14.0`, `sharp@0.35.5` e `wawoff2@2.0.1`. Nenhuma biblioteca obrigatória foi removida/trocada. Os fluxos financeiros e a arquitetura da Etapa 4 foram mantidos.

## Testes e comandos

| Verificação | Resultado |
| --- | --- |
| `npm ci` | Aprovado; 432 pacotes instalados, 433 auditados, zero vulnerabilidades |
| `npm audit --omit=dev` | Zero vulnerabilidades |
| `npm run typecheck` | Aprovado |
| `npm run lint` | Aprovado, zero warnings |
| `npm run build` | Aprovado |
| `npm run build:demo` | Aprovado |
| Desenvolvimento — execução completa | 112 aprovados, zero falhas, dois skips, 8,6 min |
| Regressão após associação do erro de rede | 24 aprovados, zero falhas, 1,7 min |
| Regressão de fonte/loading | Em validação |
| Demo — execução final | 112 aprovados, zero falhas, dois skips, 5,7 min |
| Lighthouse — 12 medições existentes | 12 relatórios e summary.json presentes; medidos antes do último ajuste de CLS/fonte, portanto não validam a última alteração |

Configuração: 114 casos, incluindo os anteriores, em Chromium 1440 × 900, 768 × 1024 e 390 × 844. Os dois skips são somente a captura específica 414 × 896 nos projetos desktop/tablet; ela executa no projeto mobile. Nenhum teste funcional foi removido/ignorado. A suíte inclui 12 casos visuais/16 PNGs, nove casos de acessibilidade e seis de integridade.

A primeira execução completa desta etapa teve **111 aprovações, uma falha tablet e dois skips**, em 8,3 min. Trace e timestamps mostram que `package.json` foi alterado às 03:29:43 UTC, provocando recarga do Vite exatamente durante abertura do filtro; o fluxo perdeu o diálogo. O relatório foi preservado em [execução inicial](../reports/playwright-stage5-development-initial/index.html). A causa foi corrigida encerrando alterações de configuração antes da nova suíte. O teste também aguarda a conclusão observável da limpeza da busca (URL canônica e nove itens) antes de abrir filtros. Nenhum timeout foi aumentado.

Execuções aprovadas preservadas: [desenvolvimento completo](../reports/playwright-stage5-development/index.html), [24 regressões após corrigir a associação de erro de rede](../reports/playwright-stage5-a11y-final/index.html) e [demo completo](../reports/playwright-stage5-demo/index.html). Após o ajuste final, typecheck/lint/ambos os builds foram repetidos e aprovados; a suíte demo completa validou o código final. Os baselines não foram atualizados nessas execuções.

O teste de cotação instala relógio controlado, avança 121 s e comprova que não há POST de pedido até atualizar/revisar/confirmar. Casos de Socket.IO usam ações da camada MSW e contadores dos listeners reais; não há `page.route` nem setters fabricando resultados. Capturas e relatórios usam o mesmo mock de dev/demo.

## Regressão e revisão visual

O Figma MCP foi acessado nesta etapa: novas referências dos **15 frames**, salvas em `docs/figma/`. Foram examinados os nove pares desktop e seis mobile, mais baselines em 390/768/1440 e 414 × 896. [Registro detalhado](VISUAL_VALIDATION.md) e [comparador local](../reports/visual/comparison-stage5.html).

Todos os 137 arquivos únicos referenciados por `design-assets.ts` existem (291 referências, zero ausentes). SHA-256 confirma os quatro PNGs originais intactos. A fonte Roboto Mono e os SVGs originais continuam locais. A renderização das imagens e ausência de overflow são conferidas pelos testes.

Baselines fonte: **16 PNGs**, aproximadamente 6,28 MB, em `tests/baselines/win32/`, fora dos relatórios ignorados. O projeto recebido não possui metadados Git; os arquivos estão prontos para versionamento, sem realizar commit. A atualização implícita está desativada.

A primeira revisão produziu quatro falhas legítimas: início nos três projetos e detalhe desktop. Os actual/diff foram examinados e o [HTML com traces preservado](../reports/playwright-stage5-visual-review/index.html). Foram aprovadas explicitamente as mudanças esperadas após corrigir busca, resultados escondidos e metadados. Carrinho/checkout passaram sem troca de baseline. Depois as comparações são executadas normalmente, sem flags de atualização.

Não se declara fidelidade perfeita: exports desktop MCP são reduzidos a 1024 px de altura, estados/quantidades/cotações são reais na simulação e há extensões funcionais. A busca, revisão de compra, validação, dados de carteira e recibo dinâmico alteram a altura/composição. Controles mobile permitem rolagem; perfis/carteiras/recibo são adaptações sem frame específico. Há diferenças pontuais de rasterização/alinhamento.

## Acessibilidade e segurança

Axe-core 4.14.0 verifica nove telas, validação e recibo confirmado nos três projetos. JSONs completos das nove telas ficam em `reports/accessibility/`, anexados ao relatório. Testes anteriores de teclado, foco em diálogos/drawers e Escape foram preservados; testes novos verificam erros associados, foco visível, texto 200% e movimento reduzido. Isso não equivale a certificação WCAG nem teste com todas as tecnologias assistivas/zoom.

Inspeção de `src`, HTML, envs e configuração não encontrou segredo real. As credenciais são fictícias e públicas. Persistência não contém senha clara, DTO de sessão não expõe hash/sal, logout remove token/cache/subscriptions, e rotas/endpoints privados conferem o dono. Reenvios não duplicam operações. As chamadas de negócio usam `/api` e socket na própria origem; a origem externa Kaspersky registrada pelo Lighthouse é injeção do ambiente, não integração do produto.

Banco e tokens de demonstração são locais ao navegador: não constituem autenticação segura multiusuário de produção. Quem compartilha o mesmo perfil do navegador pode inspecionar o banco; não há transações entre abas. Não há blockchain, extensão ou gateway real. Recusa e timeout preservam contexto; tentativas incertas persistem por usuário até recuperação/reset.

Rotas diretas, refresh, guards e 404 da interface foram exercitados localmente. O fallback HTTP da SPA responde 200 para rotas desconhecidas e deixa o Router mostrar o 404; não é um status 404 de servidor. Fallback/headers remotos, HTTPS e URL pública só podem ser comprovados após deploy autorizado.

## Lighthouse

**Atualização após inspeção do ZIP:** foram encontrados `reports/lighthouse-final/summary.json` e 12 relatórios completos; a tabela abaixo reflete os valores realmente registrados em 21/10/2026, às 04:04 UTC. Esses resultados são **anteriores** ao ajuste final do skeleton/CLS mencionado no log da ferramenta; logo, a rodada final após essa mudança continua pendente.

| Página / perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início / mobile | 57 | 100 | 81 | 100 | 6.964 ms | 0,1466 | 262 ms |
| Detalhe / mobile | 64 | 100 | 81 | 100 | 6.758 ms | 0,0004 | 236 ms |
| Início / desktop | 93 | 100 | 81 | 100 | 1.652 ms | 0,0256 | 7 ms |
| Detalhe / desktop | 92 | 100 | 81 | 100 | 1.777 ms | 0,0003 | 0 ms |

Best Practices apresentou script HTTP injetado pelo Kaspersky no ambiente original, mas a interferência externa não autoriza declarar o resultado como aprovado. Performance mobile permanece abaixo da meta; medir novamente após as otimizações e investigar LCP alto.

Medições finais ainda pendentes **após o último ajuste** neste registro. O runner mede início/detalhe, mobile/desktop, três vezes por combinação, com Chrome novo. Nenhuma função, imagem, fonte, origem ou auditoria é removida. HTML/JSON, medianas, LCP/CLS/TBT e metadados completos serão registrados ao concluir.

Diagnóstico inicial: início desktop 91/100/81/100; detalhe desktop 93/96/81/100; início mobile 62/100/81/100. Não são resultados finais. `is-on-https` identifica requests HTTP de `gc.kis.v2.scr.kaspersky-labs.com`; o script injetado também aparece entre recursos bloqueantes e JavaScript não minificado. A cadeia de inicialização SPA/MSW é outro custo real. Houve uma falha intermediária do Chrome (`TargetCloseError`), separada das pontuações válidas. O runner registra falhas de execução e permite somente um novo Chrome, sem descartar notas baixas.

Ambiente: Windows 10.0.19045 x64; AMD Ryzen 5 5600GT; 16.508.215.296 bytes de RAM; Node 24.11.0, npm 11.6.1, Vite 8.3.4, Playwright 1.64.1/Chromium 156 e Lighthouse 13.5.0. Perfis e throttling versionados em `lighthouse.config.mjs`; mobile usa CPU ×4/rede simulada e desktop CPU ×1. Resultados devem ser reproduzidos em ambiente sem injeção externa. Nenhuma configuração do antivírus/sistema foi alterada.

## Arquivos da etapa

| Grupo | Arquivos |
| --- | --- |
| Configuração | `package.json`, `package-lock.json`, `playwright.config.ts`, `vercel.json`, `index.html` |
| Inicialização/rotas | `src/main.tsx`, `app/bootstrap.ts`, `routes/marketplace.ts`, `routes/system.tsx` |
| Layout/compartilhados | `app/styles.css`, `app/marketplace.css`, `app/functionality.css`, `components/marketplace/{actions,artwork,favorite-button,header,nft-card,forms,preview,catalog-skeleton}.tsx` |
| Telas/tempo real | `features/{catalog/catalog-page,nft/nft-page,cart/cart-page,checkout/checkout-page,checkout/order-page,checkout/receipt-page,checkout/collector-fields}.tsx`, `realtime/domain-sync.tsx` |
| Contrato/fixture | `types/api.ts`, `mocks/fixtures/catalog.ts` |
| Testes | Novos `accessibility.spec.ts`, `integrity.spec.ts`, `visual.spec.ts`, `helpers/visual.ts`; ajustes em `functional.spec.ts`, `interface.spec.ts`, `checkout.spec.ts`; 16 baselines |
| Scripts | `lighthouse.mjs`, novos `optimize-images.mjs`, `optimize-font.mjs`, `visual-report.mjs` |
| Assets/evidências | 16 `public/assets/artwork/*.webp`, `public/fonts/roboto-mono-variable.woff2`, `docs/optimized-assets.json`, `docs/optimized-font.json`, 15 `docs/figma/*.png` |
| Documentação | README, ARCHITECTURE, REST_API, SOCKET_EVENTS, AUDIT, COMPLIANCE_MATRIX, VISUAL_VALIDATION, este relatório |

## Prontidão

Esta revisão confirmou que os arquivos de aplicação, testes, 16 baselines, fontes/imagens e a configuração `vercel.json` estão presentes. As 12 medições Lighthouse documentadas são anteriores ao ajuste final do skeleton. Não foi possível reinstalar dependências ou reexecutar os testes no ambiente de revisão: o projeto exige Node >=24.11, e o ambiente disponibilizou Node 22.16; a tentativa de `npm ci` não concluiu por limitação de instalação/rede. Os resultados de testes aqui citados continuam sendo os resultados previamente relatados pelo Codex.

Avaliação final em andamento. Publicação preparada, ainda não executada. Metas abaixo do esperado e verificações remotas pendentes impedem uma declaração de conformidade integral sem ressalvas. Nenhum commit, push ou deploy; aguardar autorização após a auditoria.
