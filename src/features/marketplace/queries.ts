import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { MarketplacePreview } from '@/types/marketplace'

export const marketplacePreviewOptions = queryOptions({
  queryKey: ['preview', 'marketplace'],
  queryFn: async ({ signal }) => {
    const response = await api.get<MarketplacePreview>('/preview', { signal })
    return response.data
  },
})
