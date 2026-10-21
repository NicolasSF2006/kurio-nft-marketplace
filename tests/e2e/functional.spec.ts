import { test, expect } from '@playwright/test'
import { addNft, login, logout, reset, scenario } from '../helpers/flows.js'

test.beforeEach(async ({ page }) => {
  await reset(page)
})

test('catálogo consulta busca, filtros combinados, ordenação, paginação e histórico', async ({
  page,
}, info) => {
  const mobile = info.project.name !== 'chromium-desktop'
  const grid = page.locator(mobile ? '.catalog-grid-mobile' : '.catalog-grid-desktop')
  await expect(grid.locator('.nft-card')).toHaveCount(9)
  await expect(grid.locator('.nft-card:visible')).toHaveCount(9)
  await grid.locator('.nft-card').last().scrollIntoViewIfNeeded()
  await expect(grid.locator('.nft-card').last()).toBeInViewport()
  await page.evaluate(() => scrollTo(0, 0))
  const search = page
    .getByRole('textbox', { name: 'Buscar NFTs', exact: true })
    .filter({ visible: true })
  expect(
    await search.evaluate((element) => getComputedStyle(element.parentElement!).clipPath),
  ).toBe('none')
  await search.fill('Emerald')
  await expect(grid.locator('.nft-card')).toHaveCount(4)
  await expect(page).toHaveURL(/q=Emerald/)
  await page.reload()
  await expect(search).toHaveValue('Emerald')
  await search.fill('')
  await expect(page).toHaveURL(/\/$/)
  await expect(grid.locator('.nft-card:visible')).toHaveCount(9)
  if (mobile) await page.getByRole('button', { name: 'Abrir filtros' }).click()
  const filters = page.locator(mobile ? '.filter-dialog' : '.catalog-sidebar')
  await filters.getByRole('button', { name: 'Arte digital (4)', exact: true }).click()
  await filters.getByRole('button', { name: 'Ethereum (12)', exact: true }).click()
  if (mobile) await page.getByRole('button', { name: 'Fechar filtros' }).click()
  await expect(grid.locator('.nft-card')).toHaveCount(4)
  await page.getByRole('combobox', { name: 'Ordenar NFTs' }).selectOption('price-desc')
  await expect(page).toHaveURL(/sort=price-desc/)
  await page.goBack()
  await expect(page.getByRole('combobox', { name: 'Ordenar NFTs' })).toHaveValue('recent')
  await page.goto('/')
  await page
    .getByRole('navigation', { name: 'Paginação do catálogo' })
    .getByRole('button', { name: '2', exact: true })
    .click()
  await expect(page).toHaveURL(/page=2/)
  await expect(grid.getByText('Emerald Ape #042 · Série 2', { exact: true })).toBeVisible()
  await page.reload()
  await expect(grid.getByText('Emerald Ape #042 · Série 2', { exact: true })).toBeVisible()
})

test('detalhe trata identificador inexistente e edição esgotada, limita quantidade', async ({
  page,
}) => {
  await page.goto('/nfts/inexistente')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  await page.goto('/nfts/emerald-ape-042')
  await page.getByRole('button', { name: '1/1', exact: true }).click()
  await expect(page.getByText('Edição indisponível', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).filter({ visible: true }),
  ).toBeDisabled()
  await page.getByRole('button', { name: '1/10', exact: true }).click()
  const increase = page
    .getByRole('button', { name: 'Aumentar quantidade' })
    .filter({ visible: true })
  for (let i = 0; i < 9; i++) await increase.click()
  await expect(increase).toBeDisabled()
  await page
    .getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ })
    .filter({ visible: true })
    .click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: true })).toBeVisible()
})

test('cadastro, conflito e sessão restaurada após refresh', async ({ page }) => {
  await page.goto('/signup')
  await page.getByRole('textbox', { name: 'Nome de usuário', exact: true }).fill('teste_novo')
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('novo@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Senha123!')
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Diferente!')
  await page.locator('.auth-submit').click()
  await expect(page.getByText('As senhas não coincidem.', { exact: true })).toBeVisible()
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Senha123!')
  await page.locator('.auth-submit').click()
  await expect(page).toHaveURL(/\/profile$/)
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Nome de usuário', exact: true })).toHaveValue(
    'teste_novo',
  )
  await logout(page)
  await page.goto('/signup')
  await page.getByRole('textbox', { name: 'Nome de usuário', exact: true }).fill('teste_novo')
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('novo@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Senha123!')
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Senha123!')
  await page.locator('.auth-submit').click()
  await expect(page.getByRole('alert')).toContainText('já cadastrado')
})

