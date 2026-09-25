import { Link } from 'react-router-dom'
import ProductVisual from '../components/ProductVisual'
import PageBanner from '../components/PageBanner'
import ScrollReveal from '../components/ScrollReveal'
import { products, routines } from '../data/catalog'

export default function RoutinesPage() {
  return <main className="routines-page page-shell"><PageBanner eyebrow="Apaterra rituals" title={<>Better together,<br />step by step.</>} copy="Simple routines organised by what your hair needs—not by complicated rules." images={[products[0].image, products[1].image, products[3].image]} variant="routines-banner" /><div className="routine-list">{routines.map((routine, routineIndex) => { const routineProducts = routine.productIds.map((id) => products.find((product) => product.id === id)); return <ScrollReveal key={routine.id} className={routineIndex % 2 ? 'reverse' : ''} rootMargin="0px 0px 8% 0px" threshold={0.05}><div className="routine-products">{routineProducts.map((product) => <Link to={`/products/${product.id}`} key={product.id}><ProductVisual product={product} compact /><span>{product.name}</span></Link>)}</div><div className="routine-detail"><p className="eyebrow">{routine.eyebrow}</p><h2>{routine.name}</h2><p>{routine.description}</p><ol>{routine.steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}</ol><Link className="button button-primary" to={`/shop?need=${encodeURIComponent(routineIndex ? 'Protective styles' : 'Moisture')}`}>Shop this routine</Link></div></ScrollReveal> })}</div></main>
}
