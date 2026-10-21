import { test, expect } from '@playwright/test'
import { addNft, reset } from '../helpers/flows.js'
import { connectWallet, prepareCheckout } from '../helpers/checkout.js'
import { settleVisual } from '../helpers/visual.js'

test.beforeEach(async ({ page }) => {
  await reset(page)
})

for (const screen of ['home', 'detail', 'cart', 'checkout'] as const) {
  test(`regressão visual: ${screen}`, async ({ page }, info) => {
    if (screen === 'checkout') {
      await prepareCheckout(page)
      await connectWallet(page)
    } else {
      if (screen === 'cart') {
        await addNft(page)
        await addNft(page, 'violet-nomad-314')
        await addNft(page, 'ivory-baron-088')
      }
      await page.goto(
        screen === 'home' ? '/' : screen === 'detail' ? '/nfts/emerald-ape-042' : '/cart',
      )
    }
    await settleVisual(page)
    if (screen === 'home') {
      const copy = await page.locator('.hero-description').boundingBox()
      const artwork = await page.locator('.hero-art > img').first().boundingBox()
      expect(copy && artwork && copy.x + copy.width <= artwork.x).toBe(true)
    }
    await expect(page).toHaveScreenshot(`${screen}.png`, { fullPage: true })
    if (info.project.name === 'chromium-mobile') {
      await page.setViewportSize({ width: 414, height: 896 })
      await settleVisual(page)
      await expect(page).toHaveScreenshot(`${screen}-414.png`, { fullPage: true })
    }
  })
}
