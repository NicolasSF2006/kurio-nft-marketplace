# Contratos REST — auditoria final

Contratos da Etapa 4 preservados. Eventos completos em [SOCKET_EVENTS.md](SOCKET_EVENTS.md); execução em [AUDIT.md](AUDIT.md). Metadados estendidos vêm do DTO opcional `CatalogNft.details`: description, provenance, contract e royalties, todos strings. Rede coerente com o NFT; contrato e direitos tiveram seus valores invertidos na UI corrigidos. O campo é opcional para bancos v4 anteriores; o cliente informa ausências e usa descrição/rede recebidas, sem fabricar metadados. Reset carrega as fixtures novas.

Base configurável `VITE_API_BASE_URL` (padrão `/api`). Todas as operações do cliente usam a instância Axios em `src/lib/api.ts`, inclusive os controles de cenários. Tipos compartilhados: `src/types/api.ts` e `src/types/marketplace.ts`. Handlers de negócio: `src/mocks/handlers/rest.ts`. As respostas de autenticação nunca incluem sal ou hash.

## Identificação

O cliente envia `Authorization: Bearer <token>` quando há sessão e `X-Guest-Id: <uuid>` para identificar o carrinho do visitante. O mock valida a sessão antes de acessar recursos privados. Um token inválido nunca degrada silenciosamente uma requisição privada para visitante. Sem token, `GET /auth/session` responde `null`.

## Recursos

| Método e caminho | Entrada | Resposta |
| --- | --- | --- |
| `POST /auth/signup` | `SignupInput`: username, email, password, confirmPassword | `AuthResponse`: token opaco, user (`Profile`), expiresAt (epoch ms) |
| `POST /auth/login` | `LoginInput`: email, password | `AuthResponse`; mescla carrinho visitante e revoga token anterior do cliente |
| `GET /auth/session` | Bearer opcional | `Session` ou null; 401 se token inválido/expirado |
| `POST /auth/logout` | Bearer | `{ok:true}`; revoga token, sem apagar dados da conta |
| `GET /nfts` | q, collection, network, maxPrice, sort, page, favorites, launches | `CatalogResponse`: items, total, page, pages, pageSize, collections, networks |
| `GET /nfts/:id` | Identificador estável | `CatalogNft`, com edições e estoque |
| `GET /favorites` | Sessão obrigatória | Array de IDs |
| `POST /favorites` | `{nftId}` | Array atualizado, sem IDs duplicados |
| `DELETE /favorites/:nftId` | Sessão obrigatória | Array atualizado |
| `GET /profile` | Sessão obrigatória | `Profile` |
| `PATCH /profile` | `ProfileInput`: displayName, username, email, ens, walletNickname, avatar | `Profile` atualizado |
| `PUT /profile/password` | `PasswordInput`: currentPassword, password, confirmPassword | `{ok:true}`; revoga outras sessões da conta |
| `GET /wallets` | Sessão obrigatória | Array de `Wallet` |
| `POST /wallets` | `WalletInput` | `Wallet`, HTTP 201 |
| `PATCH /wallets/:id` | `WalletInput` | `Wallet`; só acessa carteira da própria conta |
| `GET /cart` | Sessão ou visitante | `Cart`, com itens enriquecidos, estoque atual e coupon |
| `POST /cart/items` | `AddCartInput`: nftId, edition, quantity | `Cart` atualizado, HTTP 201 |
| `PATCH /cart/items/:id` | `{quantity}` | `Cart` atualizado |
| `DELETE /cart/items/:id` | ID codificado com `encodeURIComponent` | `Cart` atualizado |
| `PUT /cart/coupon` | `{code}` | `Cart`; valida antes de persistir |
| `DELETE /cart/coupon` | — | `Cart`, coupon null |
| `POST /cart/quote` | Carrinho identificado pelos headers | `Quote`: items (`id`, total), coupon, subtotal, discount, fee, total |

`GET /health` e `GET /preview` anteriores permanecem disponíveis. `/preview` sustenta conteúdo editorial e composição visual explicitamente identificada como referência. O recibo real é consultado exclusivamente pelo pedido confirmado e seu snapshot.

## Checkout e pedidos

| Método/caminho | Contrato |
| --- | --- |
| `POST /wallet-connections` | `{walletId,network}` → `WalletConnection`, HTTP 201; valida conta, carteira e rede; pode simular recusa |
| `GET /wallet-connections/:id` | Consulta conexão pertencente à sessão atual |
| `DELETE /wallet-connections/:id` | Desconecta na simulação |
| `POST /cart/quote` | Agora retorna `Quote` com `id`, `revision`, `expiresAt`, itens e strings ETH; validade de 120 s |
| `POST /orders` | `CreateOrderInput`: quoteId, connectionId e collector; header `Idempotency-Key`; retorna `Order`, HTTP 201 ou 200 em repetição |
| `GET /orders` | Lista privada, mais recentes primeiro |
| `GET /orders/:id` | Snapshot completo, versão e estado; recurso de outra conta retorna 404 |
| `GET /orders/:id/status` | `{id,status,version}` |
| `GET /orders/by-key/:key` | Recupera pedido da tentativa na conta autenticada; 404 se não há registro |
| `POST /__mock/action` | `{action: MockAction}`; altera o banco e emite eventos, sem invalidar diretamente o cache da UI |

