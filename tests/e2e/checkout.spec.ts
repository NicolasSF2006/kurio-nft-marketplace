import { test, expect } from '@playwright/test'
import { addNft, login, logout, reset, scenario } from '../helpers/flows.js'
import type { CheckoutAttempt } from '../../src/types/orders.js'
import { prepareCheckout, connectWallet, confirmButton, action } from '../helpers/checkout.js'

test.beforeEach(async ({ page }) => {
  await reset(page)
})

test('compra completa usa carteira, cotação e confirmação por Socket.IO', async ({
  page,
}, info) => {
  await prepareCheckout(page)
  await connectWallet(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({
    path: `reports/visual/${info.project.name}/checkout-connected.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await confirmButton(page).click()
  await expect(page).toHaveURL(/\/orders\/[a-f\d-]+$/)
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  await expect(page.locator('.receipt-card')).toContainText('1.206 ETH')
  await expect
    .poll(async () =>
      Number(await page.locator('.realtime-status').getAttribute('data-order-events')),
    )
    .toBeGreaterThan(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({
    path: `reports/visual/${info.project.name}/order-confirmed.png`,
    fullPage: true,
    animations: 'disabled',
  })
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})

test('pagamento recusado é terminal e preserva os itens', async ({ page }) => {
  await prepareCheckout(page)
  await scenario(page, 'payment-refused')
  await connectWallet(page)
  await confirmButton(page).click()
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  await action(page, 'confirm-order')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  await page.getByRole('link', { name: 'Revisar carrinho', exact: true }).click()
  await expect(page.locator('.summary-total')).toContainText('1.206 ETH')
})

test('cliques repetidos e reenvio usam um pedido; conteúdo diferente gera conflito', async ({
  page,
}) => {
  let attempt: CheckoutAttempt | undefined
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/orders' && request.method() === 'POST')
      attempt = {
        key: request.headers()['idempotency-key']!,
        input: request.postDataJSON() as CheckoutAttempt['input'],
      }
  })
  await prepareCheckout(page)
  await scenario(page, 'order-pending')
  await connectWallet(page)
  await confirmButton(page).dblclick()
  await expect(page.getByRole('heading', { name: 'Pedido pendente' })).toBeVisible()
  const id = await page.getByTestId('order-id').textContent()
  expect(attempt).toBeTruthy()
  const replay = await page.evaluate(
    async (value) => window.kurioMocks!.replayOrder(value),
    attempt!,
  )
  expect(replay.id).toBe(id)
  const status = await page.evaluate(async (value) => {
    try {
      await window.kurioMocks!.replayOrder({
        ...value,
        input: {
          ...value.input,
          collector: { ...value.input.collector, notes: 'Conteúdo diferente' },
        },
      })
      return 200
    } catch (error) {
      return (error as { response?: { status: number } }).response?.status
    }
  }, attempt!)
  expect(status).toBe(409)
  await page.goto('/orders')
  await expect(page.locator('.order-list-item')).toHaveCount(1)
})

test('timeout após criar recupera a mesma chave e não duplica a compra', async ({ page }) => {
  const keys: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/orders' && request.method() === 'POST')
      keys.push(request.headers()['idempotency-key']!)
  })
  await prepareCheckout(page)
  await scenario(page, 'timeout-after-create')
  await connectWallet(page)
  await confirmButton(page).click()
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  expect(keys).toHaveLength(1)
  const url = page.url()
  await page.reload()
  await expect(page).toHaveURL(url)
  await page.goto('/orders')
  await expect(page.locator('.order-list-item')).toHaveCount(1)
})

test('edição esgotada recebida por Socket.IO impede envio e mantém carrinho', async ({ page }) => {
  let posts = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/orders' && request.method() === 'POST') posts++
  })
  await prepareCheckout(page)
  await connectWallet(page)
  await action(page, 'sold-out')
  await expect(page.getByRole('heading', { name: 'Revise seu carrinho' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Edição indisponível')
  expect(posts).toBe(0)
  await page.getByRole('link', { name: 'Voltar ao carrinho', exact: true }).click()
  await expect(page.locator('.quantity').filter({ visible: true }).locator('output')).toHaveText(
    '1',
  )
})

test('eventos duplicados e antigos não revertem recursos ou recibos', async ({ page }) => {
  await prepareCheckout(page)
  await connectWallet(page)
  await action(page, 'duplicate')
  await expect(page.locator('.summary-total').filter({ visible: true })).toContainText('1.306 ETH')
  await action(page, 'old')
  await expect(page.locator('.summary-total').filter({ visible: true })).toContainText('1.406 ETH')
  await expect
    .poll(async () =>
      Number(await page.locator('.realtime-status').getAttribute('data-ignored-events')),
    )
    .toBeGreaterThan(1)
  await page
    .getByRole('button', { name: 'Revisar novos valores', exact: true })
    .filter({ visible: true })
    .click()
  await confirmButton(page).click()
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  const snapshot = await page.locator('.receipt-card').textContent()
  await action(page, 'duplicate')
  await action(page, 'old')
  await expect(page.locator('.receipt-card')).toHaveText(snapshot!)
  await page.reload()
  await expect(page.locator('.receipt-card')).toHaveText(snapshot!)
})

test('carteira valida rede, recusa conexão e permite desconectar', async ({ page }, info) => {
  await prepareCheckout(page)
  await scenario(page, 'wallet-refused')
  await page
    .getByRole('button', { name: 'Conectar carteira', exact: true })
    .filter({ visible: true })
    .click()
  await expect(page.getByRole('alert').filter({ visible: true })).toContainText('Conexão recusada')
  await scenario(page, 'default')
  await connectWallet(page)
  await page
    .getByRole('button', { name: 'Desconectar carteira', exact: true })
    .filter({ visible: true })
    .click()
  await expect(confirmButton(page)).toBeDisabled()
  if (info.project.name !== 'chromium-desktop')
    await page.locator('.mobile-collector summary').click()
  await page
    .getByRole('combobox', { name: 'Rede', exact: true })
    .filter({ visible: true })
    .selectOption('Polygon')
  await page
    .getByRole('button', { name: 'Conectar carteira', exact: true })
    .filter({ visible: true })
    .click()
  await expect(page.getByRole('alert').filter({ visible: true })).toContainText('rede selecionada')
  const networkField = page
    .getByRole('combobox', { name: 'Rede', exact: true })
    .filter({ visible: true })
  await expect(networkField).toHaveAttribute('aria-invalid', 'true')
  const networkDescription = await networkField.getAttribute('aria-describedby')
  expect(networkDescription).toBeTruthy()
  await expect(page.locator(`[id="${networkDescription}"]`)).toContainText(
    'Selecione a rede cadastrada',
  )
  await page
    .getByRole('combobox', { name: 'Rede', exact: true })
    .filter({ visible: true })
    .selectOption('Ethereum')
  await connectWallet(page)
  await page
    .getByRole('textbox', { name: 'Nome de exibição', exact: true })
    .filter({ visible: true })
    .fill('')
  await confirmButton(page).click()
  await expect(
    page
      .getByText('Informe um nome de até 80 caracteres.', { exact: true })
      .filter({ visible: true }),
  ).toBeVisible()
})

test('expiração após criação retoma o pedido existente ao autenticar', async ({ page }) => {
  await prepareCheckout(page)
  await scenario(page, 'purchase-session-expired')
  await connectWallet(page)
  await confirmButton(page).click()
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('nova@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  await page.goto('/orders')
  await expect(page.locator('.order-list-item')).toHaveCount(1)
})

test('troca de usuário descarta subscriptions privadas e bloqueia outro pedido', async ({
  page,
}) => {
  await prepareCheckout(page)
  await scenario(page, 'order-pending')
  await connectWallet(page)
  await confirmButton(page).click()
  await expect(page.getByRole('heading', { name: 'Pedido pendente' })).toBeVisible()
  const url = page.url()
  await login(page, 'luna@kurio.test')
  await page.goto('/orders')
  await expect(page.getByText('Nenhum pedido encontrado.')).toBeVisible()
  await action(page, 'confirm-order')
  await expect(page.locator('.realtime-status')).toHaveAttribute('data-order-events', '0')
  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Pedido não encontrado' })).toBeVisible()
  await logout(page)
  await login(page)
  await page.goto(url)
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
})

test('confirmação remove somente a quantidade comprada e conserva adições posteriores', async ({
  page,
}) => {
  await prepareCheckout(page)
  await scenario(page, 'order-pending')
  await connectWallet(page)
  await confirmButton(page).click()
  await expect(page.getByRole('heading', { name: 'Pedido pendente' })).toBeVisible()
  const url = page.url()
  await addNft(page)
  await action(page, 'confirm-order')
  await page.goto(url)
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  await page.goto('/cart')
  await expect(page.locator('.quantity').filter({ visible: true }).locator('output')).toHaveText(
    '1',
  )
  await expect(page.locator('.summary-total')).toContainText('1.206 ETH')
})

test('taxas e cupom são revalidados, sem confirmar cotação antiga', async ({ page }) => {
  await prepareCheckout(page)
  await connectWallet(page)
  await action(page, 'fee-up')
  await expect(page.locator('.summary-total').filter({ visible: true })).toContainText('1.207 ETH')
  await expect(confirmButton(page)).toBeDisabled()
  await page.goto('/cart')
  await page.getByRole('textbox', { name: 'Código promocional', exact: true }).fill('KURIO10')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.locator('.summary-total')).toContainText('1.088 ETH')
  await page.getByRole('link', { name: 'Conectar e finalizar', exact: true }).click()
  await connectWallet(page)
  await action(page, 'coupon-expired')
  await expect(page.getByRole('heading', { name: 'Revise seu carrinho' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('cupom expirou')
})

test('nft.updated passa pelo socket e exige revisão dos novos valores', async ({ page }) => {
  await prepareCheckout(page)
  await connectWallet(page)
  await action(page, 'price-up')
  await expect
    .poll(async () =>
      Number(await page.locator('.realtime-status').getAttribute('data-nft-events')),
    )
    .toBeGreaterThan(0)
  await expect(page.locator('.summary-total').filter({ visible: true })).toContainText('1.306 ETH')
  await expect(confirmButton(page)).toBeDisabled()
  await page
    .getByRole('button', { name: 'Revisar novos valores', exact: true })
    .filter({ visible: true })
    .click()
  await confirmButton(page).click()
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  await expect(page.locator('.receipt-card')).toContainText('1.306 ETH')
})

test('pedido pendente recupera por refresh e reconexão sem criar nova compra', async ({ page }) => {
  await prepareCheckout(page)
  await scenario(page, 'order-pending')
  await connectWallet(page)
  await confirmButton(page).click()
  await expect(page.getByRole('heading', { name: 'Pedido pendente' })).toBeVisible()
  const url = page.url()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Pedido pendente' })).toBeVisible()
  await action(page, 'disconnect')
  await expect(page.locator('.realtime-status')).toContainText('desconectado')
  await action(page, 'confirm-order')
  await expect(page.getByRole('heading', { name: 'Pedido pendente' })).toBeVisible()
  await action(page, 'reconnect')
  await expect(page.locator('.realtime-status')).toHaveText('Tempo real conectado')
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  await expect(page).toHaveURL(url)
})
