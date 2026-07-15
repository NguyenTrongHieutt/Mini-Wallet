export function normalizeOrder<T extends { order: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, order: index + 1 }))
}

export function moveOrderedItem<T extends { order: number }>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return normalizeOrder(items)
  }

  const next = [...items]
  const [movedItem] = next.splice(fromIndex, 1)
  if (!movedItem) return normalizeOrder(items)
  next.splice(toIndex, 0, movedItem)
  return normalizeOrder(next)
}

export function removeOrderedItem<T extends { order: number }>(items: T[], index: number): T[] {
  return normalizeOrder(items.filter((_, itemIndex) => itemIndex !== index))
}
