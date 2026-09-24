import { useMemo, useState } from 'react'
import { CartContext } from './cart-store'

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  function addItem(product, quantity = 1) {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
      return [...current, { ...product, quantity }]
    })
    setIsOpen(true)
  }

  function changeQuantity(productId, quantity) {
    if (quantity < 1) return setItems((current) => current.filter((item) => item.id !== productId))
    setItems((current) => current.map((item) => item.id === productId ? { ...item, quantity } : item))
  }

  const value = useMemo(() => ({
    items,
    isOpen,
    setIsOpen,
    addItem,
    changeQuantity,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.price * item.quantity, 0),
  }), [items, isOpen])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
