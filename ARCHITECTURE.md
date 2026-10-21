# Arquitetura — Kurio

## Estado atual: Etapa 5 — auditoria final

A estrutura por features, contratos, sessão, idempotência e integrações foram preservados. Matriz/resultados em [COMPLIANCE_MATRIX](docs/COMPLIANCE_MATRIX.md) e [STAGE5_REPORT](docs/STAGE5_REPORT.md); reprodução em [AUDIT](docs/AUDIT.md). As seções anteriores abaixo são históricas.

Corrigiram-se o `clip-path` residual que escondia a busca desktop, CSS que ocultava cinco dos nove resultados mobile, semântica ARIA de estrelas/contador, alinhamento do hero, posição dos diálogos desktop, favoritos mobile e avisos desatualizados. Capturas agora aguardam conteúdo pronto. Metadados do NFT vêm do DTO/fixture, com rede coerente e contrato/direitos corretamente associados. O explorador do recibo é explicitamente simulado; avisos de catálogo não cobrem pedidos.

O bootstrap carrega módulos independentes em paralelo, ainda aguardando o worker antes do Router/Socket.IO. Conta, autenticação, carrinho, pedidos e diagnóstico usam `lazyRouteComponent`, sem alterar guards. Início/detalhe permanecem no bundle de rotas principal. Fonte local com preload; nenhuma função é desligada na auditoria.

`Artwork` mantém PNG original como fallback e oferece `srcset` WebP 320/640/960/1254 para os quatro retratos conhecidos. Não muda a ilustração/SVGs. Os 137 originais permanecem intactos; 16 derivados somam 1.285.574 bytes. Proveniência e SHA-256 em `docs/optimized-assets.json`, geração por sharp 0.35.5 (`npm run images:optimize`). SVGs mantêm exports e dimensões intrínsecas. Há diferenças de codificação/rasterização; não se declara equivalência pixel a pixel.

Baselines fonte em `tests/baselines/win32/`, sem atualização implícita. A revisão inicial detectou diferenças reais e preservou diffs/traces antes da aprovação explícita das correções. Os 15 exports novos MCP em `docs/figma/` são evidências, não assets da UI. Axe, teclado, texto 200% e redução de movimento complementam as capturas; não equivalem a certificação por leitor de tela/zoom de todos os navegadores.

`vercel.json` prepara build demo, fallback SPA, assets imutáveis, worker sem cache persistente e headers básicos. Sem deploy: URL pública, HTTPS e fallback/headers remotos ainda não foram comprovados. O build padrão é sem mocks por padrão; a publicação de avaliação deve usar demo.

Política preservada: staleTime 30 s/gcTime 5 min, sessão/carrinho/cotação stale 0; um retry em consultas de rede/5xx, nenhum em 4xx/mutations. Cache por identidade, cancelamento e reconciliação; tentativa idempotente persistida por usuário para recuperação. Logout limpa token/cache/subscriptions, conservando dados da conta e tentativa incerta na simulação; reset apaga também tentativas. O banco local não é uma fronteira de segurança real entre pessoas que compartilham um perfil de navegador.

Desvios do Figma: totais únicos corretos da API, busca/filtros/ordenação/paginação/favoritos utilizáveis, edições esgotadas, revisão e estados de compra, carteiras cadastradas em vez de opções decorativas, dados e recibos dinâmicos. Esses controles acrescentam espaço/rolagem. Conta/recibo mobile são adaptações sem frames específicos. Persistem diferenças de alinhamento/rasterização, registradas como fidelidade parcial.

Lighthouse mede a entrega integral. JavaScript HTTP Kaspersky injetado externamente é registrado, sem alterar o sistema/antivírus, bloquear origens ou desativar auditorias. As metas não atendidas permanecem explícitas e são distinguidas do custo de inicialização SPA/MSW. Sem commit, push ou deploy.

## Registro da Etapa 4 (histórico)

