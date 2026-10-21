import { Heart, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../data/catalog'
import { useCart } from '../context/cart-store'
import { getInventoryState } from '../lib/inventory'
import ProductVisual from './ProductVisual'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const inventory = getInventoryState(product)
  return (
    <article className="product-card" style={{ '--product-card-color': product.cardColor }}>
      <Link to={`/products/${product.id}`} className="product-image-link">
        <ProductVisual product={product} />
        {inventory.isOutOfStock && <span className="product-stock-badge is-out">Sold out</span>}
        {inventory.isLowStock && <span className="product-stock-badge is-low">Only {inventory.stock} left</span>}
      </Link>
      <div className="product-card-copy">
        <p className="product-card-type">{product.type}</p>
        <Link to={`/products/${product.id}`}><h3>{product.name}</h3></Link>
        <p className="product-card-description">{product.description}</p>
        <div className="product-card-meta">
          <div className="product-card-price"><strong>{formatMoney(product.price)}</strong></div>
          <div className="product-card-options"><span>{product.size}</span></div>
        </div>
        <div className="product-card-actions">
          <button type="button" className="product-save-button" aria-label={`Save ${product.name}`}><Heart size={16} /></button>
          <button type="button" className="product-add-button" disabled={inventory.isOutOfStock} onClick={() => addItem(product)}><span>{inventory.isOutOfStock ? 'Sold out' : 'Add to cart'}</span><ShoppingBag size={15} /></button>
        </div>
      </div>
    </article>
  )
}
