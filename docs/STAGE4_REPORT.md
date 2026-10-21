# Entrega — Etapa 4

## Checkout implementado

Coletor validado pela API, seleção de carteira cadastrada/rede, conexão/desconexão e recusa simuladas, revisão de itens e cotação decimal. Alterações de preço, estoque, cupom ou taxa bloqueiam confirmação até revisão; a API revalida o conteúdo e a validade antes de criar. Falhas/recusas preservam itens. Estoque é reservado no pedido pendente e liberado na recusa; confirmação desconta somente quantidades compradas do carrinho atual, conservando adições posteriores.

O recibo usa snapshot imutável de itens, preços, descontos, taxa, carteira e coletor. Somente `confirmed` apresenta sucesso em `/orders/:id`; `pending` e `refused` têm estados próprios. A referência em `/order-preview` permanece identificada como prévia e perdeu o título de compra concluída. Não há pagamento ou blockchain real.

## Contratos e endpoints

Tipos em `src/types/orders.ts` e `src/types/api.ts`. Recursos novos: `POST /wallet-connections`, `GET/DELETE /wallet-connections/:id`, `POST/GET /orders`, `GET /orders/:id`, `GET /orders/:id/status`, `GET /orders/by-key/:key` e `POST /__mock/action`. Cotação agora inclui id, revisão e validade. Contratos detalhados em [REST_API.md](REST_API.md).

Todas as chamadas passam pelo Axios e os fluxos de consulta/mutation usam TanStack Query; os testes de reenvio também passam pelo cliente Axios/MSW, sem interceptações Playwright que fabriquem respostas.

## Socket.IO efetivamente usado

`socket.io-client@4.8.4` → WebSocket/Engine.IO/Socket.IO → MSW 2.15.0 + `@mswjs/socket.io-binding@0.2.0`, namespace `/`. Eventos versionados `nft.updated` e `order.updated`, com identidade do recurso, eventId e payload atualizado. Sessão é associada por `session.subscribe`; emissão privada é filtrada no mock e novamente no cliente. Diagnóstico `system.ready` anterior preservado.

Mocks persistem o novo estado antes de emitir pelo binding. O controle de ação só faz REST e não altera cache/setters da UI; o consumidor recebe os eventos pelo socket real e então atualiza/invalida recursos. Testes observam os contadores de recebimento mantidos pelos listeners e os resultados na interface. Heartbeat Engine.IO de 15 s e cleanup de peers/timers foram acrescentados.

## Idempotência e recuperação

Uma chave persistida por usuário é criada antes do POST. O mock compara o corpo canônico: mesma chave/conteúdo retorna o mesmo pedido; outro conteúdo retorna 409. Não há retry automático de criação. Após timeout, refresh ou expiração, GET por chave recupera a compra; se não houver registro, a UI permite reenviar a mesma tentativa. Estados terminais não regridem.

Reconexão automática usa 250–1.000 ms, sem jitter. `session.ready` reconcilia recursos ativos com REST, incluindo pedidos pendentes. Versões duplicadas/antigas e regressão de terminal são ignoradas; consultas anteriores são canceladas. Conexão/listeners são descartados ao trocar sessão/desmontar. Reset reinicia também o socket e o histórico de versões, inclusive sem trocar o visitante.

## Cenários reproduzíveis

Use os seletores de cenário/ação em `/system` ou os comandos de console documentados no [README](../README.md). Há confirmado, recusado, pendente controlado, timeout depois da criação, aumento de preço/taxa, cupom expirado, estoque zerado, recusa de carteira, desconexão/reconexão, duplicatas, eventos antigos e sessão expirada durante a compra. Alterações usam a mesma fonte dos handlers REST e eventos. `order-pending` + `confirm-order/refuse-order` controla deterministicamente o resultado; `disconnect` bloqueia até `reconnect`.

## Testes preservados e acrescentados

Os 46 testes aplicáveis da etapa anterior foram mantidos. Assertions de confirmação pendente foram adaptadas ao checkout funcional: sem carteira, confirmar fica desabilitado. A referência visual tem título de prévia; sucesso real é validado pelos novos testes. Nenhum teste foi removido para obter aprovação.

13 testes novos são executados nos três projetos (39 execuções adicionais):

1. Compra completa e recibo com `order.updated` recebido.
2. Recusa terminal e preservação do carrinho.
3. Cliques repetidos, reenvio do mesmo pedido e conflito de conteúdo.
4. Timeout com uma única chave/compra.
5. Edição esgotada por Socket.IO bloqueia envio.
6. Duplicatas e eventos antigos não revertem recurso/recibo.
7. Rede da carteira, recusa, desconexão e validação do coletor.
8. Sessão expirada após criação retoma o pedido ao entrar.
9. Troca de conta, cleanup de subscriptions e 404 para pedido alheio.
10. Confirmação conserva quantidades adicionadas depois do envio.
11. Revalidação de taxa/cupom.
12. `nft.updated` exige revisão explícita do novo preço.
13. Pedido pendente sobrevive a refresh e confirma durante interrupção; reconexão recupera sem criar outro.

