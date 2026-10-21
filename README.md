# Kurio NFT Marketplace — auditoria final

Auditoria da Etapa 5 em [STAGE5_REPORT.md](docs/STAGE5_REPORT.md), [matriz de conformidade](docs/COMPLIANCE_MATRIX.md), [reprodução dos testes/auditorias](docs/AUDIT.md) e [contratos Socket.IO](docs/SOCKET_EVENTS.md). O README oficial foi relido integralmente em 21/10/2026. Foram obtidas novas referências dos 15 frames via Figma MCP, salvas em `docs/figma/`. A publicação permanece sem execução, aguardando autorização.

Marketplace do desafio Frontend da Jungle Gaming. A interface e os assets locais foram preservados. Catálogo, conta, carrinho e checkout usam REST via Axios/MSW, com pedidos idempotentes, carteira simulada, recibos imutáveis e sincronização por `socket.io-client` + `@mswjs/socket.io-binding`. Nenhum pagamento ou transferência de blockchain real é executado. `/order-preview` é somente referência visual; sucesso de compra existe apenas em `/orders/:orderId` para pedido confirmado pela simulação.

Fontes: [README oficial](https://github.com/junglegaming/frontend-challenge) e [Figma](https://www.figma.com/design/LMZL4sxsnNYDlLjA7uJ7gV/Frontend-Challenge--Copy-?node-id=0-1). As seções REST, sessão, integração e mocking foram relidas nesta etapa. Os 15 frames e 137 assets foram obtidos na Etapa 2 via Figma MCP. Veja [contratos REST](docs/REST_API.md), [arquitetura](ARCHITECTURE.md) e [validação visual](docs/VISUAL_VALIDATION.md).

## Instalar e executar

Node.js **24.11+ na linha 24 LTS**, npm 11. Versão de referência em `.node-version`.

```sh
npm ci
npm run test:install
npm run dev
```

Abra **http://127.0.0.1:5173/**. `.env.development` ativa os mocks sem configuração adicional. Não há backend, blockchain, extensão de carteira ou pagamento real. Caches npm/Playwright e temporários ficam em `.cache/` no projeto.

Para testar o build otimizado com mocks:

```sh
npm run build:demo
npm run preview
```

Abra **http://127.0.0.1:4173/**. O build padrão mantém mocks desativados quando a flag não é fornecida; use o modo demo para avaliar sem backend. Dados locais pertencem à origem: 5173 e 4173 têm bancos independentes.

## Credenciais fictícias

| Conta | E-mail | Senha de demonstração |
| --- | --- | --- |
| Nova Sato | `nova@kurio.test` | `Kurio123!` |
| Luna Costa | `luna@kurio.test` | `Kurio123!` |

Reset restaura essas credenciais. Cadastro permite criar outras contas. Senhas persistidas são hashes PBKDF2/SHA-256 com sal, 120.000 iterações; a API retorna somente o perfil público e o token. Essas credenciais são públicas e exclusivas da simulação.

## Rotas e fluxos para avaliar

| Rota | Como testar |
| --- | --- |
| `/` | Buscar, combinar coleção/rede/preço, ordenar, trocar página, recarregar e usar voltar/avançar. 36 NFTs, 9 por página. |
| `/?favorites=true` | Lista privada; visitante retorna ao destino após autenticar. Favoritar/remover em cards e detalhe sincroniza o cache. |
| `/nfts/emerald-ape-042` | Ampliar imagem, escolher edição/quantidade e adicionar ao carrinho. `1/1` esgotada; `1/10` limita a 10 unidades. `/nfts/inexistente` mostra 404 de recurso. |
| `/cart` | Adicionar como visitante, mudar quantidades, remover, recarregar, autenticar e conferir mesclagem. Uma linha por NFT/edição. |
| `/login`, `/signup` | Credenciais, validação, conflito de e-mail/usuário e retorno à rota original. |
| `/profile` | Alterar dados, selecionar/remover avatar e salvar; trocar senha em formulário separado; recarregar; sair e entrar com nova senha. |
| `/wallets` | Criar/editar principal e secundária, validar endereço/rede, recarregar. Ethereum/Polygon: `0x` + 40 hexadecimais. |
| `/checkout` | Dados do colecionador, carteira/rede, conexão simulada, revisão de cotação e envio idempotente. |
| `/orders` | Lista privada dos pedidos da conta atual. |
| `/orders/:orderId` | Pedido pendente, recusado ou recibo confirmado; suporta refresh e reconexão. |
| `/order-preview` | Composição visual do recibo; aviso explícito de que não representa um pedido. |
| `/system` | Diagnóstico REST/Socket.IO anterior e controles dos cenários/reset/expiração. |

Cupons no carrinho: **KURIO10** válido (10%); **EXPIRADO** expirado; qualquer outro inválido. A API de cotação calcula subtotal, desconto e taxa com **decimal.js**, sempre com strings ETH. Exemplo: 2 Emerald = subtotal `2.38`, desconto `0.238`, taxa `0.016`, total `2.158` ETH. Desktop e mobile usam o mesmo carrinho.

Avatar aceita PNG/JPEG/WebP de até 500 KB e é enviado ao salvar o perfil. Não use os retratos NFT originais como avatar: eles excedem esse limite. Formulários anunciam erros de API e sucesso; mutations não são repetidas automaticamente.

## Sessão, persistência e isolamento

O mock mantém banco versionado em `localStorage['kurio.mock.database.v3']`, com contas, hashes, sessões, carrinhos, favoritos, carteiras e cenário. O cliente guarda somente token opaco e identificador visitante em chaves separadas. Sessões expiram em 30 minutos e são recuperadas via API após refresh. O cliente verifica sessão em navegação privada, foco e intervalos de 15 segundos, além do prazo local e respostas 401.

Perfil, carteiras, favoritos e checkout exigem autenticação na API; o Router protege as páginas privadas e guarda o destino. Cache privado usa identidade do usuário; logout/troca/expiração cancelam consultas e limpam dados privados e mutations. Respostas antigas não repovoam a conta atual. Logout revoga o token na simulação. Alteração de senha revoga outras sessões da conta.

O carrinho visitante é persistido e consumido na mesclagem do login; quantidades da mesma edição são somadas, limitadas ao estoque. Sair conserva o carrinho da conta e mostra o carrinho visitante vazio. O banco local é infraestrutura de **simulação no navegador**, sem promessa de segurança ou concorrência equivalente a um servidor real.

## Checkout, pedidos e Socket.IO

1. Entre com uma conta de demonstração e cadastre uma carteira em `/wallets` (por exemplo, Ethereum e `0x1111111111111111111111111111111111111111`).
2. Adicione Emerald Ape ao carrinho e escolha **Conectar e finalizar**.
3. Selecione carteira e rede compatíveis. **Conectar carteira** / **Desconectar carteira** consultam a API simulada; não abrem extensões. Os dados do colecionador são editáveis; no mobile, abra **Dados do colecionador**.
4. Confira itens e cotação. **Confirmar compra** salva uma chave de idempotência antes do POST. O pedido começa pendente e, no cenário padrão, é resolvido após 1,2 s.
5. O resultado chega por `order.updated`. Somente um estado confirmado apresenta sucesso. Recusa mantém o carrinho; confirmação subtrai somente as quantidades compradas, preservando adições posteriores.

Preço, disponibilidade, cupom e taxas são revalidados no servidor simulado antes de criar o pedido. Alterações de cotação bloqueiam o envio até **Revisar novos valores** e uma nova confirmação. Cotações duram 2 minutos e podem ser atualizadas explicitamente. Estoque é reservado no pedido pendente e liberado na recusa. O recibo usa os valores, imagens, carteira e dados do colecionador capturados na criação; alterações posteriores não modificam esse snapshot.

Um timeout de criação não gera outra tentativa. A recuperação consulta `/orders/by-key/:key`; se não houver registro, permite reenviar **a mesma tentativa**. Chave + conteúdo iguais recuperam o mesmo pedido; conteúdo diferente retorna 409. A tentativa é persistida por usuário em chave separada, permitindo retomada após refresh ou expiração da sessão. Não descarte a tentativa enquanto o resultado for incerto.

O transporte é Socket.IO 4.x real no cliente, namespace `/`, somente WebSocket, interceptado por MSW 2.15 e binding 0.2.0. Eventos `nft.updated` e `order.updated` possuem identidade e versão. O cliente ignora duplicatas/eventos antigos, cancela consultas obsoletas e reconcilia recursos ativos por REST após reconexão. Listeners e conexão são descartados ao trocar sessão ou desmontar. O indicador de tempo real expõe o estado da conexão; o diagnóstico antigo em `/system` continua funcional.

### Demonstrações da Etapa 4

Selecione o **Cenário MSW** em `/system`, ou use o console com mocks ativos. Para eventos durante checkout, mantenha a página aberta e use `await window.kurioMocks.action('price-up')`; esse controle faz POST à camada MSW e **não altera o cache do cliente**. O mock salva o estado e emite pelo transporte Socket.IO. A interface recebe pelo cliente real.

| Demonstração | Cenário / ação reproduzível |
| --- | --- |
| Confirmado / recusado | `payment-confirmed` (ou default) / `payment-refused`, depois envie o checkout |
| Pendente controlado | `order-pending`; finalize com ação `confirm-order` ou `refuse-order` |
| Timeout após criação | `timeout-after-create`; o POST demora 2,2 s e o cliente expira em 1 s; consulta recupera o mesmo pedido |
| Preço alterado | Ação `price-up` no checkout; Emerald sobe `0.1` ETH e exige revisão |
| Edição esgotada | Ação `sold-out`; zera edições de Emerald e bloqueia cotação/envio |
| Taxa ou cupom | `fee-up` acrescenta `0.001` ETH; `coupon-expired` invalida um cupom aplicado |
| Carteira recusada | Cenário `wallet-refused`, depois tente conectar |
| Desconexão/reconexão | Com pedido pendente: `disconnect`, `confirm-order`, `reconnect`; resultado é recuperado por REST, sem novo POST de compra |
| Duplicatas | `duplicate`: salva nova versão de Emerald e emite duas cópias do mesmo evento; também repete eventos dos pedidos existentes |
| Fora de ordem | `old`: emite a versão nova e depois a anterior de Emerald; também envia estado pendente antigo de pedidos terminais |
| Sessão expirada | `purchase-session-expired` expira após criar; login recupera o pedido. A ação `expire-purchase` expira sessões de demonstração explicitamente |

`price-changed`, `edition-sold-out`, `socket-disconnected`, `duplicate-event` e `old-event` também aparecem no seletor e disparam as ações correspondentes ao aplicar. O botão **Disparar ação simulada** permite controlá-las em `/system`. Para observar em tempo real no checkout, execute o comando de console naquela página: o mock vive no navegador, não é um servidor compartilhado entre abas.

Reset restaura catálogo, taxas, cupons, usuários, sessões, carrinhos, carteiras, conexões, cotações, pedidos e chaves. Cancela timers pendentes e reinicia as versões observadas/conexão do cliente. Para repetir uma demonstração, use `await window.kurioMocks.reset()`.

Controle avançado de idempotência: `window.kurioMocks.replayOrder({key,input})` reenvia via Axios uma tentativa capturada. Não substitui o fluxo de compra nem retorna fixtures. Foi usado pelos testes para verificar repetição e conflito de conteúdo pela API real da simulação.

## Cenários e reset determinístico

Abra `/system`, selecione um cenário e use **Aplicar cenário**. Isso preserva dados. **Restaurar estado inicial** limpa todos os usuários criados, sessões, alterações de perfil/senha/avatar, carteiras, favoritos e carrinhos, restaura as duas contas conhecidas e aplica o cenário escolhido. O catálogo volta à fixture conhecida, incluindo preços, disponibilidade e versões. **Expirar sessão** invalida somente a sessão atual.

Também é possível usar o console (apenas com mocks ativos):

```js
await window.kurioMocks.reset()                 // padrão, banco e cache limpos
await window.kurioMocks.scenario('slow')        // mantém dados
await window.kurioMocks.expireSession()         // invalida sessão atual
await window.kurioMocks.scenario('default')     // recuperação sem apagar dados
```

| Cenário | Comportamento reproduzível |
| --- | --- |
| `default` | Sucesso, latência 120 ms |
| `empty` | Catálogo vazio |
| `slow` | Respostas após 2 s; recarregue para ver skeletons |
| `variable` | Latência determinística de 80–1.040 ms segundo parâmetros |
| `out-of-order` | Busca curta demora mais; digite rapidamente “S” e “Emerald” para exercitar cancelamento/descarte |
| `http400` | REST de negócio retorna HTTP 400 |
| `error` | HTTP 503; feedback e nova tentativa |
| `offline` | Falha de conexão MSW; controles de recuperação continuam disponíveis |
| `expired-session` | Recursos privados rejeitam sessão com 401; aplicar após login |
| `signup-conflict` | Cadastro retorna 409 mesmo com dados novos |
| `invalid-coupon` | Cupom não vazio é rejeitado como inválido |
| `expired-coupon` | Cupom não vazio é rejeitado como expirado |
| `unavailable` | Todas as edições sem estoque; carrinho preservado e cotação rejeitada |
| `favorite-error` | Mutations de favoritos falham com 503; atualização otimista é desfeita |

Cenários especiais afetam os endpoints relevantes; `slow/error/offline` também afetam o diagnóstico/conteúdo editorial. O banco persiste o cenário escolhido. `VITE_MOCK_SCENARIO` define o cenário da **primeira inicialização**, quando ainda não há banco; depois use controles/reset. Os endpoints de controle escapam das falhas simuladas. Voltar a `default` permite recuperação por invalidação/retry sem perder dados.

## Configuração e comandos

`.env.example` documenta as variáveis públicas: `VITE_ENABLE_MOCKS` (true em development/demo), `VITE_API_BASE_URL` (/api), `VITE_SOCKET_URL` (origem atual) e `VITE_MOCK_SCENARIO` (default). Valores inválidos falham explicitamente. Nenhuma credencial real deve ser adicionada.

| Comando | Finalidade |
| --- | --- |
| `npm run dev` / `dev:nomocks` | Desenvolvimento com/sem mocks |
| `npm run typecheck` | TypeScript strict, app/config/testes |
| `npm run lint` | Oxlint, zero warnings |
| `npm run build` / `build:demo` | Build padrão / demonstração com MSW |
| `npm run preview` | Serve dist em 4173 |
| `npm run test:install` | Chromium local no projeto |
| `npm test` / `npm run test:e2e` | Suíte E2E com servidor dev automático |
| `npm run test:e2e:demo` | Mesma suíte contra build demo, preview próprio (4173 livre) |
| `npm run test:report` | Relatório HTML Playwright |
| `npm run check` | Typecheck, lint, build |
| `npm run lighthouse` | 12 medições: início/detalhe, mobile/desktop, três vezes cada |
| `npm run lighthouse:desktop` / `lighthouse:mobile` | Auditoria por perfil |

Playwright usa contextos isolados e reset conhecido, em 1440, 768 e 390 pixels. Mantém os testes anteriores de navegação, diagnóstico REST/Socket.IO e 404; acrescenta fluxos REST, conta, erros e persistência. Captura nove páginas e seis frames mobile em 414 × 896, com dados criados pelas APIs via UI, conferindo assets, overflow, erros e foco/teclado. Relatório HTML: `playwright-report/`; traces e screenshots de falha: `test-results/`; capturas: `reports/visual/`. Não execute suítes simultaneamente nesses diretórios.

## Organização e dependências

`src/app`: bootstrap/providers/router/estilos; `routes`: rotas, search e guards; `components`: UI compartilhada; `features`: catálogo/NFT/cart/auth/account/checkout/system; `lib`: Axios, Query, sessão e validação; `mocks`: fixtures, handlers, cenários e estado persistido; `realtime`: transporte Socket.IO; `types`: contratos; `tests/e2e` e `tests/helpers`: fluxos isolados e utilitários.

Stack preservada e fixada em lockfile: React 19.3.1, TypeScript 7.0.2 strict, Vite 8.3.4, TanStack Router 1.170.45 / Query 5.104.5, Axios 1.20.0, Tailwind 4.3.3, shadcn/ui local, MSW 2.15.0, Socket.IO Client 4.8.4 e binding 0.2.0, Playwright 1.64.1, Lighthouse 13.5.0, Oxlint 1.89.0. **decimal.js 10.6.0** foi acrescentada na Etapa 3; nenhuma dependência nova foi adicionada na Etapa 4.

## Registros históricos e limites

**Etapa 4 validada:** typecheck, lint e builds padrão/demo aprovados. Build demo: **85 testes aprovados, 0 falhas e 2 ignorados** em uma execução completa. Desenvolvimento: 85 casos distintos validados, com reexecução documentada de um caso de navegação; zero falhas pendentes. Os 46 anteriores foram preservados. As duas exclusões são apenas a captura específica mobile nos projetos desktop/tablet. [Relatório completo da Etapa 4](docs/STAGE4_REPORT.md) e [HTML demo](playwright-report/index.html).

Registro histórico da Etapa 3 em 20/10/2026: typecheck, lint (zero warnings), build padrão e demo aprovados; Playwright com 46 aprovados e 2 capturas ignoradas por modo. Veja [relatório da Etapa 3](docs/STAGE3_REPORT.md). A Etapa 4 acrescenta 39 execuções (13 casos × 3 viewports) e mantém as 46 anteriores; [relatório atual, verificações e arquivos alterados](docs/STAGE4_REPORT.md).

Checkout, pedidos e eventos de domínio foram acrescentados na Etapa 4; veja [arquitetura](ARCHITECTURE.md) e [contratos](docs/REST_API.md). Controles sociais, editorial, recuperação de senha e páginas fora do escopo continuam identificados sem simular sucesso.

As composições do Figma foram preservadas, com extensões necessárias para estados funcionais: busca desktop visível, filtros removíveis, favoritos, paginação mobile, mensagens de validação, forms de senha e carteira secundária. Catálogo mobile agora exibe a mesma página de resultados do desktop e o carrinho usa cotação coerente, substituindo os valores contraditórios do frame. Nenhum asset foi substituído.

Sem commit, push ou deploy. Resultados atuais, metas Lighthouse e decisão de prontidão estão no [relatório da Etapa 5](docs/STAGE5_REPORT.md). A configuração de publicação foi preparada em `vercel.json`, com build demo e fallback SPA; ainda depende de autorização e verificação remota.


## Comandos e evidências da auditoria final

`npm run test:visual` compara 16 baselines em quatro larguras; `npm run test:a11y` executa axe-core; `npm run visual:report` monta os 15 pares Figma/navegador. `npm run images:optimize` reproduz os 16 WebPs derivados dos retratos originais, que permanecem intactos. Foram acrescentadas três dependências de desenvolvimento: `@axe-core/playwright@4.14.0` para acessibilidade, `sharp@0.35.5` para derivados de imagem e `wawoff2@2.0.1` para comprimir a fonte original sem remover glifos. `npm run fonts:optimize` reproduz o WOFF2 local (TTF/OFL preservados).

[AUDIT.md](docs/AUDIT.md) documenta instalação por lockfile, execução serial das suítes, baselines por SO, revisão de diffs, os 12 relatórios Lighthouse e condições do ambiente. [VISUAL_VALIDATION.md](docs/VISUAL_VALIDATION.md) registra comparações e desvios; [COMPLIANCE_MATRIX.md](docs/COMPLIANCE_MATRIX.md) separa requisitos comprovados, parciais e pendentes. Os resultados abaixo das metas não são omitidos.