Checkout, pedidos e tempo real foram conectados à infraestrutura existente. Sem dependências novas: decimal.js, Axios, Query, Router, MSW e o binding Socket.IO já estavam instalados. Contratos adicionais em `types/orders.ts`; domínio simulado em `mocks/purchases.ts`; emissão em `mocks/events.ts`; recepção e reconciliação em `realtime/domain-sync.tsx`. A estrutura anterior de features, componentes e estilos foi preservada.

### Compra e consistência

O checkout usa perfil e carteiras cadastradas. Conexão/desconexão da carteira são recursos REST vinculados ao token, usuário, rede e snapshot da carteira; não há extensão ou blockchain real. Dados do colecionador são validados pela API. Desktop e mobile compartilham estado, cotação e submits; o mobile mantém cards de carteira e oferece os dados do coletor em um bloco expansível.

`Quote` acrescenta identidade, revisão de conteúdo e validade de 120 s. O cálculo usa exclusivamente decimal.js com strings. Preço, estoque, quantidade, cupom e taxa entram na revisão. Quando a query muda, a cotação anterior só permanece como placeholder da mesma identidade enquanto a nova carrega; o formulário não é remontado e a confirmação fica bloqueada durante a atualização. Revisão diferente exige ação explícita e nova confirmação. O POST final revalida tudo, cobrindo uma alteração entre a última renderização e o envio.

Uma tentativa `{key,input}` é persistida por usuário antes do POST, em `kurio.checkout.attempt.<userId>`. A mutation de criação não tem retry automático. Resultado incerto abre recuperação por GET da chave, inclusive após refresh/login. Somente 404 permite oferecer reenvio da mesma tentativa; um erro que comprove ausência de criação permite voltar à revisão. A chave e o corpo não são trocados automaticamente após timeout.

O mock registra idempotência por usuário e representação canônica do corpo, com parsing seguido de releitura do banco e gravação sem await intermediário. Uma chave repetida recupera o pedido existente; conteúdo diferente conflita. Um pedido pendente por conta evita nova compra concorrente pelo fluxo de UI. O estoque é reservado na criação; recusa libera reserva e preserva carrinho. Confirmação remove somente as quantidades compradas do carrinho atual. O snapshot de itens, preço, descontos, taxa, carteira e coletor é imutável; apenas estado, versão e resultado avançam. Estados terminais não regridem.

### Socket.IO e ciclo de vida

Há uma instância de domínio com `forceNew`, namespace `/`, transporte WebSocket e `socket.io-client` 4.8.4. MSW 2.15.0 e binding 0.2.0 fazem handshake e codificação Engine.IO/Socket.IO. O mock envia ping a cada 15 s. O diagnóstico anterior usa uma conexão separada, preservada. Não foi criado backend real nem um substituto de socket por setters/callbacks de UI.

O cliente envia `session.subscribe` com seu token. A camada de mocks valida sessão ao enviar cada evento privado; `order.updated` só chega à conta dona. O cliente também confere identidade, token, recurso e versão antes de aceitar qualquer atualização. `nft.updated` atualiza o recurso e invalida consultas de catálogo/carrinho/cotação após cancelar respostas anteriores. `order.updated` atualiza o pedido e invalida lista/carrinho quando terminal. O cache e mapas de versão descartam duplicatas, versões anteriores e regressão de estado terminal.

Após `session.ready`, os recursos ativos são reconciliados com REST. A reconexão tem atraso de 250 a 1.000 ms sem jitter; listeners e socket são liberados ao desmontar/trocar sessão. Pedido pendente também tem reconsulta de segurança em 5 s. Timers e desfechos persistidos são retomados ao inicializar e consultar pedidos, sem criar outra compra. Reset cancela timers, limpa pedidos/chaves/conexões e reinicia a conexão e os mapas de versão do cliente, mesmo para um visitante que continue na mesma página.

### Cenários, UI e limites

