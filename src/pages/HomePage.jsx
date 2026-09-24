import { Link } from 'react-router-dom'
import heroImage from '../assets/apaterra-hero-v2.png'
import { categories, hairNeeds, products } from '../data/catalog'
import ProductCard from '../components/ProductCard'

const benefits = [
  ['01', 'Rooted in care', 'Thoughtful formulas created for the needs of African-textured hair.'],
  ['02', 'Routine made simple', 'Clear guidance helps you build a routine without the guesswork.'],
  ['03', 'Made for consistency', 'Everyday essentials that support healthy hair over time.'],
]

export default function HomePage() {
  return <>
    <section className="hero-section">
      <div className="hero-copy"><p className="eyebrow">Care for every texture</p><h1>Rooted in nature.<br /><em>Made for your crown.</em></h1><p className="hero-description">Nourishing hair care designed around moisture, strength and the everyday needs of African-textured hair.</p><div className="hero-actions"><Link className="button button-primary" to="/shop">Explore the collection</Link><Link className="button button-secondary" to="/routines">Find your routine</Link></div><div className="hero-note"><span>Plant-led formulas</span><span>Made with textured hair in mind</span></div></div>
      <div className="hero-visual"><img src={heroImage} alt="Amber and cream Apaterra hair-care containers arranged with green botanicals" /><div className="hero-image-note"><span>01</span><p>Botanical care.<br />Textured-hair wisdom.</p></div></div>
    </section>

    <section className="category-strip" aria-label="Product categories"><p>Shop by category</p><div>{categories.slice(1).map((category) => <Link to={`/shop?category=${encodeURIComponent(category)}`} key={category}>{category}</Link>)}</div></section>

    <section className="proof-strip"><article><strong>8</strong><span>purposeful essentials</span></article><article><strong>5</strong><span>hair needs, made simple</span></article><article><strong>1</strong><span>routine built around you</span></article></section>

    <section className="needs-section"><div className="centered-heading"><p className="eyebrow">Start with what your hair needs</p><h2>Care made easier to choose.</h2><p>Tell us the concern. We’ll help you find the right step.</p></div><div className="needs-grid">{hairNeeds.map(({ name, description, className, image }) => <Link to={`/shop?need=${encodeURIComponent(name)}`} key={name}><div className={`need-visual need-photo ${className}`}><img src={image} alt={`${name} hair-care placeholder`} loading="lazy" /></div><h3>{name}</h3><p>{description}</p></Link>)}</div></section>

    <section className="routine-feature"><div className="routine-visual routine-photo"><img src={products[7].image} alt="Natural product photography used as a placeholder for the Apaterra moisture ritual" /></div><div className="routine-copy"><p className="eyebrow">The moisture ritual</p><h2>A complete wash day,<br />thoughtfully layered.</h2><p>Cleanse gently, replenish deeply and seal in moisture. Three purposeful steps designed to work better together.</p><ol><li><span>01</span>Cleanse without stripping</li><li><span>02</span>Deeply condition and detangle</li><li><span>03</span>Hydrate and protect</li></ol><Link className="text-link" to="/routines">Discover the routine <span>→</span></Link></div></section>

    <section className="featured-section"><div className="featured-heading"><div><p className="eyebrow">Our essentials</p><h2>Care worth returning to.</h2></div><Link className="text-link" to="/shop">Shop all products <span>→</span></Link></div><div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard product={product} key={product.id} />)}</div></section>

    <section className="brand-principles"><div className="section-heading"><p className="eyebrow">The Apaterra approach</p><h2>Healthy hair starts with<br />care that understands it.</h2></div><div className="principle-grid">{benefits.map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
  </>
}
