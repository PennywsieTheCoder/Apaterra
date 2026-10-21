export const LOW_STOCK_THRESHOLD = 5

export function getInventoryState(product) {
  const tracksStock = Boolean(product?.isSupabaseProduct) || product?.stock !== undefined
  const stock = tracksStock ? Math.max(0, Number(product?.stock) || 0) : null

  return {
    tracksStock,
    stock,
    isOutOfStock: tracksStock && stock === 0,
    isLowStock: tracksStock && stock > 0 && stock <= LOW_STOCK_THRESHOLD,
  }
}
