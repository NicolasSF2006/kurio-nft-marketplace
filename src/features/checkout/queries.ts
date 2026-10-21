import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Order } from '@/types/orders'

export const ordersOptions = (userId: string) =>
  queryOptions({
    queryKey: ['private', userId, 'orders'],
    enabled: userId !== 'guest',
    staleTime: 0,
    queryFn: async ({ signal }) => (await api.get<Order[]>('/orders', { signal })).data,
  })
export const orderOptions = (userId: string, orderId: string) =>
  queryOptions({
    queryKey: ['private', userId, 'order', orderId],
    enabled: userId !== 'guest',
    staleTime: 0,
    structuralSharing: (oldValue: unknown, newData: unknown) => {
      const previous = oldValue as Order | undefined
      const newValue = newData as Order
      return previous &&
        (previous.version > newValue.version ||
          (previous.status !== 'pending' && newValue.status !== previous.status))
        ? previous
        : newValue
    },
    queryFn: async ({ signal }) =>
      (await api.get<Order>(`/orders/${encodeURIComponent(orderId)}`, { signal })).data,
  })