As ações em `/system` ou `window.kurioMocks.action` chamam um endpoint Axios/MSW. A camada de mocks altera o mesmo banco que responde ao REST e emite `nft.updated/order.updated` pelo binding; não modifica diretamente o cache da UI. Os testes observam recebimento pelo cliente Socket.IO e resultado na interface. `order-pending` e ações explícitas controlam a resolução sem depender de esperas longas; cenários de duplicatas/ordem de eventos são síncronos e reproduzíveis. Os cenários e instruções estão no README.

O banco mantém a chave histórica `kurio.mock.database.v3` e migra o schema para versão 4, preservando dados da Etapa 3. Inclui catálogo mutável/versionado, cotações, pedidos, idempotência, conexões, taxas e flags de cenários. Como na etapa anterior, é um simulador local de navegador; não oferece transações entre abas, servidor compartilhado, segurança de produção, polling Socket.IO, outros namespaces, salas ou acknowledgements. A interrupção controlada bloqueia o transporte até ação de reconexão.

O recibo funcional em `/orders/:id` reproduz os estilos/assets de confirmação; o título de sucesso só aparece após `confirmed`. `/order-preview` permanece como referência explicitamente identificada e sem título de compra concluída. Foram acrescentados estados pendente/recusado, feedback de rede, revisão de valores e links de recuperação, sem substituir os assets. Não houve nova consulta ao Figma MCP; não se declara equivalência pixel a pixel. Lighthouse final, baselines visuais aprovadas e deploy ficam fora desta etapa. Nenhum commit, push ou deploy.

## Registro da Etapa 3 (histórico)

Os recursos REST de catálogo, conta, favoritos e carrinho agora participam efetivamente da interface. Contratos em `src/types/api.ts`; consultas/mutations em `features/marketplace/api.ts`; autenticação/guards em `features/auth/session.ts`; validação de URL em `lib/catalog-search.ts`; simulação exclusivamente em `mocks/handlers/rest.ts`, `mocks/state.ts` e fixtures. Veja [contratos e validações](docs/REST_API.md) e [execução, credenciais e cenários](README.md).

### Estado e transporte

- Axios central inclui token e ID visitante; cada query recebe AbortSignal. Componentes/hooks não importam fixtures. A API valida permissões e disponibilidade; o cliente apresenta respostas e feedback.
- Query keys: `catalog + parâmetros + identidade quando favoritos`, `nft + id`, `private + userId + recurso`, `cart + identidade`, `quote + identidade + snapshot do carrinho`. Assim uma resposta antiga não substitui outra pesquisa/conta. Consultas inativas são abortadas. Mutations verificam a identidade antes de repovoar caches.
- Política geral preservada: staleTime 30 s, gcTime 5 min, refetch ao recuperar foco/conexão, uma repetição para rede/5xx e nenhuma para 4xx. Sessão, carrinho e cotação têm staleTime 0; sessão também verifica em 15 s. Mutations sem retry automático. Adicionar ao carrinho desabilita cliques enquanto a operação estiver pendente.
- Mutations de carrinho atualizam sua resposta no cache e invalidam cotação; mutação de perfil atualiza perfil e sessão; carteiras invalidam a lista privada. Favoritos usam snapshot otimista, cancelamento da consulta concorrente, rollback em falha e invalidação de favoritos/listagens privadas. Alterações concorrentes de favoritos ficam desabilitadas durante a mutation para não corromper rollback.
- Sessão opaca de 30 min, guard via API antes de páginas privadas, destino local validado e restaurado após autenticação. 401, prazo local e reconsulta tratam expiração. Logout/troca/expiração cancelam consultas e removem queries privadas, carrinhos/cotações e mutation cache. Mudanças do token entre abas revalidam a sessão.

### Persistência e simulação

O banco de mocks fica em uma chave localStorage versionada e é lido a cada operação; mutações salvam somente após validação. Dois usuários iniciais têm senha fictícia derivada com PBKDF2/SHA-256, sal e 120.000 iterações. Cadastro e troca de senha persistem hash, nunca senha em claro. Token e UUID visitante ficam em chaves do cliente, sem fixture ou fallback de negócio no Axios.

