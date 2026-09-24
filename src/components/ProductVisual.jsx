export default function ProductVisual({ product, compact = false }) {
  return <div className={`product-card-visual product-photo ${compact ? 'compact' : ''}`}><img src={product.image} alt={`${product.name} placeholder product photography`} loading="lazy" /></div>
}
