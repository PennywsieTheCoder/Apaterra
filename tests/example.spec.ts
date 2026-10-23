import { test, expect } from '@playwright/test'

test('visitor can browse products and add one to the cart', async ({ page }) => {
  await page.goto('/shop')

  await expect(
    page.getByRole('heading', { name: 'Shop by product or hair need.' })
  ).toBeVisible()

  await page.getByRole('button', { name: 'Add to cart' }).first().click()

  await expect(
    page.getByRole('button', { name: /Shopping cart with 1 items/i })
  ).toBeVisible()
})

test('visitor is redirected to login when opening checkout', async ({ page }) => {
  await page.goto('/checkout')

  await expect(page).toHaveURL(/#\/login/)
  await expect(
    page.getByRole('heading', { name: 'Care starts here.' })
  ).toBeVisible()
})
