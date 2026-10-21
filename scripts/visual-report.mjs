import { mkdir, writeFile } from 'node:fs/promises'
const frames = [
  [
    'home',
    'Início',
    '2:2',
    '390/768/1440 e 414 × 896; busca visível e nove resultados por página.',
  ],
  [
    'detail',
    'Detalhes do NFT',
    '10:244',
    'Galeria, edições, metadados e barra de compra; informações adicionais exigem rolagem no mobile.',
  ],
  [
    'cart',
    'Carrinho',
    '11:1278',
    'Três itens reais; quantidades e totais da API diferem dos valores ilustrativos do frame.',
  ],
  [
    'checkout',
    'Pagamento',
    '11:2862',
    'Carteira cadastrada e conexão simulada; revisão explícita, itens e feedback acrescentados ao layout.',
  ],
  [
    'confirmation',
    'Confirmação funcional',
    '11:4385',
    'Pedido confirmado pela simulação; snapshot de um item, identificador e transação simulada.',
  ],
  [
    'login',
    'Login',
    '9:115',
    'Modal desktop e formulário mobile; validação e retorno ao destino funcionais.',
  ],
  [
    'signup',
    'Cadastro',
    '9:1022',
    'Modal desktop e formulário mobile; validação e conflitos retornados pela API.',
  ],
  [
    'profile',
    'Perfil',
    '9:1238',
    'Dados fictícios persistidos; salvar perfil e alterar senha são operações independentes.',
  ],
  [
    'wallets',
    'Carteiras',
    '9:1670',
    'Editor funcional de carteira principal e secundária; campos obrigatórios conforme contrato.',
  ],
]
const mobileNodes = {
  home: '14:5226',
  detail: '15:5536',
  cart: '16:360',
  checkout: '16:748',
  login: '16:1022',
  signup: '16:1228',
}
const pairs = frames.flatMap(([name, label, node, note]) => [
  {
    name,
    label: `${label} — desktop`,
    node,
    note,
    actual: `chromium-desktop/${name === 'confirmation' ? 'order-confirmed' : name}.png`,
  },
  ...(mobileNodes[name]
    ? [
        {
          name: `mobile-${name}`,
          label: `${label} — mobile 414 × 896`,
          node: mobileNodes[name],
          note,
          actual: `figma-mobile-414/${name}.png`,
        },
      ]
    : []),
])
await mkdir('reports/visual', { recursive: true })
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Kurio — revisão Figma, Etapa 5</title>
<style>body{background:#140d0a;color:#f5f1eb;font:15px/1.6 system-ui;margin:24px}a{color:#e89b55}nav{display:flex;gap:18px;flex-wrap:wrap}section{border-top:1px solid #55321f;padding-top:20px;margin:36px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}.pair img{width:100%;height:auto}figure{margin:0;background:#241612}figcaption{padding:12px}.pair.mobile{max-width:850px}.overlay{position:relative;display:block}.overlay figure+figure{position:absolute;inset:0;opacity:var(--opacity,.5)}.overlay figure:first-child{visibility:visible}button,input{font:inherit}button{background:#d28a4c;color:#140d0a;border:0;padding:6px 12px;cursor:pointer}:focus-visible{outline:3px solid #e89b55;outline-offset:4px}</style>
<h1>Kurio — revisão visual da Etapa 5</h1><p>Esquerda: exportação nova pelo Figma MCP em 21/10/2026. Direita: aplicação com REST/MSW e Socket.IO reais no cliente. Os exports desktop do MCP foram reduzidos a 1024 pixels de altura; normalizamos apenas a largura na apresentação. Não é uma comparação pixel a pixel com o Figma. Baselines Playwright são capturas do navegador separadas.</p>
<p><a href="../../docs/VISUAL_VALIDATION.md">Achados e diferenças documentadas</a> · <a href="../../tests/baselines/win32/">Baselines por viewport</a></p>
<nav>${pairs.map((p) => `<a href="#${p.name}">${p.label}</a>`).join('')}</nav>
${pairs.map((p) => `<section id="${p.name}"><h2>${p.label}</h2><p>Frame ${p.node}. ${p.note}</p><button type="button" onclick="this.nextElementSibling.classList.toggle('overlay')">Alternar sobreposição</button><div class="pair ${p.name.startsWith('mobile-') ? 'mobile' : ''}"><figure><figcaption>Figma · ${p.node}</figcaption><img src="../../docs/figma/${p.name}.png" alt="Referência Figma: ${p.label}"></figure><figure><figcaption>Kurio funcional</figcaption><img src="${p.actual}" alt="Navegador: ${p.label}"></figure></div></section>`).join('')}
</html>`
await writeFile('reports/visual/comparison-stage5.html', html)
console.log('reports/visual/comparison-stage5.html — 15 pares; referências locais em docs/figma.')
