import { ArrowUpRight, Check, Leaf, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import ScrollReveal from '../components/ScrollReveal'
import { useCatalog } from '../context/catalog-store'
import { categories, hairNeeds, products } from '../data/catalog'

export default function ShopPage() {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { products: catalogProducts } = useCatalog()
  const category = params.get('category') || 'All'
  const need = params.get('need') || ''
  const search = params.get('search') || ''

  const filtered = useMemo(() => catalogProducts.filter((product) => {
    const matchesCategory = category === 'All' || product.category === category
    const matchesNeed = !need || product.needs.includes(need)
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || `${product.name} ${product.type} ${product.category} ${product.needs.join(' ')}`.toLowerCase().includes(query)
    return matchesCategory && matchesNeed && matchesSearch
  }), [catalogProducts, category, need, search])

  function updateFilter(key, value) {
    const next = new URLSearchParams(params)
    if (!value || value === 'All') next.delete(key)
    else next.set(key, value)
    setParams(next)
  }

  function resetFilters() {
    setParams({})
  }

  const activeFilters = [
    category !== 'All' && { key: 'category', label: category, clearValue: 'All' },
    need && { key: 'need', label: need, clearValue: '' },
    search && { key: 'search', label: `“${search}”`, clearValue: '' },
  ].filter(Boolean)

  useEffect(() => {
    if (!filtersOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => event.key === 'Escape' && setFiltersOpen(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [filtersOpen])

  return <main className="shop-page page-shell">
    <ScrollReveal className="shop-hero" rootMargin="0px 0px 8% 0px" threshold={0.05}>
      <div className="shop-hero-copy">
        <p className="eyebrow">The Apa Terra collection</p>
        <h1>Care chosen with intention.</h1>
        <p>Build a routine around what your hair needs today—without the guesswork.</p>
        <div className="shop-hero-points"><span><Leaf size={14} /> Purposeful formulas</span><span>Made for textured hair</span></div>
      </div>
      <div className="shop-hero-gallery" aria-hidden="true">
        <div className="shop-hero-image shop-hero-image-main"><img src={products[7].image} alt="" /></div>
        <div className="shop-hero-image shop-hero-image-secondary"><img src={products[2].image} alt="" /></div>
      </div>
    </ScrollReveal>
    <ScrollReveal as="div" className="shop-toolbar">
      <div className="shop-results-title"><strong>Shop the collection</strong></div>
      <div className="shop-active-filters">
        {activeFilters.length ? activeFilters.map((filter) => <button type="button" key={filter.key} onClick={() => updateFilter(filter.key, filter.clearValue)}>{filter.label}<X size={12} /></button>) : <span>Showing the full collection</span>}
      </div>
    </ScrollReveal>
    <ScrollReveal as="div" className="shop-layout" rootMargin="0px 0px 8% 0px" threshold={0.05}>
      <aside className="filter-panel">
        <div className="filter-panel-heading"><div><p>Refine</p><h2>Find your care</h2></div><SlidersHorizontal size={18} /></div>
        <div className="filter-group"><h3>Category</h3>{categories.map((item) => <button type="button" className={category === item ? 'active' : ''} onClick={() => updateFilter('category', item)} key={item}><span>{item}</span><small>{item === 'All' ? catalogProducts.length : catalogProducts.filter((product) => product.category === item).length}</small></button>)}</div>
        <div className="filter-group"><h3>Hair need</h3>{hairNeeds.map(({ name }) => <button type="button" className={need === name ? 'active' : ''} onClick={() => updateFilter('need', need === name ? '' : name)} key={name}><span>{name}</span><ArrowUpRight size={13} /></button>)}</div>
        {(category !== 'All' || need || search) && <button type="button" className="reset-filters" onClick={resetFilters}><X size={14} /> Reset filters</button>}
      </aside>
      <section><div className="mobile-filter-row">
        <button className="mobile-filter-trigger" type="button" aria-haspopup="dialog" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(true)}>
          <span className="mobile-filter-trigger-icon"><SlidersHorizontal size={18} /></span>
          <span className="mobile-filter-trigger-copy"><small>Refine collection</small><strong>{activeFilters.length ? activeFilters.map((filter) => filter.label).join(' · ') : 'All products'}</strong></span>
          <span className={activeFilters.length ? 'mobile-filter-count active' : 'mobile-filter-count'}>{activeFilters.length || 'Filter'}</span>
        </button>
        {activeFilters.length > 0 && <div className="mobile-active-filters">{activeFilters.map((filter) => <button type="button" key={filter.key} onClick={() => updateFilter(filter.key, filter.clearValue)}>{filter.label}<X size={12} /></button>)}</div>}
      </div>
      {filtersOpen && createPortal(<div className="mobile-filter-backdrop" role="presentation" onMouseDown={() => setFiltersOpen(false)}>
        <aside className="mobile-filter-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title" onMouseDown={(event) => event.stopPropagation()}>
          <div className="mobile-filter-sheet-handle" />
          <header><div><p>Refine your care</p><h2 id="mobile-filter-title">Find your care</h2></div><button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)}><X size={19} /></button></header>
          <div className="mobile-filter-sheet-body">
            <section className="mobile-filter-options"><div className="mobile-filter-group-title"><h3>Category</h3><span>{category === 'All' ? 'All products' : category}</span></div><div className="mobile-category-options">{categories.map((item) => {
              const count = item === 'All' ? catalogProducts.length : catalogProducts.filter((product) => product.category === item).length
              const selected = category === item
              return <button type="button" className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => updateFilter('category', item)} key={item}><span>{item}</span><small>{count}</small>{selected && <Check size={14} />}</button>
            })}</div></section>
            <section className="mobile-filter-options"><div className="mobile-filter-group-title"><h3>Hair need</h3><span>{need || 'Any need'}</span></div><div className="mobile-need-options">{hairNeeds.map(({ name }) => {
              const selected = need === name
              return <button type="button" className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => updateFilter('need', selected ? '' : name)} key={name}>{selected && <Check size={14} />}<span>{name}</span></button>
            })}</div></section>
          </div>
          <footer>{activeFilters.length > 0 && <button className="mobile-filter-reset" type="button" onClick={resetFilters}>Clear all</button>}<button className="mobile-filter-apply" type="button" onClick={() => setFiltersOpen(false)}>Show {filtered.length} {filtered.length === 1 ? 'product' : 'products'}</button></footer>
        </aside>
      </div>, document.body)}
      {filtered.length ? <div className="product-grid shop-product-grid">{filtered.map((product) => <ProductCard product={product} key={product.id} />)}</div> : <div className="empty-results"><h2>No products found</h2><p>Try another category, hair need or search term.</p><button type="button" onClick={resetFilters}>View all products</button></div>}</section>
    </ScrollReveal>
  </main>
}
