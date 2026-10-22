import { useMemo } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import { hairNeeds } from '../data/catalog'
import { useCatalog } from '../context/catalog-store'

export default function HairNeedsPage() {
  const { products } = useCatalog()

  const needs = useMemo(
    () => hairNeeds.map((need, index) => ({
      ...need,
      index: String(index + 1).padStart(2, '0'),
      productCount: products.filter((product) => product.needs?.includes(need.name)).length,
    })),
    [products]
  )

  return (
    <main className="hair-needs-page page-shell">
      <ScrollReveal className="needs-hero-editorial" rootMargin="0px 0px 4% 0px" threshold={0.04}>
        <div className="needs-hero-container">
          <div className="needs-hero-copy">
            <p className="eyebrow">Shop by hair need</p>
            <h1>
              Start with what
              <br />
              <span>your hair needs.</span>
            </h1>
            <p className="needs-hero-lead">
              Choose the concern that matters most today. We’ll show you the products made for that part of your routine.
            </p>
            <Link className="button button-primary" to="/shop">
              Shop all products <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="needs-hero-gallery" aria-hidden="true">
            <div className="needs-gallery-main"><img src={hairNeeds[0].image} alt="" /></div>
            <div className="needs-gallery-side">
              <div className="needs-gallery-subcard"><img src={hairNeeds[3].image} alt="" /></div>
              <div className="needs-gallery-subcard"><img src={hairNeeds[4].image} alt="" /></div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal className="needs-directory-section" rootMargin="0px 0px 8% 0px" threshold={0.05}>
        <div className="needs-section-header">
          <div>
            <p className="eyebrow">Choose your focus</p>
            <h2>Find the right place to begin.</h2>
          </div>
          <p className="needs-section-subcopy">
            Select a hair need to open the shop with matching products already filtered.
          </p>
        </div>

        <div className="needs-portrait-grid">
          {needs.map((need) => (
            <Link
              key={need.name}
              className="needs-portrait-card"
              to={`/shop?need=${encodeURIComponent(need.name)}`}
            >
              <div className="needs-portrait-media">
                <img src={need.image} alt={`${need.name} hair care`} loading="lazy" />
                <span className="needs-portrait-index">{need.index}</span>
                <span className="needs-portrait-count">
                  {need.productCount} {need.productCount === 1 ? 'product' : 'products'}
                </span>
              </div>
              <div className="needs-portrait-body">
                <div className="needs-portrait-title-row">
                  <h3>{need.name}</h3>
                  <span className="needs-portrait-icon-link" aria-hidden="true"><ArrowUpRight size={16} /></span>
                </div>
                <p className="needs-portrait-tagline">{need.description}</p>
                <span className="needs-shop-link">Shop {need.name} <ArrowUpRight size={14} /></span>
              </div>
            </Link>
          ))}
        </div>
      </ScrollReveal>
    </main>
  )
}
