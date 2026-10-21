import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import { addNft, login, reset } from '../helpers/flows.js'
import { settleVisual } from '../helpers/visual.js'
import { connectWallet, registerWallet } from '../helpers/checkout.js'

test.beforeEach(async ({ page }) => {
  await reset(page)
})

const screens = [
  { name: 'home', url: '/', title: 'Kurio NFT Marketplace' },
  { name: 'detail', url: '/nfts/emerald-ape-042', title: 'Emerald Ape #042' },
  { name: 'cart', url: '/cart', title: 'Carrinho de NFTs' },
  { name: 'checkout', url: '/checkout', title: 'Pagamento' },
  { name: 'confirmation', url: '/order-preview', title: 'Prévia visual do recibo' },
  { name: 'login', url: '/login', title: 'Entrar' },
  { name: 'signup', url: '/signup', title: 'Criar perfil de colecionador' },
  { name: 'profile', url: '/profile', title: 'Perfil do colecionador' },
  { name: 'wallets', url: '/wallets', title: 'Carteira principal' },
]

test('mantém foco nos diálogos e permite fechá-los pelo teclado', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium-desktop') {
    await page.goto('/nfts/emerald-ape-042')
    const trigger = page.getByRole('button', { name: 'Ampliar imagem' })
    await trigger.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Fechar imagem ampliada' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  } else {
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Abrir filtros' })
    await trigger.click()
    await expect(page.getByRole('dialog', { name: 'Filtrar NFTs' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  }
})

test('renderiza as nove páginas com assets locais, sem overflow ou erros', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const directory = path.join('reports/visual', testInfo.project.name)
  await mkdir(directory, { recursive: true })
  await login(page)
  await registerWallet(page)
  await addNft(page)
  await addNft(page, 'violet-nomad-314')
  await addNft(page, 'ivory-baron-088')
  for (const screen of screens) {
    await test.step(screen.name, async () => {
      await page.goto(screen.url)
      await settleVisual(page)
      if (screen.name === 'checkout') await connectWallet(page)
      if (screen.name === 'checkout' && testInfo.project.name !== 'chromium-desktop') {
        await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
      } else {
        await expect(page.getByRole('heading', { name: screen.title, exact: true })).toBeVisible()
      }
      if (screen.name === 'home') await expect(page.locator('.home-hero')).toBeVisible()
      if (screen.name === 'checkout' && testInfo.project.name === 'chromium-desktop')
        await expect(page.getByRole('combobox', { name: 'Nome ENS', exact: true })).toBeVisible()
      if (['login', 'signup'].includes(screen.name))
        await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toBeInViewport()
      if (!['profile', 'wallets'].includes(screen.name)) {
        if (
          !['login', 'signup'].includes(screen.name) ||
          testInfo.project.name === 'chromium-desktop'
        )
          await expect(page.locator('img[src$="8f387.png"]').first()).toBeAttached()
      }
      await page.evaluate(async () => {
        await document.fonts.ready
        Array.from(document.images).forEach((image) => {
          image.loading = 'eager'
        })
        await Promise.all(
          Array.from(document.images)
            .filter((image) => image.getBoundingClientRect().width > 0)
            .map((image) => image.decode().catch(() => undefined)),
        )
      })
      const brokenImages = await page
        .locator('img')
        .evaluateAll((images) =>
          images
            .filter(
              (image) =>
                image instanceof HTMLImageElement &&
                image.getBoundingClientRect().width > 0 &&
                (!image.complete || image.naturalWidth === 0),
            )
            .map((image) => image.getAttribute('src')),
        )
      expect(brokenImages).toEqual([])
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true)
      await page.screenshot({
        path: path.join(directory, `${screen.name}.png`),
        fullPage: testInfo.project.name === 'chromium-desktop',
        animations: 'disabled',
      })
    })
  }
  expect(errors).toEqual([])
})

test('navega entre telas com carrinho e autenticação, exigindo carteira para confirmar', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Ver Emerald Ape #042', exact: true }).click()
  await expect(page).toHaveURL(/\/nfts\/emerald-ape-042$/)
  await page
    .getByRole('button', {
      name: testInfo.project.name === 'chromium-desktop' ? 'COMPRAR' : 'Comprar NFT',
      exact: true,
    })
    .click()
  await expect(page.getByText('NFT adicionado ao carrinho.', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/nfts\/emerald-ape-042$/)
  await page.goto('/cart')
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('nova@kurio.test')
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(
    page.getByRole('button', { name: 'Confirmar compra', exact: true }).filter({ visible: true }),
  ).toBeDisabled()
  await expect(
    page
      .getByText('Cadastre uma carteira para continuar.', { exact: false })
      .filter({ visible: true }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/checkout$/)
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('colecionador@example.test')
  await page.getByLabel('Senha', { exact: true }).fill('apenas-interface')
  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click()
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos')
  await expect(page).toHaveURL(/\/login(?:\?|$)/)
  await page.goto('/signup')
  await expect(page.getByRole('heading', { name: 'Criar perfil de colecionador' })).toBeVisible()
})

test('captura os seis frames mobile em 414 × 896 para comparação com o Figma', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'Referência mobile específica do Figma')
  await page.setViewportSize({ width: 414, height: 896 })
  await login(page)
  await registerWallet(page)
  await addNft(page)
  await addNft(page, 'violet-nomad-314')
  await addNft(page, 'ivory-baron-088')
  const directory = path.join('reports/visual', 'figma-mobile-414')
  await mkdir(directory, { recursive: true })
  for (const screen of screens.filter((screen) =>
    ['home', 'detail', 'cart', 'checkout', 'login', 'signup'].includes(screen.name),
  )) {
    await page.goto(screen.url)
    await settleVisual(page)
    if (screen.name === 'checkout') await connectWallet(page)
    await expect(page.locator('main, [role="dialog"]').first()).toBeAttached()
    await expect(
      page.getByRole('heading', {
        name: screen.name === 'checkout' ? 'Pagamento com carteira' : screen.title,
        exact: true,
      }),
    ).toBeVisible()
    if (screen.name === 'home') await expect(page.locator('.home-hero')).toBeVisible()
    if (['login', 'signup'].includes(screen.name))
      await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toBeInViewport()
    await page.evaluate(async () => {
      await document.fonts.ready
      Array.from(document.images).forEach((image) => {
        image.loading = 'eager'
      })
      await Promise.all(
        Array.from(document.images)
          .filter((image) => image.getBoundingClientRect().width > 0)
          .map((image) => image.decode().catch(() => undefined)),
      )
    })
    await page.screenshot({
      path: path.join(directory, `${screen.name}.png`),
      animations: 'disabled',
    })
  }
})
