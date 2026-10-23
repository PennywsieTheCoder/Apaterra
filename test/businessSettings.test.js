import assert from 'node:assert/strict'
import test from 'node:test'
import { getSafeExternalUrl, getWhatsAppUrl, normalizeExternalUrl } from '../src/lib/businessSettings.js'

test('social links are normalized to safe HTTPS URLs', () => {
  assert.equal(normalizeExternalUrl('instagram.com/apaterra'), 'https://instagram.com/apaterra')
  assert.equal(normalizeExternalUrl('https://youtube.com/@apaterra'), 'https://youtube.com/@apaterra')
  assert.throws(() => normalizeExternalUrl('javascript:alert(1)'), /http or https/)
  assert.equal(getSafeExternalUrl('javascript:alert(1)'), '')
})

test('WhatsApp links contain digits only', () => {
  assert.equal(getWhatsAppUrl('+233 24 123 4567'), 'https://wa.me/233241234567')
  assert.equal(getWhatsAppUrl(''), '')
})
