import { test, expect } from '@playwright/test'

test('abre o Kurio e navega com REST e Socket.IO pelos mocks', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('/')
  await expect(page).toHaveTitle('Kurio | NFT Marketplace')
  await expect(page.getByRole('heading', { name: 'Kurio NFT Marketplace' })).toBeVisible()
  await page.getByRole('link', { name: 'Verificar infraestrutura' }).click()
  await expect(page).toHaveURL(/\/system$/)
  await expect(page.getByText('API kurio: ok', { exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Socket.IO: evento de diagnóstico recebido.')
  await page.reload()
  await expect(page.getByText('API kurio: ok', { exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Socket.IO: evento de diagnóstico recebido.')
  await page.getByRole('button', { name: 'Consultar novamente' }).click()
  await expect(page.getByRole('button', { name: 'Consultar novamente' })).toBeEnabled()
  expect(pageErrors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('trata rota inexistente e permite voltar ao início', async ({ page }) => {
  await page.goto('/rota-inexistente')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page.getByRole('heading', { name: 'Kurio NFT Marketplace' })).toBeVisible()
})
