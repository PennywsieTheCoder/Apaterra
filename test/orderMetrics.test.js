import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateFulfilmentRate,
  isRevenueOrder,
  sumOrderRevenue,
  sumOrderUnits,
} from '../src/lib/orderMetrics.js'

const orders = [
  { status: 'Delivered', subtotal: 190, items: [{ quantity: 2 }, { quantity: 1 }] },
  { status: 'Dispatched', subtotal: 95, items: [{ quantity: 1 }] },
  { status: 'Cancelled', subtotal: 300, items: [{ quantity: 3 }] },
]

test('cancelled orders are excluded from revenue and units sold', () => {
  const revenueOrders = orders.filter(isRevenueOrder)

  assert.equal(sumOrderRevenue(revenueOrders), 285)
  assert.equal(sumOrderUnits(revenueOrders), 4)
})

test('fulfilment rate is based on non-cancelled orders only', () => {
  const revenueOrders = orders.filter(isRevenueOrder)

  assert.equal(calculateFulfilmentRate(revenueOrders), 50)
  assert.equal(calculateFulfilmentRate([]), 0)
})
