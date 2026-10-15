import { Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../data/catalog'
import { useCart } from '../context/cart-store'
import ProductVisual from './ProductVisual'

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, changeQuantity, subtotal } = useCart()
  return (
    <div className={`cart-layer ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <button type="button" className="cart-backdrop" aria-label="Close shopping bag" onClick={() => setIsOpen(false)} />
      <aside className="cart-drawer" aria-label="Shopping bag">
        <div className="cart-header"><div><p className="eyebrow">Your selection</p><h2>Shopping bag</h2></div><button type="button" aria-label="Close shopping bag" onClick={() => setIsOpen(false)}><X size={22} /></button></div>
        {items.length === 0 ? <div className="empty-cart"><ShoppingBag size={32} /><h3>Your bag is ready when you are.</h3><p>Explore care created around your hair’s needs.</p><Link to="/shop" onClick={() => setIsOpen(false)}>Explore the collection</Link></div> : <><div className="cart-items">{items.map((item) => <article key={item.id} style={{ '--product-card-color': item.cardColor }}><ProductVisual product={item} compact /><div className="cart-item-details"><p>{item.type}</p><h3>{item.name}</h3><div className="cart-item-meta"><strong>{formatMoney(item.price)}</strong><span>{item.size}</span></div><div className="quantity-control"><button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => changeQuantity(item.id, item.quantity - 1)}><Minus size={13} /></button><span>{item.quantity}</span><button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => changeQuantity(item.id, item.quantity + 1)}><Plus size={13} /></button></div></div></article>)}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><p>Delivery is calculated at checkout.</p><Link className="checkout-link" to="/checkout" onClick={() => setIsOpen(false)}>Continue to checkout</Link><button type="button" className="continue-shopping" onClick={() => setIsOpen(false)}>Continue shopping</button></div></>}
      </aside>
    </div>
  )
}
