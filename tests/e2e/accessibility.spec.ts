import AxeBuilder from '@axe-core/playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import { addNft, login, reset } from '../helpers/flows.js'
import { settleVisual } from '../helpers/visual.js'
import { connectWallet, confirmButton, prepareCheckout } from '../helpers/checkout.js'

test.beforeEach(async ({ page }) => {
  await reset(page)
})

test('acessibilidade das nove telas e sem overflow com texto ampliado', async ({ page }, info) => {
  test.setTimeout(90_000) // Nove auditorias axe completas e navegação por APIs reais.
  await login(page)
  await addNft(page)
  for (const route of [
    '/',
    '/nfts/emerald-ape-042',
    '/cart',
    '/checkout',
    '/order-preview',
    '/login',
    '/signup',
    '/profile',
    '/wallets',
  ]) {
    await page.goto(route)
    await settleVisual(page)
    const result = await new AxeBuilder({ page }).analyze()
    const directory = `reports/accessibility/${info.project.name}`
    await mkdir(directory, { recursive: true })
    await writeFile(
      `${directory}/${route.replace(/\W/g, '-') || 'home'}.json`,
      JSON.stringify(result, null, 2),
    )
    await info.attach(`axe-${route.replace(/\W/g, '-') || 'home'}`, {
      body: JSON.stringify(result, null, 2),
      contentType: 'application/json',
    })
    expect.soft(result.violations, `Violações em ${route}`).toEqual([])
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `Texto ampliado em ${route}`,
    ).toBe(true)
  }
})

test('erros associados, foco visível e preferência de movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('invalido@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Incorreta123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.goto('/signup')
  await page.getByRole('textbox', { name: 'Nome de usuário' }).fill('novo')
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('novo@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Diferente123!')
  await page.getByRole('button', { name: /^(Criar conta|Criar perfil)$/ }).click()
  const invalid = page.getByLabel('Confirmar senha', { exact: true })
  await expect(invalid).toHaveAttribute('aria-invalid', 'true')
  const description = await invalid.getAttribute('aria-describedby')
  expect(description).toBeTruthy()
  await expect(page.locator(`[id="${description}"]`)).toContainText(/senha/i)
  await invalid.focus()
  await page.keyboard.press('Tab')
  expect(
    await page.locator(':focus').evaluate((element) => getComputedStyle(element).outlineStyle),
  ).not.toBe('none')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.goto('/system')
  await page.waitForFunction(() => !!window.kurioMocks)
  await page.evaluate(() => window.kurioMocks!.scenario('slow'))
  await page.goto('/nfts/emerald-ape-042')
  const skeleton = page.locator('[data-slot="skeleton"]').first()
  await expect(skeleton).toBeVisible()
  expect(
    await skeleton.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element, '::after').animationDuration),
    ),
  ).toBeLessThanOrEqual(0.01)
})

test('recibo confirmado é acessível e o explorador permanece simulado', async ({ page }) => {
  await prepareCheckout(page)
  await connectWallet(page)
  await confirmButton(page).click()
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: 'Ver no Etherscan (simulado)', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Explorador simulado.' })).toBeVisible()
})
