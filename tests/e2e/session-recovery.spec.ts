import { test, expect } from '@playwright/test'
import { addNft, login, reset, scenario } from '../helpers/flows.js'

test.beforeEach(async ({ page }) => {
  await reset(page)
})

test('troca direta de conta limpa favoritos e carrinho; expiração no pagamento preserva contexto', async ({
  page,
}) => {
  await login(page)
  await addNft(page)
  await page
    .getByRole('button', { name: 'Favoritar Emerald Ape #042', exact: true })
    .filter({ visible: true })
    .click()
  await expect(
    page
      .getByRole('button', { name: 'Remover favorito Emerald Ape #042', exact: true })
      .filter({ visible: true }),
  ).toBeEnabled()
  await login(page, 'luna@kurio.test')
  await page.goto('/?favorites=true')
  await expect(page.getByText('Nenhum NFT encontrado para esta busca.')).toBeVisible()
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  await login(page)
  await page.goto('/cart')
  await expect(page.locator('.summary-total')).toContainText('1.206 ETH')
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await page.evaluate(async () => {
    await window.kurioMocks!.expireSession()
  })
  await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout/)
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('nova@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await page.goto('/cart')
  await expect(page.locator('.summary-total')).toContainText('1.206 ETH')
})

test('URLs numéricas, cenários de validação/estoque e reset pela interface', async ({
  page,
}, info) => {
  await page.goto('/?maxPrice=1&q=Emerald')
  await expect(page.getByText('Nenhum NFT encontrado para esta busca.')).toBeVisible()
  await page.goto('/?q=552')
  const grid = page.locator(
    info.project.name === 'chromium-desktop' ? '.catalog-grid-desktop' : '.catalog-grid-mobile',
  )
  await expect(grid.locator('.nft-card')).toHaveCount(4)
  await page.goto('/')
  await scenario(page, 'http400')
  await expect(page.getByRole('alert')).toContainText('cenário HTTP 400')
  await scenario(page, 'default')
  await addNft(page)
  await page.goto('/cart')
  await scenario(page, 'unavailable')
  await expect(page.getByRole('alert').last()).toContainText('Edição indisponível')
  await expect(page.locator('.quantity').filter({ visible: true }).locator('output')).toHaveText(
    '1',
  )
  await scenario(page, 'default')
  await expect(page.locator('.summary-total')).toContainText('1.206 ETH')
  await page
    .getByRole('link', {
      name: info.project.name === 'chromium-desktop' ? 'Continuar explorando' : 'Voltar',
      exact: true,
    })
    .click()
  await page.getByRole('link', { name: 'Verificar infraestrutura', exact: true }).click()
  await expect(page.locator('.realtime-status')).toHaveText('Tempo real conectado')
  await page.evaluate(async () => {
    await window.kurioMocks!.action('price-up')
  })
  await expect
    .poll(async () =>
      Number(await page.locator('.realtime-status').getAttribute('data-nft-events')),
    )
    .toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Restaurar estado inicial', exact: true }).click()
  await expect(page.getByText('Cenário atualizado.', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Início', exact: true }).filter({ visible: true }).click()
  await expect(grid.locator('.nft-card')).toHaveCount(9)
  await page.evaluate(async () => {
    await window.kurioMocks!.action('price-up')
  })
  await expect(grid.locator('.nft-card').filter({ hasText: 'Emerald Ape #042' })).toContainText(
    '1.29 ETH',
  )
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})
