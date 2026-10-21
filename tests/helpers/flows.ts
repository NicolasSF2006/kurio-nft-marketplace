import { expect, type Page } from '@playwright/test'
import type { ScenarioName } from '../../src/types/api.js'

export async function reset(page: Page, scenario: ScenarioName = 'default') {
  await page.goto('/system')
  await page.waitForFunction(() => !!window.kurioMocks)
  await page.evaluate(async (name) => {
    await window.kurioMocks!.reset(name)
  }, scenario)
  await page.goto('/')
  await page.waitForFunction(() => !!window.kurioMocks)
}
export async function scenario(page: Page, name: ScenarioName) {
  await page.waitForFunction(() => !!window.kurioMocks)
  await page.evaluate(async (value) => {
    await window.kurioMocks!.scenario(value)
  }, name)
}
export async function login(page: Page, email = 'nova@kurio.test', password = 'Kurio123!') {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(email)
}
export async function addNft(page: Page, nftId = 'emerald-ape-042') {
  await page.goto(`/nfts/${nftId}`)
  const button = page
    .getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ })
    .filter({ visible: true })
  await button.click()
  await expect(
    page.getByRole('status').filter({ hasText: 'NFT adicionado ao carrinho.' }),
  ).toBeVisible()
}
export async function logout(page: Page) {
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
}
