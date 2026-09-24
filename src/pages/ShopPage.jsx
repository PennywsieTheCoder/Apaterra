import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import PageBanner from '../components/PageBanner'
import { categories, hairNeeds, products } from '../data/catalog'

export default function ShopPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const category = params.get('category') || 'All'
  const need = params.get('need') || ''

  const filtered = useMemo(() => products.filter((product) => {
    const matchesCategory = category === 'All' || product.category === category
    const matchesNeed = !need || product.needs.includes(need)
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || `${product.name} ${product.type} ${product.category} ${product.needs.join(' ')}`.toLowerCase().includes(query)
    return matchesCategory && matchesNeed && matchesSearch
  }), [category, need, search])

  function updateFilter(key, value) {
    const next = new URLSearchParams(params)
    if (!value || value === 'All') next.delete(key)
    else next.set(key, value)
    setParams(next)
  }

  function resetFilters() {
    setParams({})
    setSearch('')
  }

  return <main className="shop-page page-shell">
    <PageBanner eyebrow="The collection" title={<>Care for every part<br />of your routine.</>} copy="Explore purposeful formulas for cleansing, moisture, strength, scalp health and styling." images={[products[7].image, products[2].image]} variant="shop-banner" />
    <div className="shop-toolbar"><label><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the collection" /></label><span><SlidersHorizontal size={16} /> {filtered.length} products</span></div>
    <div className="shop-layout">
      <aside className="filter-panel"><div><h2>Category</h2>{categories.map((item) => <button type="button" className={category === item ? 'active' : ''} onClick={() => updateFilter('category', item)} key={item}>{item}</button>)}</div><div><h2>Hair need</h2>{hairNeeds.map(({ name }) => <button type="button" className={need === name ? 'active' : ''} onClick={() => updateFilter('need', need === name ? '' : name)} key={name}>{name}</button>)}</div>{(category !== 'All' || need || search) && <button type="button" className="reset-filters" onClick={resetFilters}><X size={14} /> Reset filters</button>}</aside>
      <section><div className="mobile-filter-row"><select aria-label="Filter by category" value={category} onChange={(event) => updateFilter('category', event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter by hair need" value={need} onChange={(event) => updateFilter('need', event.target.value)}><option value="">All hair needs</option>{hairNeeds.map(({ name }) => <option key={name}>{name}</option>)}</select></div>{filtered.length ? <div className="product-grid shop-product-grid">{filtered.map((product) => <ProductCard product={product} key={product.id} />)}</div> : <div className="empty-results"><h2>No products found</h2><p>Try another category, hair need or search term.</p><button type="button" onClick={resetFilters}>View all products</button></div>}</section>
    </div>
  </main>
}
