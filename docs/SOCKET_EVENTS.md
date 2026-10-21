# Eventos Socket.IO

Tipos em `src/types/{system,orders}.ts`; transporte em `src/realtime/client.ts`; consumidor em `domain-sync.tsx`; emissão em `src/mocks/{events,purchases}.ts` e `handlers/realtime.ts`.

| Direção/evento | Payload | Regra |
| --- | --- | --- |
| cliente → `session.subscribe` | `{token:string|null}` | Após cada conexão/reconexão; token validado no mock |
| servidor → `session.ready` | `{userId:string|null}` | Confere identidade e reconcilia recursos ativos com REST |
| servidor → `system.ready` | `{status:'ok',transport:'socket.io'}` | Diagnóstico anterior preservado em `/system` |
| servidor → `session.expired` | Sem dados privados | Revalida sessão, limpa cache e preserva destino |
| servidor → `nft.updated` | `{eventId,resourceId,version,nft:CatalogNft}` | Público; preço/disponibilidade e invalidação de catálogo/carrinho/cotação |
| servidor → `order.updated` | `{eventId,resourceId,userId,version,order:Order}` | Somente dono com sessão válida; estado do pedido e carrinho quando terminal |

UUID `eventId` é estável por emissão. A versão inteira cresce por recurso e deve coincidir com o DTO. O cliente combina a maior versão observada com as versões em cache; rejeita versões iguais/menores, inclusive eventos antigos com outro UUID. Estados `confirmed/refused` são terminais, também na reconciliação REST (`structuralSharing`).

O banco é salvo antes de emitir. O controle `window.kurioMocks.action` somente faz POST via Axios; o handler altera o estado e usa `client.emit` do binding. Nenhum controle chama setters ou cache da UI. Somente os listeners do cliente real reagem aos pacotes. Os testes verificam os contadores desses listeners e o resultado visível.

Eventos privados são filtrados no emissor e no consumidor por sessão/dono. Listeners assíncronos conferem novamente a identidade após cancelamentos. Após `session.ready`, queries ativas de catálogo, detalhe, carrinho, cotação e pedidos são canceladas/invalidadas para recuperar eventos perdidos. Pedidos pendentes também reconsultam em 5 s, complementando o socket. Inicialização/GET retomam os timers persistidos sem criar outra compra.

Cleanup executa `removeAllListeners()` e `disconnect()`. Trocar sessão substitui a instância; reset reinicia também os mapas de versão. `.realtime-status` usa `aria-live`; atributos `data-nft-events`, `data-order-events`, `data-ignored-events` e `data-reconciliations` apenas observam execução dos listeners. Avisos de catálogo não cobrem páginas de pedido/recibo.

## Transporte e limites

Socket.IO Client 4.8.4, namespace `/`, somente WebSocket, `autoConnect:false`, `forceNew:true`, timeout 10 s, reconexão ilimitada com atraso 250–1.000 ms e sem jitter. MSW 2.15.0 e binding 0.2.0 fazem handshake/serialização Engine.IO/Socket.IO. Ping Engine.IO a cada 15 s, limpo ao fechar.

MSW normaliza o caminho do transporte para `/` no matching; por isso `ws.link` usa a raiz, preservando o cliente Socket.IO padrão. O Router/cliente só são avaliados após iniciar o worker, evitando capturar WebSocket nativo anterior à interceptação.

Simulação local ao contexto do navegador, sem servidor multiaba/multidispositivo, polling, salas, payloads binários, outros namespaces ou acknowledgements de domínio. Não oferece transações/segurança de produção.

## Reproduzir

Credenciais/carteira/cenários no [README](../README.md). No checkout, `await window.kurioMocks.action('price-up')` acrescenta `0.1` ETH a Emerald e exige revisão. `sold-out`, `fee-up` e `coupon-expired` exercitam outras invalidações. `duplicate` repete; `old` emite novo seguido do antigo. Com `order-pending`: `disconnect`, `confirm-order`, `reconnect` recuperam a mesma compra; `refuse-order` preserva itens.

Evidência: `checkout.spec.ts`, diagnóstico em `navigation.spec.ts`, reset/troca de conta em `session-recovery.spec.ts`, expiração da cotação em `integrity.spec.ts`. Não há interceptações Playwright fabricando mensagens Socket.IO.
