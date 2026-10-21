import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SystemHealth } from '@/types/system'

export const systemHealthOptions = queryOptions({
  queryKey: ['system', 'health'],
  queryFn: async ({ signal }) => {
    const { data } = await api.get<SystemHealth>('/health', { signal })
    return data
  },
})
