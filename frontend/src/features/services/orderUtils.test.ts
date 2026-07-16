import { describe, expect, it } from 'vitest'
import { moveOrderedItem, normalizeOrder, removeOrderedItem } from './orderUtils'

const items = [
  { order: 3, name: 'A' },
  { order: 8, name: 'B' },
  { order: 12, name: 'C' },
]

describe('ordered service configuration helpers', () => {
  it('normalizes order from the current visual position', () => {
    expect(normalizeOrder(items).map((item) => item.order)).toEqual([1, 2, 3])
  })

  it('moves an item and updates every order', () => {
    expect(moveOrderedItem(items, 2, 1)).toEqual([
      { order: 1, name: 'A' },
      { order: 2, name: 'C' },
      { order: 3, name: 'B' },
    ])
  })

  it('removes an item and closes the order gap', () => {
    expect(removeOrderedItem(items, 1)).toEqual([
      { order: 1, name: 'A' },
      { order: 2, name: 'C' },
    ])
  })

  it('allows the last item to be removed', () => {
    expect(removeOrderedItem([{ order: 1, name: 'A' }], 0)).toEqual([])
  })
})
