export function isRevenueOrder(order) {
  return order?.status !== 'Cancelled'
}

export function sumOrderRevenue(orders) {
  return orders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0)
}

export function sumOrderUnits(orders) {
  return orders.reduce(
    (sum, order) => sum + (order.items || []).reduce(
      (itemSum, item) => itemSum + Number(item.quantity || 0),
      0
    ),
    0
  )
}

export function calculateFulfilmentRate(orders) {
  if (!orders.length) return 0
  const delivered = orders.filter((order) => order.status === 'Delivered').length
  return Math.round((delivered / orders.length) * 100)
}