`src/types/orders.ts` contém Collector, CreateOrderInput, CheckoutAttempt, WalletConnection, Order, OrderLine e DTOs de eventos. Collector: displayName, username, email, ens e notes (máximo 500 caracteres); validações seguem as de perfil. A conexão é vinculada a token, usuário e snapshot da carteira; se a carteira mudar, é preciso conectar novamente.

A revisão da cotação inclui proprietário, linhas, quantidade, NFT/versão, preço, disponibilidade, cupom, sua validade e taxa. O POST final recalcula com decimal.js a partir de strings e recusa diferenças/expiração com `QUOTE_STALE` (409), sem criar pedido. Falha de estoque/cupom mantém o carrinho e exige correção antes de enviar.

### Idempotência e ciclo de vida

A identidade da tentativa é `(userId, Idempotency-Key)`. O conteúdo é serializado canonicamente com chaves ordenadas; repetir o mesmo corpo recupera o mesmo pedido, inclusive terminal. Outro conteúdo gera `IDEMPOTENCY_CONFLICT` (409). A chave é verificada antes de validar conexão/cotação antigas, permitindo recuperar um pedido existente após reconectar/autenticar. O mock relê o banco após parsing do body e faz verificação, reserva e gravação sem await intermediário, evitando duplicatas em requisições concorrentes na mesma instância.

Um usuário pode ter um pedido pendente por vez. O pedido inicia `pending`, versão 1. O desfecho ocorre após 1,2 s no cenário normal ou por ação explícita em `order-pending`. Somente `pending → confirmed/refused` é permitido; ambos são terminais. Estoque é reservado ao criar, e liberado se recusado. Ao confirmar, a transação simulada é definida e somente as quantidades compradas são subtraídas do carrinho atual; novas quantidades/linhas permanecem.

O snapshot inclui itens (nome/imagem/token/edição/quantidade/preço unitário/total), cotação, carteira e coletor. Ele nunca é recalculado a partir do catálogo. Estado, versão, motivo e referência de transação podem avançar apenas durante a resolução. GET de estado/pedido e inicialização retomam timers persistidos; uma recarga não cria pedido. Queries de pedido também fazem uma reconsulta de segurança a cada 5 s enquanto pendente, além dos eventos e reconexão.

O cliente persiste a tentativa antes do POST e usa timeout de 1 s nesse endpoint. `timeout-after-create` grava primeiro e atrasa a resposta por 2,2 s. A recuperação usa GET por chave; não faz POST automático. Se houver 404, o usuário pode reenviar a mesma chave e conteúdo. Somente um erro que comprove ausência de criação permite descartar a tentativa para revisar o checkout.

### Eventos Socket.IO

| Evento | Payload e acesso |
| --- | --- |
| cliente `session.subscribe` | `{token:string|null}`; associa conexão à sessão simulada |
| servidor `session.ready` | `{userId:string|null}`; inicia reconciliação de recursos ativos por REST |
| servidor `nft.updated` | `{eventId,resourceId,version,nft:CatalogNft}`; público, versão monotônica por NFT |
| servidor `order.updated` | `{eventId,resourceId,userId,version,order:Order}`; enviado apenas à conta dona, com sessão válida |
| servidor `session.expired` | Solicita revalidação da sessão; não carrega dados privados |
| servidor `system.ready` | Diagnóstico anterior preservado |

Transporte efetivo: `socket.io-client@4.8.4`, WebSocket, namespace `/`, MSW 2.15.0 e `@mswjs/socket.io-binding@0.2.0`. O binding codifica/decodifica pacotes Engine.IO/Socket.IO. O mock envia ping Engine.IO a cada 15 s e limpa o heartbeat ao fechar. Reconexão automática usa atraso 250–1.000 ms sem jitter. `disconnect` mantém uma interrupção controlada até `reconnect` liberar o transporte.

O consumidor verifica identidade/versão e sessão antes de aplicar eventos; eventos duplicados/antigos e regressões de estado terminal são descartados. Consultas anteriores são canceladas para não sobrescrever versões recentes. Após `session.ready`, catálogo, detalhe, carrinho, cotação e pedidos ativos são reconciliados com REST. Cleanup remove listeners e desconecta a instância; eventos da conta anterior não atualizam a atual.

