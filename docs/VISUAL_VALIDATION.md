# Validação visual — Etapa 5

Em 21/10/2026 o Figma MCP voltou a responder. Foram obtidos contexto/screenshot do início e novas exportações de todos os 15 frames. Os PNGs estão em `docs/figma/`, com os mesmos IDs da tabela histórica abaixo. Exports desktop são previews reduzidos pelo MCP a 1024 px de altura; mobile mantém 414 × 896. Esses arquivos não entram no aplicativo. Não foi necessário inventar/substituir ilustrações.

Foram examinados lado a lado os nove pares desktop e seis mobile, conferindo fonte, cores, geometria, imagens, cards, formulários, navegação e footer. O relatório reproduzível `npm run visual:report` usa as capturas atuais em `reports/visual/comparison-stage5.html`. A confirmação principal agora usa o recibo funcional de `order-confirmed.png`; a prévia continua disponível separadamente.

| Grupo | Achado/correção e limite observado |
| --- | --- |
| Início desktop | Texto do hero alinhado; busca corrigida para remover `clip-path: inset(50%)` residual. Busca, favoritos e limpeza de filtros acrescentam espaço frente ao frame. Contagens vêm da API. |
| Início mobile/tablet | Favorito usa o export original de círculo/coração; tabs permitem rolagem sem quebrar uma segunda linha; texto do hero não invade a imagem em 390. Nove resultados agora ficam visíveis: a regra anterior ocultava cinco embora estivessem no DOM. Ordenação/paginação são extensões funcionais. |
| Detalhe | Galeria/imagens preservadas, estrelas com semântica correta e edição esgotada identificada. Contrato/direitos deixaram de estar invertidos; rede e detalhes vêm da API. Estoque/feedback acrescentam altura, e informações podem exigir rolagem acima da barra fixa mobile. |
| Carrinho | Captura antiga em loading foi rejeitada; agora aguarda cotação/imagens. Cards/tabela, resumo e CTA foram comparados. Três itens com quantidades reais e total coerente diferem do frame mobile, que tem valores contraditórios. |
| Pagamento | Captura agora cadastra/conecta uma carteira real na simulação. Mantém grid desktop e cards mobile; ações de conexão/revisão, coletor expansível, itens e resumo acrescentam altura. As opções decorativas do frame não fingem ser carteiras conectadas. |
| Confirmação | Recibo funcional só após `confirmed`, snapshot e referência simulada; CTA de explorador explicitamente simulado. Aviso de mudança do catálogo não sobrepõe recibos. Quantidade de itens, identificadores e datas são do pedido, em vez dos valores estáticos do frame. |
| Login/cadastro | Topo do modal desktop corrigido para não deslocar com margem do body; scroll disponível em alturas pequenas. Forms mobile 414 foram comparados: fonte, campos, botões e espaçamentos. Cadastro/login permanecem reais na simulação; sociais/recuperação informam fora do escopo. |
| Perfil/carteiras | Capturas novas aguardam dados, não skeleton. Sidebar, grid, avatar, senha/ENS e carteira secundária conferidos. Dados fictícios preenchidos, botão separado de salvar perfil e link de pedidos alteram a composição estática. |

1440 × 900, 768 × 1024 e 390 × 844 foram verificados nas nove páginas. Seis páginas têm também captura em 414 × 896. Os testes conferem assets carregados e ausência de overflow horizontal; axe verifica contraste/labels/semântica. Texto ampliado a 200% é verificado separadamente, sem alegar teste completo de todo zoom/tecnologia assistiva.

Há 16 baselines fonte Playwright para início/detalhe/carrinho/checkout nos quatro tamanhos. Elas representam o navegador, não um diff pixel a pixel contra o Figma. Foram revisadas antes da aprovação; quatro falhas esperadas revelaram busca recortada, resultados escondidos e metadados do detalhe corrigidos. HTML/diffs/traces preservados em `reports/playwright-stage5-visual-review/`. Testes finais comparam sem autoatualizar.

Os 137 originais permanecem intactos. `Artwork` oferece 16 derivados WebP responsivos dos quatro PNGs, com fallback original, sem mudar recorte/identidade; SHA-256 e geração em `optimized-assets.json` e `scripts/optimize-images.mjs`. A fonte Roboto Mono é local. Não se declara fidelidade perfeita: há diferenças de rasterização/alinhamento, estados funcionais e adaptações mobile sem frames específicos. Essas limitações também constam na matriz e arquitetura.

