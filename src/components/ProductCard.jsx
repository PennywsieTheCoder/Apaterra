import { Heart, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatMoney } from '../data/catalog'
import { useCart } from '../context/cart-store'
import ProductVisual from './ProductVisual'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  return (
    <article className="product-card">
      <button type="button" className="favorite-button" aria-label={`Save ${product.name}`}><Heart size={17} /></button>
      <Link to={`/products/${product.id}`} className="product-image-link"><ProductVisual product={product} /></Link>
      <div className="product-card-copy"><p>{product.type}</p><Link to={`/products/${product.id}`}><h3>{product.name}</h3></Link><div><strong>{formatMoney(product.price)}</strong><button type="button" onClick={() => addItem(product)} aria-label={`Add ${product.name} to bag`}><Plus size={17} /></button></div></div>
    </article>
  )
}
