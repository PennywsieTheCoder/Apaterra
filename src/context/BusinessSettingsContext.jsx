import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BusinessSettingsContext, emptyBusinessSettings } from './business-settings-store'

export function BusinessSettingsProvider({ children }) {
  const [settings, setSettings] = useState(emptyBusinessSettings)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState('')

  const refreshSettings = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error: requestError } = await supabase
      .from('business_settings')
      .select('*')
      .eq('id', 'main')
      .maybeSingle()

    if (requestError) {
      setError(requestError.message)
    } else {
      setSettings({ ...emptyBusinessSettings, ...(data || {}) })
      setError('')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const loadSettings = window.setTimeout(refreshSettings, 0)
    return () => window.clearTimeout(loadSettings)
  }, [refreshSettings])

  const value = useMemo(
    () => ({ settings, loading, error, refreshSettings }),
    [settings, loading, error, refreshSettings]
  )

  return <BusinessSettingsContext.Provider value={value}>{children}</BusinessSettingsContext.Provider>
}