## Registro da Etapa 2 (histórico)

> Registro de referência preservado. Na Etapa 3, as capturas são renovadas com conta/carrinho criados pela UI e APIs. Busca desktop, paginação mobile, favoritos, formulários privados e mensagens de validação receberam os estados funcionais necessários. Desktop/mobile usam o mesmo catálogo, carrinho e cotação; as diferenças de valores/quantidade para o frame original são intencionais e documentadas em `ARCHITECTURE.md`. Não houve nova consulta ao Figma MCP nesta etapa.

Foram inspecionados os contextos de alta fidelidade, screenshots, dimensões e assets dos 15 frames do arquivo `LMZL4sxsnNYDlLjA7uJ7gV`. Tokens confirmados pelo MCP: Roboto Mono, fundo `#140D0A`, superfície `#241612`, primária `#D28A4C`, destaque `#E89B55`, texto `#F5F1EB` e secundário `#CFB28C`.

| Página | Frame desktop | Frame mobile | Comparação realizada |
| --- | --- | --- | --- |
| Início | `2:2`, 1440 × 3668 | `14:5226`, 414 × 896 | Hero, duas composições do catálogo, imagens, proporções, sidebar, footer e barra inferior |
| Detalhes | `10:244`, 1440 × 2246 | `15:5536`, 414 × 896 | Galeria, miniaturas, tipografia, edições, textos e barra de compra mobile |
| Carrinho | `11:1278`, 1440 × 1754 | `16:360`, 414 × 896 | Tabela/cards, quantidades, cupom, resumo e CTA |
| Pagamento | `11:2862`, 1440 × 1657 | `16:748`, 414 × 896 | Formulário desktop, itens/resumo e seleção de carteira mobile |
| Confirmação | `11:4385`, 1440 × 1657 | Adaptação | Modal, metadados, itens e totais; aviso de prévia intencional |
| Login | `9:115`, 1440 × 1981 | `16:1022`, 414 × 896 | Modal sobre catálogo no desktop; página própria no mobile; campos, logo e botões sociais |
| Cadastro | `9:1022`, 1440 × 1981 | `16:1228`, 414 × 896 | Modal/página, dimensões de campos, botões e espaçamentos |
| Perfil | `9:1238`, 1440 × 1080 | Adaptação | Sidebar, grade, avatar e bloco de alteração de senha |
| Carteiras | `9:1670`, 1440 × 1080 | Adaptação | Sidebar, formulário de carteira principal, ENS e carteira secundária |

Os testes geram screenshots em `reports/visual/chromium-desktop`, `chromium-tablet`, `chromium-mobile` e `figma-mobile-414`. Desktop usa largura 1440 e captura de página inteira; tablet usa 768 e mobile 390. As seis capturas adicionais de referência usam 414 × 896. Alturas de páginas web variam conforme conteúdo, viewport e avisos de prévia.

Após a primeira comparação, foram corrigidos: precedência de estilos nos componentes shadcn, campos de autenticação fora do primeiro viewport mobile, setas giradas incorretamente, capturas antes do carregamento de imagens, texto longo do detalhe mobile, posição dos campos ENS e uso de fundos decorativos exportados.

Os quatro retratos originais foram mantidos sem edição, com recortes e dimensões dos slots do design. Os testes verificam se as imagens renderizadas possuem arquivo carregado e dimensões naturais válidas. `docs/design-assets.json` relaciona arquivos locais às variáveis e frames de origem. SVGs mantêm seu conteúdo e dimensões intrínsecas; fundos decorativos são aplicados como imagens de fundo nos slots correspondentes.

Os formulários e diálogos foram verificados por navegação, labels e teclado. Os testes também verificam ausência de overflow horizontal em todas as nove páginas nas três larguras e que os campos de autenticação estejam dentro do viewport. Há suporte a movimento reduzido e skeleton com shimmer.

Não houve declaração de fidelidade perfeita nem geração de baselines aprovadas. Persistem diferenças pontuais de alinhamento, ícones e rasterização de fontes. Avisos de prévia, a copy de recibo sem transação e controles pendentes são desvios intencionais descritos em `ARCHITECTURE.md`. Os perfis mobile de conta/recibo são adaptações, pois não existem referências específicas no arquivo.

Para revisar os pares localmente, abra `reports/visual/comparison.html`. Ele reúne as nove referências desktop e seis mobile, com acesso às imagens em seus tamanhos originais. É um artefato desta sessão, sem publicar conteúdo ou alterar os frames do Figma.