O carrinho da conta é separado do visitante. Login mescla por NFT/edição, soma limitada ao estoque, consome a origem e mantém cupom da conta se já houver. Logout não remove dados persistidos da conta. O reset limpa banco e cliente, restaura duas contas conhecidas e mantém catálogo determinístico. Controles ficam em `/system` e `window.kurioMocks`, somente nos modos com mocks ativos. O build demo aguarda o worker antes de iniciar o Router, como anteriormente.

Somente a cotação simulada calcula valores ETH, com decimal.js a partir de strings. A interface não recalcula nem soma preços em ponto flutuante. Estoque é validado em adição/edição/cotação; indisponibilidade preserva os itens e oferece remoção/retry. Alterações dinâmicas e eventos Socket.IO serão implementados na próxima etapa.

### Preservação visual e limites

Foram mantidos a árvore de features, tokens, fonte, assets, componentes shadcn/Radix e composições anteriores. `app/functionality.css` acrescenta estados funcionais sem reescrever o CSS do Figma. Busca desktop e paginação mobile ficam visíveis para permitir uso; filtros podem ser desmarcados; favoritos são acionáveis; erros/sucesso e formulário de carteira secundária ocupam espaço quando necessários. Perfil e senha têm submits separados para evitar salvamento parcial ambíguo.

Desktop/mobile agora compartilham o carrinho real e a mesma cotação; as fixtures contraditórias de totais do Figma ficam restritas à prévia explicitamente identificada de recibo. Os quatro retratos originais são reutilizados nas séries adicionais para exercitar paginação, sem criar imagens substitutas. Ainda não são baselines aprovadas nem equivalência pixel a pixel.

O armazenamento no navegador é um simulador local, não um servidor multiusuário seguro: um usuário com acesso às ferramentas do navegador pode inspecionar seu banco e tokens de demonstração. Não há garantias de transação/concorrência entre múltiplas abas iguais às de um banco real. Endereços de carteiras têm validação sintática, sem verificação de propriedade/checksum on-chain. Avatar é limitado a 500 KB para compatibilidade com a persistência local. Checkout protegido revisa dados reais; conexão de carteiras, pedidos, idempotência, pagamentos e eventos de domínio seguem pendentes. Nenhuma assinatura de sessão de domínio foi criada; o Socket.IO anterior mantém apenas diagnóstico.

## Registro da Etapa 2 (histórico)

A infraestrutura da Etapa 1 foi preservada: React/TypeScript strict/Vite, TanStack Router/Query, Axios, MSW, Socket.IO, Playwright, Lighthouse e comandos existentes. A árvore de rotas foi ampliada por código, sem migrar o projeto ou introduzir bibliotecas de negócio.

As nove páginas desktop e seis composições mobile específicas foram implementadas. Perfil, carteiras e recibo também se adaptam a 390 e 768 pixels. As contas são prévias de formulário, sem sessão ou autorização fictícias. O recibo usa a rota explícita `/order-preview`, possui aviso de prévia e não é apresentado como resultado do botão de compra.

### Componentes e apresentação

`components/marketplace` contém header, navegação mobile, footer, breadcrumbs, estados de rede, avisos de pendência, campos, quantidade, cards, coleção relacionada e resumos. `features/catalog`, `nft`, `cart`, `checkout`, `auth` e `account` compõem essas peças. `WalletFields` é compartilhado entre carteiras e checkout. Button/Skeleton foram preservados; Input/Textarea foram acrescentados pelo CLI shadcn 4.22.1. Galeria ampliada, filtros mobile e autenticação usam os primitivos Dialog do Radix já instalado, com controle de foco e Escape.

Roboto Mono foi confirmada por `get_variable_defs` e é servida localmente, com licença OFL. Cores, proporções e espaçamentos vêm dos contextos dos 15 frames. `app/marketplace.css` organiza regras de composição e adaptações, sobre os tokens e o Tailwind existentes. Suas regras específicas de componente são aplicadas depois dos estilos utilitários padrão dos componentes para preservar as dimensões do design.

