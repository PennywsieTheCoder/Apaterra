import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import shareImage from '../assets/apaterra-hero-v4.jpg'
import { useBusinessSettings } from '../context/business-settings-store'
import { useCatalog } from '../context/catalog-store'
import { getInventoryState } from '../lib/inventory'
import { getSafeExternalUrl } from '../lib/businessSettings'

const DEFAULT_TITLE = 'Apa Terra | Natural Care for Textured Hair'
const DEFAULT_DESCRIPTION = 'Shop thoughtful hair care for curls, coils, locs and protective styles. Rooted in Ghana and organised around your hair needs.'

const pageMetadata = {
  '/': { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  '/shop': { title: 'Shop Textured Hair Care | Apa Terra', description: 'Explore shampoos, treatments, oils and styling products for African-textured hair.' },
  '/hair-needs': { title: 'Shop by Hair Need | Apa Terra', description: 'Find textured-hair products for moisture, breakage, scalp care, protective styles and definition.' },
  '/routines': { title: 'Hair-Care Routines | Apa Terra', description: 'Build a simple wash-day and daily-care routine for curls, coils, locs and protective styles.' },
  '/story': { title: 'Our Story | Apa Terra', description: 'Discover why Apa Terra puts African-textured hair needs first.' },
  '/delivery': { title: 'Delivery Information | Apa Terra', description: 'Learn how Apa Terra delivery, order confirmation and pay on delivery work across Ghana.' },
  '/returns': { title: 'Returns Policy | Apa Terra', description: 'Read the Apa Terra returns process for damaged, incorrect and unopened products.' },
  '/privacy': { title: 'Privacy Policy | Apa Terra', description: 'Learn how Apa Terra collects, uses and protects account and order information.' },
  '/terms': { title: 'Store Terms | Apa Terra', description: 'Read the terms that apply when browsing and ordering from Apa Terra.' },
  '/contact': { title: 'Contact Apa Terra', description: 'Find official Apa Terra customer-care and social channels.' },
  '/login': { title: 'Sign In | Apa Terra', description: 'Sign in or create your Apa Terra account.', noIndex: true },
  '/account': { title: 'Your Account | Apa Terra', description: 'Manage your Apa Terra profile and orders.', noIndex: true },
  '/checkout': { title: 'Checkout | Apa Terra', description: 'Confirm your Apa Terra pay-on-delivery order.', noIndex: true },
  '/admin': { title: 'Admin | Apa Terra', description: 'Apa Terra store administration.', noIndex: true },
}

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function absoluteUrl(value, fallback) {
  if (!value || /^(blob|data):/i.test(value)) return fallback
  try {
    return new URL(value, window.location.origin).href
  } catch {
    return fallback
  }
}

export default function SeoManager() {
  const { pathname } = useLocation()
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/'
  const { products } = useCatalog()
  const { settings } = useBusinessSettings()
  const productId = normalizedPathname.match(/^\/products\/([^/]+)$/)?.[1]
  const product = productId ? products.find((item) => item.id === decodeURIComponent(productId)) : null

  const seo = useMemo(() => {
    if (product) {
      return {
        title: `${product.name} | Apa Terra`,
        description: product.description,
        image: product.image,
        type: 'product',
      }
    }
    return pageMetadata[normalizedPathname] || pageMetadata['/']
  }, [normalizedPathname, product])

  useEffect(() => {
    const siteUrl = (import.meta.env.VITE_SITE_URL || `${window.location.origin}${import.meta.env.BASE_URL}`).replace(/\/$/, '')
    const canonical = normalizedPathname === '/' ? `${siteUrl}/` : `${siteUrl}${normalizedPathname}`
    const fallbackImage = absoluteUrl(shareImage, `${siteUrl}/apaterra-favicon.png`)
    const image = absoluteUrl(seo.image, fallbackImage)
    const robots = seo.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'

    document.title = seo.title
    setCanonical(canonical)
    setMeta('name', 'description', seo.description)
    setMeta('name', 'robots', robots)
    setMeta('property', 'og:site_name', 'Apa Terra')
    setMeta('property', 'og:type', seo.type || 'website')
    setMeta('property', 'og:title', seo.title)
    setMeta('property', 'og:description', seo.description)
    setMeta('property', 'og:url', canonical)
    setMeta('property', 'og:image', image)
    setMeta('property', 'og:image:alt', product ? product.name : 'Apa Terra natural care for textured hair')
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', seo.title)
    setMeta('name', 'twitter:description', seo.description)
    setMeta('name', 'twitter:image', image)

    if (product) {
      setMeta('property', 'product:price:amount', String(product.price))
      setMeta('property', 'product:price:currency', 'GHS')
    } else {
      document.head.querySelector('meta[property="product:price:amount"]')?.remove()
      document.head.querySelector('meta[property="product:price:currency"]')?.remove()
    }

    const sameAs = [settings.instagram_url, settings.tiktok_url, settings.youtube_url, settings.facebook_url]
      .map(getSafeExternalUrl)
      .filter(Boolean)
    const organization = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Apa Terra',
      url: `${siteUrl}/`,
      logo: `${siteUrl}/apaterra-favicon.png`,
      description: DEFAULT_DESCRIPTION,
      ...(sameAs.length ? { sameAs } : {}),
      ...(settings.support_email || settings.support_phone ? {
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          ...(settings.support_email ? { email: settings.support_email } : {}),
          ...(settings.support_phone ? { telephone: settings.support_phone } : {}),
          areaServed: 'GH',
        },
      } : {}),
      ...(settings.business_address ? { address: { '@type': 'PostalAddress', streetAddress: settings.business_address, addressCountry: 'GH' } } : {}),
    }
    const structuredData = product ? [organization, {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: [image],
      sku: product.id,
      brand: { '@type': 'Brand', name: 'Apa Terra' },
      offers: {
        '@type': 'Offer',
        url: canonical,
        priceCurrency: 'GHS',
        price: Number(product.price).toFixed(2),
        availability: `https://schema.org/${getInventoryState(product).isOutOfStock ? 'OutOfStock' : 'InStock'}`,
        itemCondition: 'https://schema.org/NewCondition',
      },
    }] : [organization, {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Apa Terra',
      url: `${siteUrl}/`,
    }]

    let script = document.getElementById('apaterra-structured-data')
    if (!script) {
      script = document.createElement('script')
      script.id = 'apaterra-structured-data'
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(structuredData)
  }, [normalizedPathname, product, seo, settings])

  return null
}
