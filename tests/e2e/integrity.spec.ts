import { test, expect } from '@playwright/test'
import { login, logout, reset } from '../helpers/flows.js'
import { prepareCheckout, connectWallet, confirmButton } from '../helpers/checkout.js'

test.beforeEach(async ({ page }) => {
  await reset(page)
})

test('sessão não expõe hash; persistência sem senha clara e redirecionamento local', async ({
  page,
}) => {
  const response = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/auth/login',
  )
  await login(page)
  const payload = await (await response).json()
  expect(Object.keys(payload).sort()).toEqual(['expiresAt', 'token', 'user'])
  expect(JSON.stringify(payload)).not.toMatch(/password|salt|hash/i)
  const stored = await page.evaluate(() => localStorage.getItem('kurio.mock.database.v3'))
  expect(stored).toBeTruthy()
  expect(stored).not.toContain('Kurio123!')
  await logout(page)
  expect(await page.evaluate(() => localStorage.getItem('kurio.session.token'))).toBeNull()
  await page.goto('/login?redirect=https%3A%2F%2Fexample.com')
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('nova@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/profile$/)
})

test('cotação expirada exige atualização e revisão antes de enviar', async ({ page }) => {
  await page.clock.install()
  await prepareCheckout(page)
  await connectWallet(page)
  let creates = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/orders' && request.method() === 'POST') creates++
  })
  await expect(confirmButton(page)).toBeEnabled()
  // Avança timers de expiração sem esperar dois minutos reais. Sessão continua válida.
  await page.clock.fastForward(121_000)
  await expect(
    page.getByRole('alert').filter({ hasText: 'A cotação expirou.' }).filter({ visible: true }),
  ).toBeVisible()
  await expect(confirmButton(page)).toBeDisabled()
  await page
    .getByRole('button', { name: 'Atualizar cotação', exact: true })
    .filter({ visible: true })
    .click()
  await page
    .getByRole('button', { name: 'Revisar novos valores', exact: true })
    .filter({ visible: true })
    .click()
  await expect(confirmButton(page)).toBeEnabled()
  expect(creates).toBe(0)
  await confirmButton(page).click()
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  expect(creates).toBe(1)
})
