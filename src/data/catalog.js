import moistureWashImage from '../assets/products/moisture-wash.jpg'
import softeningRitualImage from '../assets/products/softening-ritual.jpg'
import rootedDropsImage from '../assets/products/rooted-drops.jpg'
import dailyVeilImage from '../assets/products/daily-veil.jpg'
import balanceCleanseImage from '../assets/products/balance-cleanse.jpg'
import coilCustardImage from '../assets/products/coil-custard.jpg'
import strengthRinseImage from '../assets/products/strength-rinse.jpg'
import braidMistImage from '../assets/products/braid-mist.jpg'
import moistureNeedImage from '../assets/hair-needs/moisture-v2.png'
import breakageNeedImage from '../assets/hair-needs/breakage-v2.png'
import scalpNeedImage from '../assets/hair-needs/scalp-care-v2.png'
import protectiveNeedImage from '../assets/hair-needs/protective-styles-v2.png'
import definitionNeedImage from '../assets/hair-needs/definition-v2.png'

export const categories = [
  'All',
  'Shampoo',
  'Conditioner',
  'Leave-in care',
  'Treatments',
  'Oils & serums',
  'Styling',
  'Scalp care',
]

export const hairNeeds = [
  { name: 'Moisture', description: 'For softness and lasting hydration', className: 'need-moisture', image: moistureNeedImage },
  { name: 'Breakage', description: 'For strength and length retention', className: 'need-strength', image: breakageNeedImage },
  { name: 'Scalp care', description: 'For a clean, balanced foundation', className: 'need-scalp', image: scalpNeedImage },
  { name: 'Protective styles', description: 'For braids, twists and locs', className: 'need-protective', image: protectiveNeedImage },
  { name: 'Definition', description: 'For touchable shape and control', className: 'need-definition', image: definitionNeedImage },
]

