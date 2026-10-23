import { useMemo, useState } from 'react'
import { getInventoryState } from '../lib/inventory'
import { trackEvent } from '../lib/analytics'
import { CartContext } from './cart-store'

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  function addItem(product, quantity = 1) {
    const inventory = getInventoryState(product)
    if (inventory.isOutOfStock) return
    const requestedQuantity = Math.max(1, Number(quantity) || 1)
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) return current.map((item) => item.id === product.id
        ? { ...item, quantity: inventory.tracksStock ? Math.min(item.quantity + requestedQuantity, inventory.stock) : item.quantity + requestedQuantity }
        : item)
      return [...current, { ...product, quantity: inventory.tracksStock ? Math.min(requestedQuantity, inventory.stock) : requestedQuantity }]
    })
    trackEvent('add_to_cart', { productId: product.id, quantity: requestedQuantity })
  }

  function changeQuantity(productId, quantity) {
    if (quantity < 1) return setItems((current) => current.filter((item) => item.id !== productId))
    setItems((current) => current.map((item) => {
      if (item.id !== productId) return item
      const inventory = getInventoryState(item)
      const nextQuantity = inventory.tracksStock ? Math.min(quantity, inventory.stock) : quantity
      return nextQuantity > 0 ? { ...item, quantity: nextQuantity } : item
    }))
  }

  function clearCart() {
    setItems([])
    setIsOpen(false)
  }

  const value = useMemo(() => ({
    items,
    isOpen,
    setIsOpen,
    addItem,
    changeQuantity,
    clearCart,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.price * item.quantity, 0),
  }), [items, isOpen])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
