import { useCallback, useEffect, useMemo, useState } from 'react'
import { products as defaultProducts } from '../data/catalog'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { mapSupabaseProduct } from '../lib/products'
import { CatalogContext } from './catalog-store'
import { captureOperationalError } from '../lib/monitoring'

export function CatalogProvider({ children }) {
  const [customProducts, setCustomProducts] = useState([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')
  const [starterImported, setStarterImported] = useState(false)

  const refreshProducts = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    const [{ data, error: requestError }, { data: settings }] = await Promise.all([
      supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: true }),
      supabase.from('catalog_settings').select('starter_catalog_imported').eq('id', 'main').maybeSingle(),
    ])

    if (requestError) {
      captureOperationalError(requestError, 'catalog_load')
      setError(requestError.message)
    } else {
      setCustomProducts((data || []).map(mapSupabaseProduct))
      setStarterImported(Boolean(settings?.starter_catalog_imported))
      setError('')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const loadProducts = window.setTimeout(refreshProducts, 0)
    return () => window.clearTimeout(loadProducts)
  }, [refreshProducts])

  const products = useMemo(() => {
    if (starterImported) return customProducts
    const merged = new Map(defaultProducts.map((product) => [product.id, product]))
    customProducts.forEach((product) => merged.set(product.id, product))
    return [...merged.values()]
  }, [customProducts, starterImported])
  const value = useMemo(
    () => ({ products, customProducts, loading, error, refreshProducts, starterImported }),
    [products, customProducts, loading, error, refreshProducts, starterImported]
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}