### Dados e ações pendentes

Novo contrato de apresentação: `GET /api/preview`, via Axios e TanStack Query, responde `MarketplacePreview`. As fixtures estão exclusivamente em `mocks/fixtures/marketplace.ts`; handlers, cenários e tipos ficam em suas camadas existentes. O endpoint reutiliza os cenários de latência, 503 e falha de conexão, e os consumidores mostram skeletons/feedback de erro. A query é cancelável e segue a política de cache da Etapa 1.

Esse endpoint não cria sessão, carrinho ou pedido. Os formulários são editáveis, mas os botões de autenticação, salvamento e compra apresentam um aviso de pendência. Quantidade/edição no detalhe e escolhas de carteira são estados de apresentação. Nenhum setter local substitui eventos Socket.IO; a integração de diagnóstico anterior continua intacta.

A busca e a ordenação da prévia trabalham sobre os dados recebidos pelo endpoint. Não representam ainda a implementação final de parâmetros de URL, filtros combinados, paginação e cancelamento entre pesquisas remotas. Valores ETH são strings de referência e não são somados na interface.

### Decisões e diferenças intencionais

- Desktop e mobile possuem carrinhos e resumos diferentes no Figma. Foram preservadas fixtures de apresentação separadas. O subtotal mobile desenhado é `8.92`, embora os quatro totais de linha somem `8.14`. Esse valor serve apenas para reproduzir o frame; a próxima etapa precisa de uma cotação única e coerente da API.
- Os fundos de login/cadastro apresentam imagens associadas a títulos diferentes dos cards da página inicial. A fixture conserva essa disposição visual sem modificar os arquivos de imagem.
- A prévia de recibo inclui um aviso explícito e texto que informa que não houve transação. O link de exploração é pendente. Isso altera a copy do estado final para evitar representar uma compra como concluída.
- Avisos de prévia e links para diagnóstico/recibo foram acrescentados fora dos blocos principais do layout. Conteúdo editorial e social fora do escopo informa essa limitação quando acionado.
- Os frames mobile medem 414 × 896; a aplicação também foi adaptada para 390 e 768 pixels. Não reproduz molduras de dispositivo, não corta conteúdo na altura do frame e permite rolagem quando necessário.
- O plano Starter do Figma atingiu o limite durante exportações adicionais. Os 15 contextos completos e seus screenshots já haviam sido obtidos. Para algumas referências foram usados os screenshots incluídos nesses contextos, sem inventar detalhes ou substituir retratos.

### Validação visual e limitações

As capturas do navegador foram examinadas junto às referências. Corrigiram-se dimensões sobrescritas pelos estilos padrão do shadcn, posição dos formulários mobile, orientação das setas, carregamento de imagens nas capturas, quantidade de texto do detalhe mobile e fundos decorativos. O registro por frame está em `docs/VISUAL_VALIDATION.md`.

Ainda há diferenças de alguns alinhamentos/ícones e renderização tipográfica entre navegador e Figma, além dos avisos intencionais da prévia. Não se declara equivalência pixel a pixel. Os screenshots atuais são evidências de comparação, não baselines de regressão aprovadas.

## Registro da Etapa 1 (histórico)

## Escopo e fontes

Esta entrega estabelece a infraestrutura. O marketplace completo ainda não está implementado e os critérios eliminatórios da entrega final ainda precisam ser atendidos nas próximas etapas.

