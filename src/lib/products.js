export function mapSupabaseProduct(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    category: row.category,
    needs: Array.isArray(row.needs) ? row.needs : [],
    price: Number(row.price),
    size: row.size,
    visual: 'product-admin',
    image: row.image_url,
    imagePath: row.image_path,
    cardColor: row.card_color,
    badge: row.badge,
    description: row.description,
    benefits: Array.isArray(row.benefits) ? row.benefits : [],
    ingredients: row.ingredients,
    directions: row.directions,
    stock: Number(row.stock) || 0,
    active: row.active,
    isSupabaseProduct: true,
  }
}
