import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageBanner from '../components/PageBanner'
import ScrollReveal from '../components/ScrollReveal'
import { hairNeeds } from '../data/catalog'

export default function HairNeedsPage() {
  return (
    <main className="hair-needs-page page-shell">
      <PageBanner
        eyebrow="Start with your hair"
        title={<><span>Your texture.</span><br /><span>Your needs.</span> <span>Your ritual.</span></>}
        copy="Shop with confidence by starting with what your hair needs today—from lasting moisture to protective-style care."
        images={[hairNeeds[4].image, hairNeeds[3].image]}
        variant="needs-banner"
      />
      <ScrollReveal className="needs-directory" rootMargin="0px 0px 8% 0px" threshold={0.05}>
        <div className="featured-heading"><div><p className="eyebrow">Choose your focus</p><h2>Care that meets you where you are.</h2></div></div>
        <div className="needs-directory-grid">
          {hairNeeds.map(({ name, description, image }) => <Link to={`/shop?need=${encodeURIComponent(name)}`} key={name}><img src={image} alt={`${name} hair-care placeholder`} /><div><span>{name}</span><p>{description}</p><ArrowUpRight size={17} /></div></Link>)}
        </div>
      </ScrollReveal>
    </main>
  )
}
