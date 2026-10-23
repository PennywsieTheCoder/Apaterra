import { expect, test } from '@playwright/test'

const site = process.env.APATERRA_TEST_SITE || 'http://127.0.0.1:5173/'
const routeUrl = (path = '') => new URL(path.replace(/^\//, ''), site).toString()

async function signIn(page) {
  const email = process.env.APATERRA_TEST_EMAIL
  const password = process.env.APATERRA_TEST_PASSWORD
  test.skip(!email || !password, 'Authenticated audit credentials were not provided')

  await page.goto(routeUrl('login'))
  await page.getByPlaceholder('Email address').fill(email)
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/shop\/?$/, { timeout: 15_000 })
}

test('public sections load without browser errors', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('pageerror', (error) => browserErrors.push(error.message))

  for (const route of ['', 'shop', 'hair-needs', 'routines', 'story', 'delivery', 'returns', 'privacy', 'terms', 'contact']) {
    await page.goto(routeUrl(route))
    await expect(page.locator('.route-skeleton')).toHaveCount(0)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.locator('h1').first()).toBeVisible()
  }

  expect(browserErrors).toEqual([])
})

test('public pages and products expose route-specific SEO metadata', async ({ page }) => {
  await page.goto(routeUrl('shop/'))
  await expect(page).toHaveTitle('Shop Textured Hair Care | Apa Terra')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /shampoos, treatments, oils/i)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/shop$/)
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')

  await page.locator('.product-image-link').first().click()
  await expect(page).toHaveURL(/\/products\//)
  await expect(page).toHaveTitle(/\| Apa Terra$/)
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'product')
  await expect(page.locator('meta[property="product:price:currency"]')).toHaveAttribute('content', 'GHS')
  const structuredData = await page.locator('#apaterra-structured-data').textContent()
  expect(JSON.parse(structuredData).some((entry) => entry['@type'] === 'Product')).toBe(true)
})

test('legacy hash links redirect to clean URLs', async ({ page }) => {
  await page.goto(`${routeUrl()}#/shop`)
  await expect(page).toHaveURL(/\/shop\/?$/)
  await expect(page).toHaveTitle('Shop Textured Hair Care | Apa Terra')
})

test('shop, product details, cart and dark mode work', async ({ page }) => {
  await page.goto(routeUrl('shop'))
  await expect(page.locator('.product-card').first()).toBeVisible()
  expect(await page.locator('.product-card').count()).toBeGreaterThan(0)

  const addButton = page.locator('.product-add-button:not([disabled])').first()
  await addButton.click()
  await expect(page.getByRole('button', { name: /Shopping cart with 1 items/i })).toBeVisible()
  await expect(page.locator('.cart-layer')).not.toHaveClass(/is-open/)
  await page.getByRole('button', { name: 'View cart' }).click()
  await expect(page.getByRole('link', { name: 'Continue to checkout' })).toBeVisible()

  await page.getByRole('button', { name: 'Continue shopping' }).click()
  const desktopThemeToggle = page.getByRole('button', { name: 'Switch to dark mode' }).first()
  if (await desktopThemeToggle.isVisible()) {
    await desktopThemeToggle.click()
  } else {
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page.locator('.mobile-menu-tools button').filter({ hasText: 'Dark mode' }).click()
    await page.getByRole('button', { name: 'Close navigation' }).click()
  }
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.locator('.product-image-link').first().click()
  await expect(page).toHaveURL(/\/products\//)
  await expect(page.locator('.product-detail h1')).toBeVisible()
})

test('cart can be cleared only after confirmation', async ({ page }) => {
  await page.goto(routeUrl('shop'))
  await expect(page.locator('.product-card').first()).toBeVisible()
  await page.locator('.product-add-button:not([disabled])').first().click()
  await expect(page.getByRole('button', { name: /Shopping cart with 1 items/i })).toBeVisible()
  await page.getByRole('button', { name: /Shopping cart with 1 items/i }).click()

  await page.getByRole('button', { name: 'Clear cart' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('button', { name: 'Keep items' }).click()
  await expect(page.getByRole('button', { name: /Shopping cart with 1 items/i })).toBeVisible()

  await page.getByRole('button', { name: 'Clear cart' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Clear cart' }).click()
  await expect(page.getByRole('button', { name: /Shopping cart with 0 items/i })).toBeVisible()
})

test('mobile cart uses one contained product-list scroll area', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(routeUrl('shop'))
  await expect(page.locator('.product-card').first()).toBeVisible()
  const addButtons = page.locator('.product-add-button:not([disabled])')
  for (let index = 0; index < 4; index += 1) await addButtons.nth(index).click()

  await page.getByRole('button', { name: /Shopping cart with 4 items/i }).click()
  await expect(page.locator('.cart-layer')).toHaveClass(/is-open/)
  const layout = await page.evaluate(() => {
    const drawer = document.querySelector('.cart-drawer')
    const items = document.querySelector('.cart-items')
    return {
      bodyOverflow: document.body.style.overflow,
      rootOverflow: document.documentElement.style.overflow,
      drawerHeight: drawer.getBoundingClientRect().height,
      viewportHeight: window.innerHeight,
      itemsCanScroll: items.scrollHeight > items.clientHeight,
    }
  })
  expect(layout.bodyOverflow).toBe('hidden')
  expect(layout.rootOverflow).toBe('hidden')
  expect(layout.drawerHeight).toBeLessThanOrEqual(layout.viewportHeight + 1)
  expect(layout.itemsCanScroll).toBe(true)
})

test('protected checkout redirects visitors and login validates empty fields', async ({ page }) => {
  await page.goto(routeUrl('checkout'))
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: 'Care starts here.' })).toBeVisible()
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
})

test('mobile navigation fits the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const route of ['', 'shop', 'hair-needs', 'routines', 'story', 'delivery', 'returns', 'privacy', 'terms', 'contact']) {
    await page.goto(routeUrl(route))
    await expect(page.locator('.route-skeleton')).toHaveCount(0)
    const sizes = await page.evaluate(() => ({ viewport: window.innerWidth, content: document.documentElement.scrollWidth }))
    expect(sizes.content).toBeLessThanOrEqual(sizes.viewport + 1)
  }

  await page.goto(routeUrl())
  const darkModeButton = page.getByRole('button', { name: 'Switch to dark mode' }).first()
  if (await darkModeButton.isVisible()) await darkModeButton.click()
  const menuButton = page.getByRole('button', { name: 'Open navigation' })
  await expect(menuButton).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(page.locator('.mobile-menu.is-open')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close navigation' })).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(page.locator('.menu-button span').first()).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
})

