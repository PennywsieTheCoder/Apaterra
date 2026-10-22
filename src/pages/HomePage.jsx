import { Link } from 'react-router-dom'
import heroImage from '../assets/apaterra-hero-v4.jpg'
import routineImage from '../assets/apaterra-routine-v1.jpg'
import ProductCard from '../components/ProductCard'
import ScrollReveal from '../components/ScrollReveal'
import { hairNeeds, products } from '../data/catalog'

const benefits = [
  ['Textured hair first', 'Products selected for curls, coils, locs and protective styles.'],
  ['Clear directions', 'Know what to use, when to use it and what comes next.'],
  ['Everyday consistency', 'Essentials designed for regular wash days and daily care.'],
]

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-copy"><p className="eyebrow">Hair care for curls, coils and locs</p><h1><span>Essentials for</span><span>your crown.</span></h1><p className="hero-description">Shop cleansers, treatments, leave-ins and stylers by product or by what your hair needs today.</p><div className="hero-actions"><Link className="button button-primary" to="/shop">Shop now <span>→</span></Link><Link className="hero-text-link" to="/hair-needs">Shop by hair need</Link></div></div>
        <div className="hero-visual"><img src={heroImage} alt="Two African women wearing a natural afro and braids beside Apaterra hair-care products" /></div>
      </section>

      <ScrollReveal className="needs-section">
        <div className="centered-heading"><p className="eyebrow">Start with what your hair needs</p><h2>Care made easier to choose.</h2><p>Tell us the concern. We’ll help you find the right step.</p></div>
        <div className="needs-grid">
          {hairNeeds.map(({ name, description, className, image }) => (
            <Link to={`/shop?need=${encodeURIComponent(name)}`} key={name}>
              <div className={`need-visual need-photo ${className}`}>
                <img src={image} alt={`${name} hair-care`} loading="lazy" />
              </div>
              <div className="need-copy">
                <h3>{name}</h3>
                <p>{description}</p>
                <span className="need-link-hint">Shop {name} <span aria-hidden="true">→</span></span>
              </div>
            </Link>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal className="routine-feature">
        <div className="routine-visual routine-photo">
          <img src={routineImage} alt="Three botanical hair-care products arranged on warm stone plinths" loading="lazy" />
          <div className="routine-image-caption"><span>A three-step wash day</span><strong>Cleanse, condition, hydrate</strong></div>
        </div>
        <div className="routine-copy">
          <p className="eyebrow">Moisture routine</p>
          <h2>Cleanse. Condition.<br />Hydrate.</h2>
          <p>Three products for a straightforward moisture-focused wash day.</p>
          <ol>
            <li><span>01</span><strong>Cleanse without stripping</strong></li>
            <li><span>02</span><strong>Deeply condition and detangle</strong></li>
            <li><span>03</span><strong>Hydrate and protect</strong></li>
          </ol>
          <Link className="text-link" to="/routines">Discover the routine <span>→</span></Link>
        </div>
      </ScrollReveal>

      <ScrollReveal className="featured-section">
        <div className="featured-heading"><div><p className="eyebrow">Shop the range</p><h2>Wash-day essentials.</h2></div><Link className="text-link" to="/shop">Shop all products <span>→</span></Link></div>
        <div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard product={product} key={product.id} />)}</div>
      </ScrollReveal>

      <ScrollReveal className="brand-principles">
        <div className="section-heading"><p className="eyebrow">How Apa Terra helps</p><h2>Choose products with<br />more confidence.</h2></div>
        <div className="principle-grid">{benefits.map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </ScrollReveal>
    </main>
  )
}