As ações e cenários reproduzíveis estão no README. Eles usam o mesmo banco local dos handlers e chamam `client.emit` do binding; somente o listener do cliente Socket.IO reage na UI. Não há caminho paralelo para eventos por setters/cache. Dados e timers são locais ao contexto do navegador; não é um servidor Socket.IO multiaba, e não implementa polling, outros namespaces, salas ou acknowledgements.

## Listagem

Página de 9 itens; 36 NFTs com os quatro retratos originais do Figma, organizados em séries, nove coleções e três redes. Busca ignora caixa e consulta nome/descrição. `collection` e `network` usam igualdade; `maxPrice` aceita string decimal não negativa. Filtros são combinados com AND. `sort`: recent (ordem determinística da fixture), price-asc, price-desc ou popular. `launches=true` limita à série mais nova; `favorites=true` exige sessão. Filtros e ordenação reiniciam a página na interface. Os parâmetros normalizados compõem a chave Query e a URL; defaults são omitidos da URL pelo Router.

`CatalogNft` acrescenta collection, network, popularity e `editions: {id, stock}[]` ao contrato visual `Nft`. A edição `1/1` está esgotada na fixture inicial para permitir avaliação; as outras têm limites explícitos. Identificador inexistente retorna 404; quantidade não inteira/positiva retorna 422 e acima do estoque retorna 409.

## Conta e carteiras

Username: 3–30 letras/números/underscore/hífen; e-mail válido e único; senha mínima de 8 caracteres, confirmação obrigatória; displayName até 80 caracteres. Avatar: data URL de PNG, JPEG ou WebP até 500 KB, selecionado no formulário e enviado ao salvar perfil. Não são aceitos SVGs ou URLs arbitrárias de avatar. ENS é opcional, com validação de formato. Campos opcionais não são marcados como obrigatórios para reproduzir uma exigência visual sem necessidade funcional.

Uma carteira principal e uma secundária por conta. Campos: role (`primary`/`secondary`), name, network (`Ethereum`/`Polygon`/`Solana`), address, provider (`MetaMask`/`WalletConnect`/`Coinbase`), displayName, email, ens, referral. Endereços Ethereum/Polygon exigem 0x + 40 hexadecimais; Solana exige 32–44 caracteres Base58. A validação é sintática: nenhuma consulta a blockchain ou verificação de propriedade. Duplicidade de função/endereço retorna 409. Uma alteração de função não é exposta na UI; os dois formulários têm funções fixas.

## Carrinho e valores

Identidade de linha: `nftId::edition`. Adições acumulam quantidade na mesma linha; a API rejeita soma acima do estoque. Na mesclagem do login, linhas iguais são somadas e limitadas ao estoque, indisponíveis são descartadas e o carrinho visitante é consumido uma vez. O cupom da conta prevalece se já existir; caso contrário, mantém-se o do visitante. Sair da conta cria uma visão visitante vazia e conserva o carrinho privado para o próximo login.

Todos os valores ETH de transporte são strings decimais. Apenas o mock de cotação executa cálculos, com **decimal.js 10.6.0**, a partir de strings; não há aritmética de ETH com Number na interface. Subtotal = soma(preço × quantidade); `KURIO10` desconta 10%; taxa = `0.016` ETH para carrinho não vazio e zero para vazio; total = subtotal − desconto + taxa. Exemplo: 2 × `1.19`, desconto `0.238`, taxa `0.016`, total `2.158`. Desktop e mobile mostram a mesma resposta. `EXPIRADO` retorna cupom expirado; outros códigos retornam inválido. Remover cupom permite recuperar uma cotação que tenha passado a rejeitá-lo.

## Erros

```json
{"code":"VALIDATION","message":"Revise os campos indicados.","fields":{"email":"Informe um e-mail válido."}}
```

400: entrada/requisição inválida; 401: sessão ausente, inválida, expirada ou credenciais incorretas; 404: recurso inexistente; 409: conta/carteira duplicada ou estoque insuficiente; 422: validação/cupom; 503: indisponibilidade transitória. Falha offline é erro de conexão MSW, não resposta HTTP fabricada. A UI associa erros de campos a inputs, anuncia feedback e permite nova tentativa.

## Controles MSW

Somente com mocks ativados, após o bootstrap:

| Método/caminho | Entrada | Efeito |
| --- | --- | --- |
| `POST /__mock/reset` | `{scenario?: ScenarioName}` | Restaura integralmente o banco conhecido |
| `POST /__mock/scenario` | `{name: ScenarioName}` | Troca comportamento de rede mantendo dados |
| `POST /__mock/expire-session` | Bearer atual | Marca a sessão atual como expirada |

Use `/system` para os controles visuais ou `window.kurioMocks` (README). O wrapper de reset também cancela/limpa o cache e o token do cliente. Os controles permanecem disponíveis em cenários offline/erro. Não são um backend real nem devem fazer parte de um serviço de produção.
