import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Leaf, PackagePlus } from 'lucide-react'
import { categories, hairNeeds } from '../data/catalog'

const initialProduct = {
  name: '', type: '', category: 'Shampoo', price: '', size: '', needs: [], badge: 'New', image: '',
  description: '', ingredients: '', directions: '', benefits: '', cardColor: '#d7d8d4',
}

const productTypes = [
  'Hydrating shampoo', 'Scalp-clearing shampoo', 'Fortifying conditioner', 'Deep treatment mask',
  'Leave-in conditioner', 'Scalp and hair oil', 'Defining styling cream', 'Protective-style refresher',
]

const badges = ['New', 'Bestseller', 'Everyday care', 'Wash-day essential', 'Lightweight', 'Fresh start', 'Flexible hold', 'Strength care', 'Protective care']
const sizes = ['50 ml', '100 ml', '150 ml', '200 ml', '250 ml', '300 ml', '500 ml', '1 L']

function createId(name) {
  return `${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`
}

function AdminSelect({ label, value, options, placeholder, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [customOptions, setCustomOptions] = useState([])
  const fieldRef = useRef(null)
  const allOptions = [...options, ...customOptions]
  const filteredOptions = allOptions.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()))
  const canAddOption = query.trim() && !allOptions.some((option) => option.toLowerCase() === query.trim().toLowerCase())

  useEffect(() => {
    if (!open) return undefined
    const closeOnOutsideClick = (event) => {
      if (!fieldRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [open])

  function chooseOption(option) {
    onChange(option)
    setQuery('')
    setOpen(false)
  }

  return <div className="admin-select-field" ref={fieldRef}>
    <span>{label}</span>
    <button type="button" className="admin-select-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}><strong>{value || placeholder}</strong><ChevronDown size={16} /></button>
    {open && <div className="admin-select-options" role="listbox" aria-label={label}><input className="admin-select-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search or add ${label.toLowerCase()}`} aria-label={`Search or add ${label.toLowerCase()}`} autoFocus />{canAddOption && <button type="button" className="admin-select-add" onClick={() => { const next = query.trim(); setCustomOptions((current) => [...current, next]); chooseOption(next) }}><span>Add “{query.trim()}”</span><span>Use custom value</span></button>}{filteredOptions.map((option) => <button type="button" role="option" aria-selected={value === option} className={value === option ? 'selected' : ''} key={option} onClick={() => chooseOption(option)}><span>{option}</span>{value === option && <Check size={15} />}</button>)}{!filteredOptions.length && !canAddOption && <p>No matching options.</p>}</div>}
  </div>
}

export default function AdminPage() {
  const [form, setForm] = useState(initialProduct)
  const [message, setMessage] = useState('')
  const [imageName, setImageName] = useState('')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setMessage('')
  }

  function toggleNeed(need) {
    setForm((current) => ({ ...current, needs: current.needs.includes(need) ? current.needs.filter((item) => item !== need) : [...current.needs, need] }))
    setMessage('')
  }

  function updateImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage('Choose a JPG, PNG or WebP image.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setMessage('Choose an image smaller than 3 MB so it can be stored in this browser.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm((current) => ({ ...current, image: reader.result }))
      setImageName(file.name)
      setMessage('')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function addProduct(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.type.trim() || !form.price || !form.size.trim() || !form.description.trim() || !form.image) {
      setMessage('Add a name, product type, price, size, description and product image before publishing.')
      return
    }
    const product = {
      ...form,
      id: createId(form.name),
      price: Number(form.price),
      needs: form.needs.length ? form.needs : ['Moisture'],
      benefits: form.benefits.split('\n').map((item) => item.trim()).filter(Boolean),
      visual: 'product-admin',
    }
    try {
      const saved = JSON.parse(window.localStorage.getItem('apaterra-admin-products') || '[]')
      const next = [...(Array.isArray(saved) ? saved : []), product]
      window.localStorage.setItem('apaterra-admin-products', JSON.stringify(next))
      window.dispatchEvent(new CustomEvent('apaterra-products-updated'))
      setForm(initialProduct)
      setImageName('')
      setMessage(`${product.name} is now live in the shop.`)
    } catch {
      setMessage('This product could not be saved in this browser. Please try again.')
    }
  }

  return <main className="admin-page page-shell">
    <section className="admin-hero"><div><p className="eyebrow">Apa Terra admin</p><h1>Build the collection.</h1><p>Add a new product to this browser’s storefront catalogue.</p></div><span><PackagePlus size={28} /></span></section>
    <form className="admin-product-form" onSubmit={addProduct}>
      <header><div><p className="eyebrow">New product</p><h2>Product details</h2></div><span><Leaf size={17} /> Storefront draft</span></header>
      <div className="admin-fields">
        <label><span>Product name</span><input name="name" value={form.name} onChange={updateField} placeholder="e.g. Nourish Cream" /></label>
        <AdminSelect label="Product type" value={form.type} options={productTypes} placeholder="Select product type" onChange={(type) => { setForm((current) => ({ ...current, type })); setMessage('') }} />
        <AdminSelect label="Category" value={form.category} options={categories.filter((item) => item !== 'All')} placeholder="Select category" onChange={(category) => { setForm((current) => ({ ...current, category })); setMessage('') }} />
        <label><span>Price (GHS)</span><input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField} placeholder="0.00" /></label>
        <AdminSelect label="Size" value={form.size} options={sizes} placeholder="Select size" onChange={(size) => { setForm((current) => ({ ...current, size })); setMessage('') }} />
        <AdminSelect label="Badge" value={form.badge} options={badges} placeholder="Select badge" onChange={(badge) => { setForm((current) => ({ ...current, badge })); setMessage('') }} />
        <label className="admin-full"><span>Product image</span><input className="admin-image-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={updateImage} /><small className="admin-image-help">{imageName ? `Selected: ${imageName}` : 'Choose a JPG, PNG or WebP image (up to 3 MB).'}</small></label>
        <label className="admin-full"><span>Description</span><textarea name="description" rows="3" value={form.description} onChange={updateField} placeholder="A concise description for the collection." /></label>
        <label><span>Key ingredients</span><textarea name="ingredients" rows="3" value={form.ingredients} onChange={updateField} placeholder="Shea butter, baobab oil…" /></label>
        <label><span>How to use</span><textarea name="directions" rows="3" value={form.directions} onChange={updateField} placeholder="Apply to clean, damp hair…" /></label>
        <label className="admin-full"><span>Benefits <small>(one per line)</small></span><textarea name="benefits" rows="3" value={form.benefits} onChange={updateField} placeholder={'Defines curls\nHelps seal in moisture'} /></label>
      </div>
      <fieldset className="admin-needs"><legend>Hair needs</legend><div>{hairNeeds.map(({ name }) => <label key={name}><input type="checkbox" checked={form.needs.includes(name)} onChange={() => toggleNeed(name)} /><span>{name}</span></label>)}</div></fieldset>
      <footer>{message && <p className={message.includes('live') ? 'success' : 'error'} role="status">{message.includes('live') && <Check size={15} />}{message}</p>}<button type="submit">Publish product <PackagePlus size={16} /></button></footer>
    </form>
  </main>
}
