import { expect, type Page } from '@playwright/test'
import { addNft, login } from './flows.js'
import type { MockAction } from '../../src/types/orders.js'

export async function action(page: Page, action: MockAction) {
  await page.waitForFunction(() => !!window.kurioMocks)
  if (['price-up', 'sold-out', 'fee-up', 'coupon-expired', 'duplicate', 'old'].includes(action))
    await expect(page.locator('.realtime-status')).toHaveText('Tempo real conectado')
  await page.evaluate(async (value) => {
    await window.kurioMocks!.action(value)
  }, action)
}
export async function registerWallet(page: Page) {
  await page.goto('/wallets')
  await page.getByRole('textbox', { name: 'Apelido da carteira', exact: true }).fill('Principal')
  await page
    .getByRole('textbox', { name: 'Endereço da carteira', exact: true })
    .fill('0x1111111111111111111111111111111111111111')
  await page.getByRole('button', { name: 'Salvar carteira principal', exact: true }).click()
  await expect(page.getByText('Carteira salva.', { exact: true })).toBeVisible()
}
export async function prepareCheckout(page: Page) {
  await login(page)
  await registerWallet(page)
  await addNft(page)
  await page.goto('/cart')
  await page.getByRole('link', { name: 'Conectar e finalizar', exact: true }).click()
  await expect(page.locator('.realtime-status')).toHaveText('Tempo real conectado')
}
export async function connectWallet(page: Page) {
  await page
    .getByRole('button', { name: 'Conectar carteira', exact: true })
    .filter({ visible: true })
    .click()
  await expect(
    page.getByText('Carteira conectada na simulação.', { exact: true }).filter({ visible: true }),
  ).toBeVisible()
}
export const confirmButton = (page: Page) =>
  page.getByRole('button', { name: 'Confirmar compra', exact: true }).filter({ visible: true })