test('proteção, retorno ao destino, expiração e isolamento na troca de conta', async ({ page }) => {
  await page.goto('/wallets')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('nova@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.locator('.auth-submit').click()
  await expect(page).toHaveURL(/\/wallets$/)
  await page.evaluate(async () => {
    await window.kurioMocks!.expireSession()
  })
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await login(page)
  await page.getByRole('textbox', { name: 'Nome de exibição', exact: true }).fill('Nova privada')
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click()
  await expect(page.getByText('Perfil salvo.', { exact: true })).toBeVisible()
  await logout(page)
  await login(page, 'luna@kurio.test')
  await expect(page.getByRole('textbox', { name: 'Nome de exibição', exact: true })).toHaveValue(
    'Luna Costa',
  )
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    'luna@kurio.test',
  )
})

test('favoritos exigem sessão, sincronizam catálogo/detalhe e fazem rollback', async ({
  page,
}, info) => {
  await page.goto('/nfts/emerald-ape-042')
  const favorite = page
    .getByRole('button', { name: 'Favoritar Emerald Ape #042', exact: true })
    .filter({ visible: true })
  await favorite.click()
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await login(page)
  await page.goto('/nfts/emerald-ape-042')
  await favorite.click()
  await expect(
    page
      .getByRole('button', { name: 'Remover favorito Emerald Ape #042', exact: true })
      .filter({ visible: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page
      .getByRole('button', { name: 'Remover favorito Emerald Ape #042', exact: true })
      .filter({ visible: true }),
  ).toBeEnabled()
  await page.goto('/?favorites=true')
  const grid = page.locator(
    info.project.name === 'chromium-desktop' ? '.catalog-grid-desktop' : '.catalog-grid-mobile',
  )
  await expect(grid.locator('.nft-card')).toHaveCount(1)
  await page.reload()
  await expect(grid.locator('.nft-card')).toHaveCount(1)
  await scenario(page, 'favorite-error')
  await grid.getByRole('button', { name: 'Remover favorito Emerald Ape #042', exact: true }).click()
  await expect(page.locator('.preview-toast')).toContainText('Alteração desfeita')
  await expect(
    grid.getByRole('button', { name: 'Remover favorito Emerald Ape #042', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await scenario(page, 'default')
  await grid.getByRole('button', { name: 'Remover favorito Emerald Ape #042', exact: true }).click()
  await expect(grid.locator('.nft-card')).toHaveCount(0)
  await expect(page.getByText('Nenhum NFT encontrado para esta busca.')).toBeVisible()
})

test('carrinho persiste, mescla sem duplicatas e usa cotação decimal e cupons', async ({
  page,
}, info) => {
  await addNft(page)
  await page.goto('/cart')
  const items = page.locator(
    info.project.name === 'chromium-desktop' ? '.cart-desktop-table' : '.cart-mobile-items',
  )
  await items.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(page.locator('.price-summary .summary-total')).toContainText('2.396 ETH')
  await page.reload()
  await expect(items.locator('output')).toHaveText('2')
  await page.getByRole('textbox', { name: 'Código promocional', exact: true }).fill('INVALIDO')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Cupom inválido')
  await page.getByRole('textbox', { name: 'Código promocional', exact: true }).fill('EXPIRADO')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('expirou')
  await page.getByRole('textbox', { name: 'Código promocional', exact: true }).fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.locator('.price-summary .summary-total')).toContainText('2.158 ETH')
  await login(page)
  await page.goto('/cart')
  await expect(items.locator('output')).toHaveText('2')
  await logout(page)
  await addNft(page)
  await login(page)
  await page.goto('/cart')
  await expect(items.locator('output')).toHaveText('3')
  await expect(items.locator('article')).toHaveCount(1)
  await page.getByRole('button', { name: 'Remover cupom', exact: true }).click()
  await expect(page.locator('.price-summary .summary-total')).toContainText('3.586 ETH')
  await items.getByRole('button', { name: 'Remover Emerald Ape #042 1/50', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  await logout(page)
  await login(page, 'luna@kurio.test')
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('perfil, avatar, senha e carteiras persistem com validação de API', async ({ page }) => {
  await login(page)
  await page.getByRole('textbox', { name: 'Nome de exibição', exact: true }).fill('Nova Atualizada')
  await page
    .getByLabel('Arquivo do avatar', { exact: true })
    .setInputFiles('public/assets/figma/8f387.png')
  // The original NFT is larger than the avatar limit: exercise accessible client validation.
  await expect(page.getByRole('alert')).toContainText('até 500 KB')
  await page.getByLabel('Arquivo do avatar', { exact: true }).setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=',
      'base64',
    ),
  })
  await page.getByRole('button', { name: 'Salvar perfil', exact: true }).click()
  await expect(page.getByText('Perfil salvo.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Nome de exibição', exact: true })).toHaveValue(
    'Nova Atualizada',
  )
  await expect(page.getByRole('img', { name: 'Avatar do colecionador' })).toBeVisible()
  await page.getByLabel('Senha atual', { exact: true }).fill('senhaerrada')
  await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha123!')
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('NovaSenha123!')
  await page.getByRole('button', { name: 'Alterar senha', exact: true }).click()
  await expect(page.getByText('Senha atual incorreta.', { exact: true })).toBeVisible()
  await page.getByLabel('Senha atual', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Alterar senha', exact: true }).click()
  await expect(page.getByText('Senha alterada.', { exact: true })).toBeVisible()
  await page.goto('/wallets')
  await page
    .getByRole('textbox', { name: 'Apelido da carteira', exact: true })
    .fill('Principal Nova')
  await page.getByRole('textbox', { name: 'Endereço da carteira', exact: true }).fill('invalido')
  await page.getByRole('button', { name: 'Salvar carteira principal', exact: true }).click()
  await expect(
    page.getByText('Use 0x seguido de 40 caracteres hexadecimais.', { exact: true }),
  ).toBeVisible()
  await page
    .getByRole('textbox', { name: 'Endereço da carteira', exact: true })
    .fill('0x1111111111111111111111111111111111111111')
  await page.getByRole('button', { name: 'Salvar carteira principal', exact: true }).click()
  await expect(page.getByText('Carteira salva.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Apelido da carteira', exact: true })).toHaveValue(
    'Principal Nova',
  )
  await page
    .getByRole('textbox', { name: 'Apelido da carteira', exact: true })
    .fill('Principal Editada')
  await page.getByRole('button', { name: 'Salvar carteira principal', exact: true }).click()
  await expect(page.getByText('Carteira salva.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar carteira secundária', exact: true }).click()
  const secondary = page.locator('.secondary-wallet')
  await secondary
    .getByRole('textbox', { name: 'Apelido da carteira', exact: true })
    .fill('Reserva Nova')
  await secondary
    .getByRole('textbox', { name: 'Endereço da carteira', exact: true })
    .fill('0x2222222222222222222222222222222222222222')
  await secondary.getByRole('button', { name: 'Salvar carteira secundária', exact: true }).click()
  await expect(secondary.getByText('Carteira salva.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(
    secondary.getByRole('textbox', { name: 'Apelido da carteira', exact: true }),
  ).toHaveValue('Reserva Nova')
  await logout(page)
  await login(page, 'nova@kurio.test', 'NovaSenha123!')
})

test('loading, vazio, falhas HTTP/conexão e recuperação; descarta respostas fora de ordem', async ({
  page,
}, info) => {
  await scenario(page, 'slow')
  await page.addInitScript(() => {
    let score = 0
    Object.defineProperty(window, 'kurioAuditCls', { get: () => score })
    new PerformanceObserver((list) => {
      for (const item of list.getEntries() as (PerformanceEntry & {
        value: number
        hadRecentInput: boolean
      })[]) {
        if (!item.hadRecentInput) score += item.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
  await page.reload()
  await expect(page.getByRole('status', { name: 'Carregando conteúdo' })).toBeVisible()
  await expect(page.locator('.catalog-placeholder:visible')).toHaveCount(9)
  await expect(page.locator('.home-hero')).toBeVisible()
  await expect(page.locator('.catalog-grid .nft-card:visible')).toHaveCount(9)
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
  })
  expect(await page.evaluate(() => Number(Reflect.get(window, 'kurioAuditCls')))).toBeLessThan(0.02)
  await scenario(page, 'empty')
  await expect(page.getByText('Nenhum NFT encontrado para esta busca.')).toBeVisible()
  await scenario(page, 'error')
  await expect(
    page.getByRole('heading', { name: 'Não foi possível carregar o conteúdo' }),
  ).toBeVisible()
  await scenario(page, 'default')
  await expect(page.locator('.home-hero')).toBeVisible()
  await scenario(page, 'offline')
  await expect(page.getByRole('alert').first()).toBeVisible()
  await scenario(page, 'default')
  await expect(page.locator('.home-hero')).toBeVisible()
  await scenario(page, 'out-of-order')
  const search = page
    .getByRole('textbox', { name: 'Buscar NFTs', exact: true })
    .filter({ visible: true })
  await search.fill('S')
  await search.fill('Emerald')
  const grid = page.locator(
    info.project.name === 'chromium-desktop' ? '.catalog-grid-desktop' : '.catalog-grid-mobile',
  )
  await expect(grid.locator('.nft-card')).toHaveCount(4)
  await expect(grid.locator('.nft-card')).toContainText([
    'Emerald',
    'Emerald',
    'Emerald',
    'Emerald',
  ])
})