export const products = [
  {
    id: 'moisture-wash',
    name: 'Moisture Wash',
    type: 'Hydrating shampoo',
    category: 'Shampoo',
    needs: ['Moisture', 'Breakage'],
    price: 95,
    size: '300 ml',
    visual: 'product-wash',
    image: moistureWashImage,
    cardColor: '#cbbb9f',
    badge: 'Bestseller',
    description: 'A gentle, creamy cleanser that lifts buildup without leaving textured hair feeling stripped.',
    benefits: ['Cleanses gently', 'Supports moisture retention', 'Softens during wash day'],
    ingredients: 'Aloe vera, baobab oil, oat amino acids and panthenol.',
    directions: 'Massage through wet scalp and hair. Work into a rich lather, then rinse thoroughly. Repeat when needed.',
  },
  {
    id: 'softening-ritual',
    name: 'Softening Ritual',
    type: 'Deep treatment mask',
    category: 'Treatments',
    needs: ['Moisture', 'Breakage'],
    price: 120,
    size: '250 ml',
    visual: 'product-mask',
    image: softeningRitualImage,
    cardColor: '#c9c1df',
    badge: 'Wash-day essential',
    description: 'A rich conditioning treatment created to improve softness, slip and manageability.',
    benefits: ['Deeply conditions', 'Helps with detangling', 'Reduces dry feel'],
    ingredients: 'Shea butter, hibiscus extract, avocado oil and hydrolysed rice protein.',
    directions: 'Apply generously after cleansing. Detangle in sections and leave on for 15–20 minutes before rinsing.',
  },
  {
    id: 'rooted-drops',
    name: 'Rooted Drops',
    type: 'Scalp and hair oil',
    category: 'Oils & serums',
    needs: ['Scalp care', 'Protective styles'],
    price: 85,
    size: '50 ml',
    visual: 'product-oil',
    image: rootedDropsImage,
    cardColor: '#c9c1aa',
    badge: 'Lightweight',
    description: 'A lightweight botanical oil for dry scalps, protective styles and sealing in moisture.',
    benefits: ['Comforts dry scalp', 'Adds lightweight shine', 'Easy precision application'],
    ingredients: 'Baobab oil, jojoba oil, black seed oil and rosemary leaf extract.',
    directions: 'Apply a few drops directly to the scalp or smooth over damp hair to seal in moisture.',
  },
  {
    id: 'daily-veil',
    name: 'Daily Veil',
    type: 'Leave-in conditioner',
    category: 'Leave-in care',
    needs: ['Moisture', 'Definition'],
    price: 105,
    size: '250 ml',
    visual: 'product-leavein',
    image: dailyVeilImage,
    cardColor: '#d7d8d4',
    badge: 'Everyday care',
    description: 'A weightless leave-in that restores softness and prepares curls and coils for styling.',
    benefits: ['Hydrates without heaviness', 'Improves slip', 'Prepares hair for styling'],
    ingredients: 'Aloe juice, marshmallow root, cupuaçu butter and vitamin E.',
    directions: 'Distribute through clean damp hair in sections. Do not rinse. Follow with your preferred styler.',
  },
  {
    id: 'balance-cleanse',
    name: 'Balance Cleanse',
    type: 'Scalp-clearing shampoo',
    category: 'Scalp care',
    needs: ['Scalp care'],
    price: 100,
    size: '300 ml',
    visual: 'product-scalp',
    image: balanceCleanseImage,
    cardColor: '#d7e5de',
    badge: 'Fresh start',
    description: 'A targeted cleanser that refreshes the scalp and removes product buildup while respecting the hair.',
    benefits: ['Clarifies buildup', 'Refreshes the scalp', 'Suitable for protective-style takedown'],
    ingredients: 'African black soap extract, willow bark, aloe vera and peppermint hydrosol.',
    directions: 'Apply directly to the wet scalp, massage gently and rinse. Follow with conditioner or mask.',
  },
  {
    id: 'coil-custard',
    name: 'Coil Custard',
    type: 'Defining styling cream',
    category: 'Styling',
    needs: ['Definition', 'Moisture'],
    price: 110,
    size: '300 ml',
    visual: 'product-custard',
    image: coilCustardImage,
    cardColor: '#d8d0cc',
    badge: 'Flexible hold',
    description: 'A soft-hold styling custard for defined twist-outs, braid-outs and wash-and-go styles.',
    benefits: ['Defines curls and coils', 'Controls frizz', 'Leaves a soft finish'],
    ingredients: 'Flaxseed gel, okra extract, shea esters and agave nectar.',
    directions: 'Smooth through damp hair in small sections, then style. Allow hair to dry fully before separating.',
  },
  {
    id: 'strength-rinse',
    name: 'Strength Rinse',
    type: 'Fortifying conditioner',
    category: 'Conditioner',
    needs: ['Breakage'],
    price: 108,
    size: '300 ml',
    visual: 'product-conditioner',
    image: strengthRinseImage,
    cardColor: '#e5cbbb',
    badge: 'Strength care',
    description: 'A strengthening rinse-out conditioner for fragile strands and hair prone to breakage.',
    benefits: ['Supports fragile hair', 'Softens and detangles', 'Improves manageability'],
    ingredients: 'Rice water ferment, moringa oil, behentrimonium methosulfate and provitamin B5.',
    directions: 'Apply from roots to ends after shampooing. Detangle, leave for 3–5 minutes and rinse well.',
  },
  {
    id: 'braid-mist',
    name: 'Braid Mist',
    type: 'Protective-style refresher',
    category: 'Leave-in care',
    needs: ['Protective styles', 'Moisture'],
    price: 78,
    size: '200 ml',
    visual: 'product-mist',
    image: braidMistImage,
    cardColor: '#c8c6b8',
    badge: 'Protective care',
    description: 'A fine hydrating mist that refreshes braids, twists and locs without heavy residue.',
    benefits: ['Refreshes dry styles', 'Lightweight hydration', 'Helps soothe the scalp'],
    ingredients: 'Rosewater, aloe juice, glycerin and baobab protein.',
    directions: 'Mist lightly over the scalp and length of the style. Massage in gently and allow to air dry.',
  },
]

export const routines = [
  {
    id: 'moisture-ritual',
    eyebrow: 'The moisture ritual',
    name: 'A complete wash day, thoughtfully layered.',
    description: 'Cleanse gently, replenish deeply and seal in moisture. Three purposeful steps designed to work better together.',
    productIds: ['moisture-wash', 'softening-ritual', 'daily-veil'],
    steps: ['Cleanse without stripping', 'Deeply condition and detangle', 'Hydrate and protect'],
  },
  {
    id: 'protective-care',
    eyebrow: 'Protective-style care',
    name: 'Keep the style. Care for the hair beneath it.',
    description: 'A lightweight routine for refreshing the scalp and maintaining moisture between wash days.',
    productIds: ['balance-cleanse', 'braid-mist', 'rooted-drops'],
    steps: ['Refresh the scalp', 'Restore lightweight moisture', 'Seal dry areas as needed'],
  },
]

export function formatMoney(value) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(value)
}
