import { ChevronLeft, Minus, Plus, ShieldCheck, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import ProductVisual from '../components/ProductVisual'
import { useCart } from '../context/cart-store'
import { formatMoney, products } from '../data/catalog'

export default function ProductPage() {
  const { productId } = useParams()
  const product = products.find((item) => item.id === productId)
  const [quantity, setQuantity] = useState(1)
  const [openInfo, setOpenInfo] = useState('details')
  const { addItem } = useCart()

  if (!product) return <main className="not-found page-shell"><h1>Product not found</h1><Link to="/shop">Return to the collection</Link></main>
  const related = products.filter((item) => item.id !== product.id && item.needs.some((need) => product.needs.includes(need))).slice(0, 3)

  return <main className="product-page page-shell">
    <Link className="back-link" to="/shop"><ChevronLeft size={16} /> Back to shop</Link>
    <section className="product-detail" style={{ '--product-card-color': product.cardColor }}><div className="product-detail-visual"><ProductVisual product={product} /><span>{product.badge}</span></div><div className="product-detail-copy"><p className="eyebrow">{product.type}</p><h1>{product.name}</h1><p className="product-size">{product.size}</p><strong className="product-price">{formatMoney(product.price)}</strong><p className="product-description">{product.description}</p><div className="need-tags">{product.needs.map((item) => <span key={item}>{item}</span>)}</div><div className="purchase-row"><div className="quantity-control"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={15} /></button><span>{quantity}</span><button type="button" onClick={() => setQuantity((value) => value + 1)}><Plus size={15} /></button></div><button type="button" className="add-to-bag" onClick={() => addItem(product, quantity)}>Add to bag · {formatMoney(product.price * quantity)}</button></div><div className="purchase-notes"><span><Truck size={16} /> Delivery options shown at checkout</span><span><ShieldCheck size={16} /> Secure checkout</span></div><div className="product-accordions"><button type="button" onClick={() => setOpenInfo(openInfo === 'details' ? '' : 'details')}><span>Benefits</span><Plus size={16} /></button>{openInfo === 'details' && <ul>{product.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>}<button type="button" onClick={() => setOpenInfo(openInfo === 'ingredients' ? '' : 'ingredients')}><span>Key ingredients</span><Plus size={16} /></button>{openInfo === 'ingredients' && <p>{product.ingredients}</p>}<button type="button" onClick={() => setOpenInfo(openInfo === 'directions' ? '' : 'directions')}><span>How to use</span><Plus size={16} /></button>{openInfo === 'directions' && <p>{product.directions}</p>}</div></div></section>
    <section className="related-section"><div className="featured-heading"><div><p className="eyebrow">Continue the ritual</p><h2>You may also like.</h2></div></div><div className="product-grid related-grid">{related.map((item) => <ProductCard product={item} key={item.id} />)}</div></section>
  </main>
}