O [README oficial](https://github.com/junglegaming/frontend-challenge) foi lido integralmente. O [Figma fornecido](https://www.figma.com/design/LMZL4sxsnNYDlLjA7uJ7gV/Frontend-Challenge--Copy-?node-id=0-1) foi acessado pelo MCP: metadados da página `0:1` e contexto de alta fidelidade com screenshot do frame `2:2` (Desktop / Início, 1440 × 3668).

## Responsabilidades

- `src/app`: ambiente, bootstrap, provider Query, registro do Router e estilos globais.
- `src/routes`: árvore tipada de rotas criada por código; nenhuma geração de arquivos ou plugin extra é necessária.
- `src/components`: shell, página provisória, feedback de rotas e componentes shadcn/ui.
- `src/features/system`: query de diagnóstico, interface e ciclo de vida da conexão de diagnóstico.
- `src/lib`: Axios centralizado, QueryClient e função de classes fornecida pelo shadcn.
- `src/mocks`: handlers REST e Socket.IO, fixtures tipadas e cenários de rede.
- `src/realtime`: fábrica de transporte Socket.IO com conexão explícita.
- `src/types`: contratos utilizados pela rede, pelos mocks e pela interface.
- `tests/e2e`: navegação, REST, evento Socket.IO, refresh de rota e 404 em três viewports.
- `scripts`: execução portátil do Playwright e auditoria Lighthouse.

Não há pastas de domínio ou arquivos vazios antecipando implementações futuras. O estado simulado persistente será criado junto dos recursos que o utilizarem.

## Inicialização e ambiente

O bootstrap aguarda `worker.start()` antes de carregar a árvore de rotas. Essa ordem também garante que Socket.IO capture o WebSocket interceptado pelo MSW. O provider React Query fica acima do Router. Falhas de inicialização apresentam uma mensagem acessível; erros de renderização/carregamento das rotas usam o error component do Router. Há fallback de rota inexistente com retorno ao início.

`VITE_ENABLE_MOCKS=true` ativa os mocks tanto em desenvolvimento quanto em build de demonstração. Sem a variável, o padrão é `false`. Não existem respostas fictícias no Axios, nas queries ou nos componentes. As variáveis são públicas e não devem conter segredos.

Ao desativar os mocks, o bootstrap remove registros anteriores do worker MSW no mesmo escopo. Sem mocks, os endereços configurados precisam de um serviço compatível para responder; esta etapa não cria esse serviço.

## REST e estado remoto

Contrato já implementado:

| Operação | Sucesso | Falha de cenário |
| --- | --- | --- |
| `GET /api/health` | HTTP 200, `{ "status": "ok", "service": "kurio" }` | HTTP 503, `{ "code": "SERVICE_UNAVAILABLE", "message": "Serviço temporariamente indisponível." }`, ou erro de rede |

A base `/api` é configurável. O handler usa a mesma base do Axios. Toda consulta recebe o `AbortSignal` do TanStack Query. A query de diagnóstico usa a chave `['system', 'health']`.

Política inicial: dados frescos por 30 segundos; coleta de cache inativo após 5 minutos; revalidação de dados obsoletos ao recuperar foco/conexão; uma repetição para falhas de rede ou 5xx e nenhuma para 4xx; mutations sem repetição automática. O Axios tem timeout de 10 segundos. Mutations, invalidação de recursos de domínio e rollback otimista ainda não existem.

## Tempo real

O transporte usa `socket.io-client` 4.x, namespace padrão `/`, caminho padrão `/socket.io/` e somente WebSocket. A conexão é criada com `autoConnect: false`, instância independente, timeout de 10 segundos e até cinco tentativas de reconexão. O consumidor registra listeners antes de conectar, remove os listeners e desconecta ao desmontar.

O handler MSW utiliza `toSocketIo` de `@mswjs/socket.io-binding` 0.2.0. A versão publicada declara peer de MSW `^2.10.2`; por isso foi fixado MSW 2.15.0, sem forçar compatibilidade com MSW 3. O MSW 2.15 normaliza o prefixo `/socket.io/` para `/` na correspondência do handler. O binding realiza o handshake e codifica os pacotes. Não há servidor Socket.IO real.

Contrato de diagnóstico já implementado: servidor emite `system.ready` com `{ "status": "ok", "transport": "socket.io" }`. A UI confirma esse evento após passar pelo binding e pelo cliente Socket.IO. O estado local do hook apenas apresenta o estado da conexão recebida; não gera eventos simulados ou dados de negócio.

Limitações: simulação no navegador, somente namespace padrão e eventos JSON de diagnóstico; sem polling, salas, acknowledgements, autenticação, heartbeat de longa duração ou cenários de interrupção controlada implementados nesta etapa. O binding não oferece paridade total com um servidor Socket.IO. A próxima etapa de tempo real deverá adicionar os cenários de longa duração e validar suas particularidades antes de depender deles no checkout.

## Design e acessibilidade

As cores iniciais foram obtidas do Figma: fundo `#140D0A`, texto `#F5F1EB`, primária `#D28A4C`, texto secundário `#CFB28C`, superfície `#241612` e destaque de foco `#E89B55`. A borda inicial utiliza o token Border Soft `#55321F`. O Button e o Skeleton vêm do registry shadcn/ui (`new-york`, CLI 4.22.1); o Skeleton recebeu shimmer com redução de movimento.

A página inicial e `/system` são provisórias e não reproduzem a composição do marketplace. A fonte temporária é a pilha monoespaçada do sistema; Roboto Mono, imagens e demais assets locais do Figma serão incorporados junto das telas. Nenhum asset do design foi substituído por imagem inventada e nenhuma URL temporária do Figma é usada na aplicação.

O shell inclui landmarks, link para pular ao conteúdo, foco visível, navegação por links, contraste e feedback acessível de rede. Os testes verificam ausência de overflow no diagnóstico em 390, 768 e 1440 pixels. Acessibilidade de formulários, diálogos e drawers será validada quando existirem.

O favicon permanece sem imagem nesta etapa (`data:,`), evitando a requisição automática a um arquivo inexistente; o favicon definitivo deverá acompanhar os assets da marca. Há `robots.txt` válido para que o fallback da SPA não responda HTML nesse endereço.

## Testes e auditorias

Os E2E usam contextos de navegador isolados, cenários MSW padrão, Chromium, relatório HTML e traces/screenshots de falhas. Não substituem REST por `page.route` nem o Socket.IO por callbacks locais. Há execução contra desenvolvimento e contra build de demonstração com preview; o segundo fluxo valida mocks e refresh em arquivos otimizados.

Lighthouse tem configuração versionada, perfis mobile e desktop, três medições por página/perfil, relatórios HTML/JSON, medianas das quatro categorias, LCP, CLS, TBT e metadados de ambiente. A página padrão da etapa 1 é `/`; a rota de detalhe será adicionada à auditoria após sua implementação. Pontuações da página provisória não comprovam as metas do marketplace final.

Na validação local, o Lighthouse identificou JavaScript HTTP injetado pelo Kaspersky (`gc.kis.v2.scr.kaspersky-labs.com`). Esse conteúdo é externo ao projeto e afeta HTTPS, quantidade de JavaScript e pontuações. A configuração não oculta requisições ou desativa auditorias para compensá-lo. Os resultados devem ser reproduzidos em ambiente sem injeção externa para avaliar a entrega final. O runner registra origens externas no resumo; nenhuma configuração do sistema ou do antivírus foi alterada.

## Próximas etapas autorizáveis

Ainda faltam: telas desktop/mobile completas, assets e fontes; catálogo e filtros na URL; sessão, proteção de rotas e isolamento de cache por usuário; favoritos com atualização otimista; carrinho persistente; carteiras; checkout e pedidos idempotentes com valores ETH decimais precisos; fixtures e estado compartilhado com dois usuários; cenários de erro e timeout de negócio; `nft.updated` e `order.updated` com identidade, versão, deduplicação e reconciliação REST; suíte E2E completa e baselines visuais; auditorias finais de início/detalhe e deploy com fallback de SPA.

Não há autenticação ficticiamente concluída, credenciais, blockchain, pagamentos, backend, commit, push ou deploy nesta etapa.
