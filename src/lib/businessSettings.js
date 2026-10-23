export function normalizeExternalUrl(value) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  const parsed = new URL(candidate)
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Social links must use http or https.')
  return parsed.toString()
}

export function getSafeExternalUrl(value) {
  try {
    return normalizeExternalUrl(value || '')
  } catch {
    return ''
  }
}

export function getWhatsAppUrl(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : ''
}
