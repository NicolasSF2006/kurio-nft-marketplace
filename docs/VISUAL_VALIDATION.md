# Validação visual — Kurio

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