test('authenticated customer and admin sections are reachable', async ({ page }) => {
  await signIn(page)

  await page.getByRole('button', { name: 'Open notifications' }).first().click()
  await expect(page.locator('.header-notification-popover')).toBeVisible()
  await page.getByRole('button', { name: 'Open notifications' }).first().click()

  await page.goto(routeUrl('account'))
  await expect(page.locator('.route-skeleton')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'User Profile' })).toBeVisible()

  const profileSections = [
    ['User info', 'profile-panel-user-info'],
    ['Favorites', 'profile-panel-favorites'],
    ['Orders', 'profile-panel-orders'],
    ['Delivery addresses', 'profile-panel-delivery'],
    ['Settings', 'profile-panel-setting'],
    ['Notifications', 'profile-panel-notifications'],
  ]

  for (const [label, panelId] of profileSections) {
    await page.getByRole('tab', { name: label }).click()
    await expect(page.locator(`#${panelId}`)).toBeVisible()
  }

  await page.goto(routeUrl('shop'))
  await expect(page.locator('.route-skeleton')).toHaveCount(0)
  const favoriteButton = page.locator('.product-save-button').first()
  await expect(favoriteButton).toBeEnabled()
  const originallySaved = await favoriteButton.getAttribute('aria-pressed') === 'true'
  const originalLabel = await favoriteButton.getAttribute('aria-label')
  const productName = originalLabel.replace(/^(Save|Remove) /, '').replace(/ (to|from) favorites$/, '')
  await favoriteButton.click()
  await expect(favoriteButton).toHaveAttribute('aria-pressed', String(!originallySaved))
  await expect(page.getByRole('status').filter({ hasText: `${productName} ${originallySaved ? 'removed from' : 'saved to'} Favorites.` })).toBeVisible()
  await page.reload()
  await expect(page.locator('.route-skeleton')).toHaveCount(0)
  const persistedFavoriteCard = page.locator('.product-card').filter({
    has: page.getByRole('heading', { name: productName, exact: true }),
  })
  const persistedFavoriteButton = persistedFavoriteCard.locator('.product-save-button')
  await expect(persistedFavoriteButton).toHaveAttribute('aria-pressed', String(!originallySaved))
  await persistedFavoriteButton.click()
  await expect(persistedFavoriteButton).toHaveAttribute('aria-pressed', String(originallySaved))
  await expect(page.getByRole('status').filter({ hasText: `${productName} ${originallySaved ? 'saved to' : 'removed from'} Favorites.` })).toBeVisible()

  await page.locator('.product-add-button:not([disabled])').first().click()
  await page.getByRole('button', { name: /Shopping cart with 1 items/i }).click()
  await page.getByRole('link', { name: 'Continue to checkout' }).click()
  await expect(page.getByRole('heading', { name: 'Order summary' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Place order/i })).toBeVisible()

  await page.goto(routeUrl('admin'))
  await expect(page.locator('.route-skeleton')).toHaveCount(0)
  await expect(page).toHaveURL(/\/admin\/?$/)
  await expect(page.getByRole('heading', { name: /^Hello,/ })).toBeVisible()
  const adminSections = [
    ['Dashboard', 'Store Revenue'],
    ['Sales & Reports', 'Product Sales & Revenue Report'],
    ['Orders', /^Customer Orders/],
    ['Delivery', 'Delivery Rules'],
    ['Business', 'Business Settings'],
    ['Add Product', 'Add & Manage Storefront Products'],
  ]

  for (const [tabName, headingName] of adminSections) {
    await page.getByRole('tab', { name: tabName, exact: true }).click()
    await expect(page.getByRole('heading', { name: headingName }).first()).toBeVisible()
  }
})
