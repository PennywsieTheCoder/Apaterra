import { supabase } from './supabase'
import { captureOperationalError } from './monitoring'

const allowedEvents = new Set([
  'product_view',
  'add_to_cart',
  'favorite_added',
  'favorite_removed',
  'checkout_started',
  'checkout_failed',
  'order_completed',
])

const analyticsEnabled = import.meta.env.PROD
  && import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
  && Boolean(supabase)

function getSessionId() {
  const storageKey = 'apaterra-analytics-session'
  const existing = window.sessionStorage.getItem(storageKey)
  if (existing) return existing
  const sessionId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  window.sessionStorage.setItem(storageKey, sessionId)
  return sessionId
}

function safeNumber(value, minimum = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(minimum, number) : minimum
}

function sanitizeProperties(eventName, properties) {
  if (eventName === 'add_to_cart') return { quantity: safeNumber(properties.quantity, 1) }
  if (eventName === 'checkout_started' || eventName === 'order_completed') {
    return {
      item_count: safeNumber(properties.itemCount),
      cart_value: safeNumber(properties.cartValue),
    }
  }
  if (eventName === 'checkout_failed') return { stage: String(properties.stage || 'order').slice(0, 40) }
  return {}
}

export function trackEvent(eventName, properties = {}) {
  if (!analyticsEnabled || !allowedEvents.has(eventName)) return
  const payload = {
    event_name: eventName,
    session_id: getSessionId(),
    path: window.location.pathname.slice(0, 160),
    product_id: properties.productId ? String(properties.productId).slice(0, 120) : null,
    metadata: sanitizeProperties(eventName, properties),
  }

  void supabase.from('analytics_events').insert(payload).then(({ error }) => {
    if (error) captureOperationalError(error, 'analytics_event_insert', { eventName })
  })
}

