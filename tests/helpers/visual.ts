import { expect, type Page } from '@playwright/test'

export async function settleVisual(page: Page) {
  await expect(page.locator('.realtime-status')).toHaveText('Tempo real conectado')
  await expect(
    page.locator('[aria-label="Carregando dados"], [aria-label="Carregando conteúdo"]'),
  ).toHaveCount(0)
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
  await page.mouse.move(0, 0)
  await page.evaluate(async () => {
    await document.fonts.ready
    for (const image of document.images) image.loading = 'eager'
    await Promise.all(
      Array.from(document.images)
        .filter((image) => image.getBoundingClientRect().width > 0)
        .map((image) => image.decode()),
    )
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}
