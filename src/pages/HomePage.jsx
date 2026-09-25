import { Link } from 'react-router-dom'
import heroImage from '../assets/apaterra-hero-v3.png'
import ProductCard from '../components/ProductCard'
import ScrollReveal from '../components/ScrollReveal'
import { hairNeeds, products } from '../data/catalog'

const benefits = [
  ['01', 'Rooted in care', 'Thoughtful formulas created for the needs of African-textured hair.'],
  ['02', 'Routine made simple', 'Clear guidance helps you build a routine without the guesswork.'],
  ['03', 'Made for consistency', 'Everyday essentials that support healthy hair over time.'],
]

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-copy"><p className="eyebrow">Natural care for textured hair</p><h1><span>Essentials for</span><span>your crown.</span></h1><p className="hero-description">Purposeful formulas for curls, coils and locs—created to make moisture, strength and scalp care feel beautifully simple.</p><div className="hero-actions"><Link className="button button-primary" to="/shop">Shop now <span>→</span></Link><Link className="hero-text-link" to="/routines">Explore routines</Link></div></div>
        <div className="hero-visual"><img src={heroImage} alt="Two African women wearing a natural afro and braids beside Apaterra hair-care products" /></div>
      </section>

      <ScrollReveal className="needs-section">
        <div className="centered-heading"><p className="eyebrow">Start with what your hair needs</p><h2>Care made easier to choose.</h2><p>Tell us the concern. We’ll help you find the right step.</p></div>
        <div className="needs-grid">{hairNeeds.map(({ name, description, className, image }) => <Link to={`/shop?need=${encodeURIComponent(name)}`} key={name}><div className={`need-visual need-photo ${className}`}><img src={image} alt={`${name} hair-care`} loading="lazy" /></div><div className="need-copy"><h3>{name}</h3><p>{description}</p></div></Link>)}</div>
      </ScrollReveal>

      <ScrollReveal className="routine-feature">
        <div className="routine-visual routine-photo"><img src={products[7].image} alt="Apaterra moisture ritual products" loading="lazy" /></div>
        <div className="routine-copy"><p className="eyebrow">The moisture ritual</p><h2>A complete wash day,<br />thoughtfully layered.</h2><p>Cleanse gently, replenish deeply and seal in moisture. Three purposeful steps designed to work better together.</p><ol><li><span>01</span>Cleanse without stripping</li><li><span>02</span>Deeply condition and detangle</li><li><span>03</span>Hydrate and protect</li></ol><Link className="text-link" to="/routines">Discover the routine <span>→</span></Link></div>
      </ScrollReveal>

      <ScrollReveal className="featured-section">
        <div className="featured-heading"><div><p className="eyebrow">Our essentials</p><h2>Care worth returning to.</h2></div><Link className="text-link" to="/shop">Shop all products <span>→</span></Link></div>
        <div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard product={product} key={product.id} />)}</div>
      </ScrollReveal>

      <ScrollReveal className="brand-principles">
        <div className="section-heading"><p className="eyebrow">The Apaterra approach</p><h2>Healthy hair starts with<br />care that understands it.</h2></div>
        <div className="principle-grid">{benefits.map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </ScrollReveal>
    </main>
  )
}
