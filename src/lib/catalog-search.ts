import type { CatalogSearch, Sort } from '@/types/api'

export function validateCatalogSearch(input: Record<string, unknown>): CatalogSearch {
  const text = (key: string) =>
    typeof input[key] === 'string' ||
    (typeof input[key] === 'number' && Number.isFinite(input[key]))
      ? String(input[key]).slice(0, 120)
      : ''
  const sort = text('sort')
  return {
    q: text('q'),
    collection: text('collection'),
    network: text('network'),
    maxPrice: /^\d{1,3}(\.\d{1,6})?$/.test(text('maxPrice')) ? text('maxPrice') : '',
    sort: (['recent', 'price-asc', 'price-desc', 'popular'].includes(sort)
      ? sort
      : 'recent') as Sort,
    page: Math.max(1, Math.min(10000, Math.floor(Number(input.page) || 1))),
    favorites: input.favorites === true || input.favorites === 'true',
    launches: input.launches === true || input.launches === 'true',
  }
}