O teste de reset anterior foi ampliado para verificar um novo evento após restaurar estado e navegar por SPA, cobrindo limpeza das versões observadas. Capturas de checkout conectado e recibo confirmado são geradas, além das capturas anteriores; verificam também ausência de overflow.

## Arquivos principais criados/modificados

| Camada | Arquivos |
| --- | --- |
| Contratos | `src/types/orders.ts`, `api.ts`, `system.ts` |
| Mocks | `src/mocks/purchases.ts`, `events.ts`, `http.ts`, `state.ts`, `fixtures/catalog.ts`, `handlers/rest.ts`, `handlers/realtime.ts` |
| Socket.IO | `src/realtime/client.ts`, `domain-sync.tsx` |
| Checkout/pedidos | `src/features/checkout/checkout-page.tsx`, `collector-fields.tsx`, `order-page.tsx`, `queries.ts`, `receipt-page.tsx` |
| Integração | `src/features/marketplace/api.ts`, `src/lib/checkout-attempt.ts`, `src/app/bootstrap.ts`, `src/routes/marketplace.ts`, `src/components/app-shell.tsx` |
| Sessão/conta/controles | `src/features/auth/session-boundary.tsx`, `account/account-pages.tsx`, `system/mock-controls.tsx`, `src/components/marketplace/forms.tsx` |
| Estilos | `src/app/checkout.css`, `styles.css` |
| Testes | `tests/e2e/checkout.spec.ts`, `interface.spec.ts`, `session-recovery.spec.ts`, `tests/helpers/checkout.ts` |
| Documentação | `README.md`, `ARCHITECTURE.md`, `docs/REST_API.md`, este relatório |

## Verificações executadas

Typecheck, lint (zero warnings), build padrão e build demo aprovados. Nenhuma dependência nova foi necessária. Chromium, viewports 1440 × 900, 768 × 1024 e 390 × 844, mais as seis capturas mobile em 414 × 896.

Em desenvolvimento, a execução completa teve **84 aprovados, 1 falha de navegação e 2 ignorados**. O Chromium retornou `ERR_NETWORK_IO_SUSPENDED` ao fazer navegação completa para `/system`. O teste foi ajustado para navegar por links da SPA, usando o link de retorno apropriado em cada viewport; os **3 casos de reset (desktop/tablet/mobile) passaram na reexecução**. Com os demais casos já aprovados, os **85 casos aplicáveis estão validados e não há falhas pendentes**. Não foi alterada a aplicação para mascarar o erro, nem removida cobertura.

O relatório inicial e seu trace foram preservados em [desenvolvimento — execução completa](../reports/playwright-stage4-development-initial/index.html); a [reexecução dos casos ajustados](../reports/playwright-stage4-development-rerun/index.html) foi salva separadamente. O relatório do build demo é gerado em `playwright-report/index.html`.

Resultado final do **build demo**: `npm run test:e2e:demo` executou os 87 casos, com **85 aprovados, 0 falhas e 2 ignorados**, em 4,8 min. [Relatório HTML completo](../playwright-report/index.html). A execução inclui todos os 46 testes anteriores aplicáveis e as 39 execuções novas; não houve reexecução ou retry nessa suíte demo. Typecheck, lint e ambos os builds foram aprovados. Data: 20/10/2026; ambiente Windows, Node 24.11.0, npm 11.6.1 e Playwright/Chromium 1.64.1.

| Verificação | Resultado final |
| --- | --- |
| Typecheck | Aprovado |
| Lint | Aprovado, zero warnings |
| Build padrão | Aprovado |
| Build demo | Aprovado |
| Desenvolvimento | 85 casos distintos validados, com reexecução documentada do caso ajustado; 0 falhas pendentes; 2 ignorados |
| Build demo | 85 aprovados, 0 falhas, 2 ignorados, execução completa |

As duas execuções ignoradas são exatamente o teste **“captura os seis frames mobile em 414 × 896 para comparação com o Figma”** nos projetos `chromium-desktop` e `chromium-tablet`. Ele é exclusivo de `chromium-mobile`, onde é executado. Nenhum teste de fluxo funcional foi ignorado.

Capturas funcionais: `reports/visual/<projeto>/checkout-connected.png` e `order-confirmed.png`, além das nove páginas anteriores. Foram examinados os dois fluxos em mobile; os testes verificam ausência de overflow e recebimento real dos eventos. O relatório inicial registra a falha histórica; a reexecução documenta sua resolução.

## Limitações

Simulação local ao navegador, sem backend compartilhado entre abas e sem garantias de concorrência/segurança de produção. O binding suporta este fluxo com WebSocket/namespace padrão; não há polling, salas, outros namespaces, binary payloads ou acknowledgements de domínio. Endereços são validados sintaticamente, sem consulta blockchain. A referência da transação é simulada.

Os assets/tokens/estilos do Figma anteriores foram reutilizados; não houve nova consulta MCP nem declaração de fidelidade perfeita. Foram acrescentados apenas estados e controles necessários. Lighthouse final, baselines aprovadas e publicação ficam fora desta etapa. Nenhuma dependência foi adicionada; não houve commit, push ou deploy.
