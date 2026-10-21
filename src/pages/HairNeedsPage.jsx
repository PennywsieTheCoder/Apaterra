import { useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, CheckCircle2, Droplets, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import ScrollReveal from '../components/ScrollReveal'
import { hairNeeds } from '../data/catalog'
import { useCatalog } from '../context/catalog-store'

const NEED_DETAILS = {
  Moisture: {
    index: '01',
    tagline: 'Deep, weightless hydration for dry, thirsty curls and coils.',
    signs: ['Dry or rough ends', 'Dullness after 2 days', 'Tight, tangled wash days'],
    actives: 'Aloe Vera, Cold-Pressed Baobab Oil, Unrefined Shea Butter & Cupuaçu',
    ritual: [
      { step: '01', title: 'Cleanse gently', detail: 'Start with Moisture Wash to lift buildup while cushioning strands with oat amino acids.' },
      { step: '02', title: 'Infuse slip & softness', detail: 'Melt Softening Treatment into sections for 15 minutes to restore elasticity.' },
      { step: '03', title: 'Layer & lock', detail: 'Apply Daily Veil onto damp hair to keep curls supple for days.' },
    ],
  },
  Breakage: {
    index: '02',
    tagline: 'Fortifying care to reduce shedding, snapping, and fragile ends.',
    signs: ['Short broken pieces when combing', 'Weakened crown or edges', 'Difficulty retaining length'],
    actives: 'Fermented Rice Water, Moringa Seed Oil, Hydrolysed Rice Protein & Panthenol',
    ritual: [
      { step: '01', title: 'Low-friction wash', detail: 'Cleanse in loose sections with Moisture Wash to prevent mechanical tangles.' },
      { step: '02', title: 'Strengthen the cortex', detail: 'Smooth Strength Rinse from root to tip for instant detangling slip.' },
      { step: '03', title: 'Deep restorative mask', detail: 'Weekly Softening Treatment reinforces fragile strands against styling tension.' },
    ],
  },
  'Scalp care': {
    index: '03',
    tagline: 'A calm, clarified foundation for healthy roots and comfortable wear.',
    signs: ['Product buildup at the roots', 'Dry, tight or itchy scalp', 'Post-braid takedown residue'],
    actives: 'African Black Soap Extract, Willow Bark, Peppermint Hydrosol & Black Seed Oil',
    ritual: [
      { step: '01', title: 'Clarify the root', detail: 'Massage Balance Cleanse directly onto wet scalp to dissolve stubborn buildup.' },
      { step: '02', title: 'Nourish follicles', detail: 'Part clean hair and apply a few precision drops of Rooted Drops.' },
      { step: '03', title: 'Daily root refresh', detail: 'Mist Braid Mist lightly whenever your scalp feels tight between wash days.' },
    ],
  },
  'Protective styles': {
    index: '04',
    tagline: 'Residue-free hydration and scalp comfort for braids, twists, and locs.',
    signs: ['Itchy scalp in fresh braids', 'Frizzy or dry mid-lengths', 'Heavy buildup at the base of locs'],
    actives: 'Rosewater, Baobab Protein, Jojoba Oil & Rosemary Leaf Extract',
    ritual: [
      { step: '01', title: 'Hydrate the length', detail: 'Spritz Braid Mist over braids, twists, or locs every 2–3 days for weightless moisture.' },
      { step: '02', title: 'Soothe parted lines', detail: 'Trace Rooted Drops along exposed scalp parts to calm tension and add shine.' },
      { step: '03', title: 'Reset on takedown', detail: 'Use Balance Cleanse after removing extensions to gently lift weeks of buildup.' },
    ],
  },
  Definition: {
    index: '05',
    tagline: 'Touchable, flake-free curl clumping and lasting shape for twist-outs & coils.',
    signs: ['Undefined frizz as hair dries', 'Crunchy or flaky gels', 'Styles that drop by day two'],
    actives: 'Botanical Flaxseed Gel, Okra Extract, Marshmallow Root & Shea Esters',
    ritual: [
      { step: '01', title: 'Prep with slip', detail: 'Work Daily Veil through soaking-wet sections to clump curls evenly.' },
      { step: '02', title: 'Sculpt & define', detail: 'Rake or shingle Coil Custard in small sections for soft, flexible hold.' },
      { step: '03', title: 'Break the cast', detail: 'Once 100% dry, glaze hands with Rooted Drops to separate twists without frizz.' },
    ],
  },
}

export default function HairNeedsPage() {
  const [activeNeed, setActiveNeed] = useState(hairNeeds[0].name)
  const { products: catalogProducts } = useCatalog()

  const enrichedNeeds = useMemo(
    () =>
      hairNeeds.map((need) => {
        const details = NEED_DETAILS[need.name] || NEED_DETAILS.Moisture
        const matchingProducts = catalogProducts.filter((product) => product.needs?.includes(need.name))
        return {
          ...need,
          ...details,
          matchingProducts,
        }
      }),
    [catalogProducts]
  )

  const selectedNeedData = useMemo(
    () => enrichedNeeds.find((item) => item.name === activeNeed) || enrichedNeeds[0],
    [enrichedNeeds, activeNeed]
  )

  const handleSelectNeed = (needName) => {
    setActiveNeed(needName)
    const spotlightEl = document.getElementById('needs-spotlight')
    if (spotlightEl) {
      spotlightEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <main className="hair-needs-page page-shell">
      {/* Editorial Hero Banner */}
      <section className="needs-hero-editorial">
        <div className="needs-hero-container">
          <div className="needs-hero-copy">
            <span className="needs-hero-eyebrow">
              <Sparkles size={13} />
              Hair Care Diagnostic &amp; Directory
            </span>
            <h1>
              Your texture.
              <br />
              <span>Your needs. Your care.</span>
            </h1>
            <p className="needs-hero-lead">
              Every curl, coil, and protective style asks for something different as the seasons and your schedule shift. Start with what your hair needs today to discover targeted botanical formulas.
            </p>

            <div className="needs-hero-pills" role="tablist" aria-label="Jump to hair need">
              {enrichedNeeds.map((need) => (
                <button
                  key={need.name}
                  type="button"
                  role="tab"
                  aria-selected={activeNeed === need.name}
                  className={`needs-hero-pill ${activeNeed === need.name ? 'active' : ''}`}
                  onClick={() => handleSelectNeed(need.name)}
                >
                  <span className="needs-pill-index">{need.index}</span>
                  <span>{need.name}</span>
                  <small>{need.matchingProducts.length}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="needs-hero-gallery" aria-hidden="true">
            <div className="needs-gallery-main">
              <img src={hairNeeds[0].image} alt="" />
              <div className="needs-gallery-tag">
                <Droplets size={14} />
                <span>5 Targeted Care Pillars</span>
              </div>
            </div>
            <div className="needs-gallery-side">
              <div className="needs-gallery-subcard">
                <img src={hairNeeds[3].image} alt="" />
              </div>
              <div className="needs-gallery-subcard">
                <img src={hairNeeds[4].image} alt="" />
                <div className="needs-gallery-badge">
                  <ShieldCheck size={14} />
                  <span>Botanical Formulations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Card Portrait Directory */}
      <ScrollReveal className="needs-directory-section" rootMargin="0px 0px 8% 0px" threshold={0.05}>
        <div className="needs-section-header">
          <div>
            <p className="eyebrow">Choose your focus</p>
            <h2>Care that meets your hair where it is.</h2>
          </div>
          <p className="needs-section-subcopy">
            Select a concern below to preview its recommended 3-step ritual, or jump straight into the filtered shop collection.
          </p>
        </div>

        <div className="needs-portrait-grid">
          {enrichedNeeds.map((need) => {
            const isSelected = activeNeed === need.name
            return (
              <article
                key={need.name}
                className={`needs-portrait-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleSelectNeed(need.name)}
              >
                <div className="needs-portrait-media">
                  <img src={need.image} alt={need.name} loading="lazy" />
                  <span className="needs-portrait-index">{need.index}</span>
                  <span className="needs-portrait-count">{need.matchingProducts.length} formulas</span>
                </div>

                <div className="needs-portrait-body">
                  <div className="needs-portrait-title-row">
                    <h3>{need.name}</h3>
                    <Link
                      to={`/shop?need=${encodeURIComponent(need.name)}`}
                      className="needs-portrait-icon-link"
                      aria-label={`Shop ${need.name}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                  <p className="needs-portrait-tagline">{need.tagline}</p>

                  <ul className="needs-portrait-signs">
                    {need.signs.slice(0, 2).map((sign) => (
                      <li key={sign}>{sign}</li>
                    ))}
                  </ul>

                  <div className="needs-portrait-actions">
                    <button
                      type="button"
                      className="needs-explore-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectNeed(need.name)
                      }}
                    >
                      {isSelected ? 'Viewing ritual' : 'Explore ritual'}
                    </button>
                    <Link
                      to={`/shop?need=${encodeURIComponent(need.name)}`}
                      className="needs-shop-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>Shop</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </ScrollReveal>

      {/* Interactive Concern Deep-Dive & Ritual Explorer */}
      <section id="needs-spotlight" className="needs-spotlight-section">
        <div className="needs-spotlight-container">
          <div className="needs-spotlight-tabs" role="tablist" aria-label="Filter spotlight by hair need">
            {enrichedNeeds.map((need) => (
              <button
                key={need.name}
                type="button"
                role="tab"
                aria-selected={activeNeed === need.name}
                className={activeNeed === need.name ? 'active' : ''}
                onClick={() => setActiveNeed(need.name)}
              >
                <span>{need.index}</span>
                {need.name}
              </button>
            ))}
          </div>

          <div className="needs-spotlight-bento">
            {/* Left Diagnostic & Ritual Overview */}
            <div className="needs-diagnostic-card">
              <div className="needs-diagnostic-visual">
                <img src={selectedNeedData.image} alt={selectedNeedData.name} />
                <div className="needs-diagnostic-overlay">
                  <span className="needs-diagnostic-pill">Focus {selectedNeedData.index}</span>
                  <h3>{selectedNeedData.name}</h3>
                  <p>{selectedNeedData.description}</p>
                </div>
              </div>

              <div className="needs-diagnostic-content">
                <div className="needs-diagnostic-block">
                  <h4>Signs your hair needs {selectedNeedData.name.toLowerCase()} care</h4>
                  <ul className="needs-signs-checklist">
                    {selectedNeedData.signs.map((sign) => (
                      <li key={sign}>
                        <CheckCircle2 size={16} />
                        <span>{sign}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="needs-diagnostic-block">
                  <h4>Key botanical actives</h4>
                  <p className="needs-actives-copy">{selectedNeedData.actives}</p>
                </div>

                <div className="needs-diagnostic-block">
                  <h4>Recommended 3-step ritual</h4>
                  <div className="needs-ritual-steps">
                    {selectedNeedData.ritual.map((item) => (
                      <div key={item.step} className="needs-ritual-step">
                        <span className="needs-step-num">{item.step}</span>
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="needs-diagnostic-footer">
                  <Link
                    to={`/shop?need=${encodeURIComponent(selectedNeedData.name)}`}
                    className="button primary"
                  >
                    <span>Shop all {selectedNeedData.name} formulas</span>
                    <ArrowUpRight size={16} />
                  </Link>
                  <Link to="/routines" className="button secondary">
                    <span>View full wash-day routines</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Targeted Formulas */}
            <div className="needs-formulas-panel">
              <div className="needs-formulas-header">
                <div>
                  <p className="eyebrow">Targeted Formulas</p>
                  <h3>Formulated for {selectedNeedData.name}</h3>
                </div>
                <Link
                  to={`/shop?need=${encodeURIComponent(selectedNeedData.name)}`}
                  className="text-link"
                >
                  <span>View in shop ({selectedNeedData.matchingProducts.length})</span>
                  <ArrowUpRight size={16} />
                </Link>
              </div>

              <div className="needs-formulas-grid product-grid">
                {selectedNeedData.matchingProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
