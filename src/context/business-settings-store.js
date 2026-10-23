import { createContext, useContext } from 'react'

export const BusinessSettingsContext = createContext(null)

export const emptyBusinessSettings = {
  id: 'main',
  support_email: '',
  support_phone: '',
  whatsapp_number: '',
  business_address: '',
  operating_hours: '',
  instagram_url: '',
  tiktok_url: '',
  youtube_url: '',
  facebook_url: '',
}

export function useBusinessSettings() {
  const context = useContext(BusinessSettingsContext)
  if (!context) throw new Error('useBusinessSettings must be used inside BusinessSettingsProvider')
  return context
}
