import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import { hairNeeds, products } from '../data/catalog'

export default function StoryPage() {
  return (
    <main className="story-page page-shell">
      <ScrollReveal className="story-hero" rootMargin="0px 0px 8% 0px" threshold={0.05}>
        <div>
          <p className="eyebrow">Why Apa Terra</p>
          <h1>Textured hair comes first.</h1>
          <p className="story-hero-copy">
            Apa Terra brings products and guidance together for curls, coils, locs and protective styles.
          </p>
        </div>
        <div className="story-collage">
          <img src={hairNeeds[4].image} alt="Woman wearing her natural afro" />
          <img src={products[2].image} alt="Rooted Drops hair and scalp oil" />
        </div>
      </ScrollReveal>

      <ScrollReveal className="story-copy" rootMargin="0px 0px 8% 0px" threshold={0.05}>
        <p className="story-lead">
          We organise the range around familiar hair needs, so it is easier to choose what belongs in your wash day and daily care.
        </p>
        <div>
          <article>
            <span>01</span>
            <h2>Start with the need</h2>
            <p>Shop by moisture, breakage, scalp care, protective styles or definition.</p>
          </article>
          <article>
            <span>02</span>
            <h2>Know the next step</h2>
            <p>Clear product directions show what to use, when to use it and what follows.</p>
          </article>
          <article>
            <span>03</span>
            <h2>Made for real routines</h2>
            <p>Build a simple set of products that fits how you wash, style and maintain your hair.</p>
          </article>
        </div>
      </ScrollReveal>

      <ScrollReveal className="story-cta" rootMargin="0px 0px 8% 0px" threshold={0.05}>
        <p className="eyebrow">Find your products</p>
        <h2>Start with your hair need.</h2>
        <Link className="button button-primary" to="/hair-needs">Shop by hair need</Link>
      </ScrollReveal>
    </main>
  )
}
