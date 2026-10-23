import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const distDir = path.resolve('dist')
const siteUrl = (process.env.VITE_SITE_URL || 'https://pennywsiethecoder.github.io/Apaterra').replace(/\/$/, '')
const sitePath = new URL(siteUrl).pathname.replace(/\/$/, '')
const defaultDescription = 'Shop thoughtful hair care for curls, coils, locs and protective styles. Rooted in Ghana and organised around your hair needs.'

const publicPages = [
  { route: '', title: 'Apa Terra | Natural Care for Textured Hair', description: defaultDescription },
  { route: 'shop', title: 'Shop Textured Hair Care | Apa Terra', description: 'Explore shampoos, treatments, oils and styling products for African-textured hair.' },
  { route: 'hair-needs', title: 'Shop by Hair Need | Apa Terra', description: 'Find textured-hair products for moisture, breakage, scalp care, protective styles and definition.' },
  { route: 'routines', title: 'Hair-Care Routines | Apa Terra', description: 'Build a simple wash-day and daily-care routine for curls, coils, locs and protective styles.' },
  { route: 'story', title: 'Our Story | Apa Terra', description: 'Discover why Apa Terra puts African-textured hair needs first.' },
  { route: 'delivery', title: 'Delivery Information | Apa Terra', description: 'Learn how Apa Terra delivery, order confirmation and pay on delivery work across Ghana.' },
  { route: 'returns', title: 'Returns Policy | Apa Terra', description: 'Read the Apa Terra returns process for damaged, incorrect and unopened products.' },
  { route: 'privacy', title: 'Privacy Policy | Apa Terra', description: 'Learn how Apa Terra collects, uses and protects account and order information.' },
  { route: 'terms', title: 'Store Terms | Apa Terra', description: 'Read the terms that apply when browsing and ordering from Apa Terra.' },
  { route: 'contact', title: 'Contact Apa Terra', description: 'Find official Apa Terra customer-care and social channels.' },
]

const privatePages = [
  { route: 'login', title: 'Sign In | Apa Terra', description: 'Sign in or create your Apa Terra account.' },
  { route: 'account', title: 'Your Account | Apa Terra', description: 'Manage your Apa Terra profile and orders.' },
  { route: 'checkout', title: 'Checkout | Apa Terra', description: 'Confirm your Apa Terra pay-on-delivery order.' },
  { route: 'admin', title: 'Admin | Apa Terra', description: 'Apa Terra store administration.' },
]

const fallbackProducts = [
  ['moisture-wash', 'Moisture Wash', 'A gentle, creamy cleanser that lifts buildup without leaving textured hair feeling stripped.'],
  ['softening-treatment', 'Softening Treatment', 'A rich conditioning treatment created to improve softness, slip and manageability.'],
  ['rooted-drops', 'Rooted Drops', 'A lightweight botanical oil for dry scalps, protective styles and sealing in moisture.'],
  ['daily-veil', 'Daily Veil', 'A weightless leave-in that restores softness and prepares curls and coils for styling.'],
  ['balance-cleanse', 'Balance Cleanse', 'A targeted cleanser that refreshes the scalp and removes product buildup while respecting the hair.'],
  ['coil-custard', 'Coil Custard', 'A soft-hold styling custard for defined twist-outs, braid-outs and wash-and-go styles.'],
  ['strength-rinse', 'Strength Rinse', 'A strengthening rinse-out conditioner for fragile strands and hair prone to breakage.'],
  ['braid-mist', 'Braid Mist', 'A fine hydrating mist that refreshes braids, twists and locs without heavy residue.'],
].map(([id, name, description]) => ({ id, name, description, image_url: '', price: '' }))

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function escapeXml(value = '') {
  return escapeHtml(value).replaceAll("'", '&apos;')
}

async function loadProducts() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim()
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!supabaseUrl || !supabaseKey) return fallbackProducts

  try {
    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    const [productsResponse, settingsResponse] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/products?select=id,name,description,image_url,price&active=eq.true`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/catalog_settings?select=starter_catalog_imported&id=eq.main`, { headers }),
    ])
    if (!productsResponse.ok) return fallbackProducts
    const databaseProducts = await productsResponse.json()
    const catalogueSettings = settingsResponse.ok ? await settingsResponse.json() : []
    if (catalogueSettings[0]?.starter_catalog_imported) return databaseProducts
    const merged = new Map(fallbackProducts.map((product) => [product.id, product]))
    databaseProducts.forEach((product) => merged.set(product.id, product))
    return [...merged.values()]
  } catch {
    return fallbackProducts
  }
}

function renderHtml(template, page, shareImage) {
  const routePath = page.route ? `/${page.route}` : '/'
  const canonical = `${siteUrl}${routePath}`
  const title = escapeHtml(page.title)
  const description = escapeHtml(page.description)
  const image = escapeHtml(page.image_url || shareImage)
  const robots = page.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'

  return template
    .replace(/<title>.*?<\/title>/s, `<title>${title}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}" />`)
    .replace(/<meta name="robots"[^>]*>/, `<meta name="robots" content="${robots}" />`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${page.type || 'website'}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${image}" />`)
    .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${description}" />`)
    .replace(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${image}" />`)
}

const template = await readFile(path.join(distDir, 'index.html'), 'utf8')
const assetFiles = await readdir(path.join(distDir, 'assets'))
const shareAsset = assetFiles.find((name) => /^apaterra-hero-v4-.*\.jpg$/i.test(name))
const shareImage = shareAsset ? `${siteUrl}/assets/${shareAsset}` : `${siteUrl}/apaterra-favicon.png`
const products = await loadProducts()
const productPages = products.map((product) => ({
  route: `products/${encodeURIComponent(product.id)}`,
  title: `${product.name} | Apa Terra`,
  description: product.description || `Shop ${product.name} from Apa Terra.`,
  image_url: product.image_url,
  type: 'product',
}))

const routePages = [
  ...publicPages,
  ...productPages,
  ...privatePages.map((page) => ({ ...page, noIndex: true })),
]

for (const page of routePages) {
  const html = renderHtml(template, page, shareImage)
  if (!page.route) {
    await writeFile(path.join(distDir, 'index.html'), html)
    continue
  }
  const routeDirectory = path.join(distDir, ...page.route.split('/'))
  await mkdir(routeDirectory, { recursive: true })
  await writeFile(path.join(routeDirectory, 'index.html'), html)
}

await copyFile(path.join(distDir, 'index.html'), path.join(distDir, '404.html'))

const sitemapPages = [...publicPages, ...productPages]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPages.map((page) => `  <url><loc>${escapeXml(`${siteUrl}${page.route ? `/${page.route}` : '/'}`)}</loc></url>`).join('\n')}
</urlset>
`
await writeFile(path.join(distDir, 'sitemap.xml'), sitemap)
await writeFile(path.join(distDir, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: ${sitePath}/account\nDisallow: ${sitePath}/admin\nDisallow: ${sitePath}/checkout\nDisallow: ${sitePath}/login\nSitemap: ${siteUrl}/sitemap.xml\n`)

console.log(`Generated SEO entries for ${publicPages.length} pages and ${productPages.length} products.`)
