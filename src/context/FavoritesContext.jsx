import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './auth-store'
import { FavoritesContext } from './favorites-store'
import { trackEvent } from '../lib/analytics'
import { captureOperationalError } from '../lib/monitoring'

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [favoritesState, setFavoritesState] = useState({ userId: null, ids: [], error: '' })
  const [pendingIds, setPendingIds] = useState([])
  const hasCurrentUserData = Boolean(user?.id && favoritesState.userId === user.id)
  const favoriteIds = hasCurrentUserData ? favoritesState.ids : []
  const error = hasCurrentUserData ? favoritesState.error : ''
  const loading = Boolean(supabase && user?.id && !hasCurrentUserData)

  const refreshFavorites = useCallback(async () => {
    if (!supabase || !user?.id) return
    const { data, error: requestError } = await supabase
      .from('product_favorites')
      .select('product_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setFavoritesState((current) => ({
      userId: user.id,
      ids: requestError && current.userId === user.id
        ? current.ids
        : (data || []).map((favorite) => favorite.product_id),
      error: requestError?.message || '',
    }))
    setPendingIds([])
  }, [user])

  useEffect(() => {
    if (!supabase || !user?.id) return undefined
    const loadFavorites = window.setTimeout(refreshFavorites, 0)

    return () => window.clearTimeout(loadFavorites)
  }, [refreshFavorites, user?.id])

  async function toggleFavorite(productId) {
    if (!supabase || !user?.id) return { requiresAuth: true, error: null }
    if (loading || pendingIds.includes(productId)) return { requiresAuth: false, error: null }

    const wasFavorite = favoriteIds.includes(productId)
    setPendingIds((current) => [...current, productId])
    setFavoritesState((current) => ({
      userId: user.id,
      error: '',
      ids: wasFavorite ? current.ids.filter((id) => id !== productId) : [productId, ...current.ids],
    }))

    const request = wasFavorite
      ? supabase.from('product_favorites').delete().eq('user_id', user.id).eq('product_id', productId)
      : supabase.from('product_favorites').insert({ user_id: user.id, product_id: productId })
    const { error: requestError } = await request

    if (requestError) {
      captureOperationalError(requestError, 'favorite_update', { productId, action: wasFavorite ? 'remove' : 'add' })
      setFavoritesState((current) => ({
        userId: user.id,
        error: requestError.message,
        ids: wasFavorite
          ? (current.ids.includes(productId) ? current.ids : [productId, ...current.ids])
          : current.ids.filter((id) => id !== productId),
      }))
    } else {
      trackEvent(wasFavorite ? 'favorite_removed' : 'favorite_added', { productId })
    }
    setPendingIds((current) => current.filter((id) => id !== productId))
    return { requiresAuth: false, error: requestError }
  }

  const value = {
    error,
    favoriteIds,
    isFavorite: (productId) => favoriteIds.includes(productId),
    isPending: (productId) => pendingIds.includes(productId),
    loading,
    refreshFavorites,
    toggleFavorite,
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}
