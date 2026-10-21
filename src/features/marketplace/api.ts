import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { sessionOptions } from '@/features/auth/session'
import type {
  AddCartInput,
  Cart,
  CatalogNft,
  CatalogResponse,
  CatalogSearch,
  PasswordInput,
  Profile,
  ProfileInput,
  Quote,
  Wallet,
  WalletInput,
} from '@/types/api'

export const catalogOptions = (search: CatalogSearch, userId = 'guest') =>
  queryOptions({
    queryKey: ['catalog', search, search.favorites ? userId : 'public'],
    queryFn: async ({ signal }) =>
      (await api.get<CatalogResponse>('/nfts', { params: search, signal })).data,
  })
export const nftOptions = (id: string) =>
  queryOptions({
    queryKey: ['nft', id],
    queryFn: async ({ signal }) =>
      (await api.get<CatalogNft>(`/nfts/${encodeURIComponent(id)}`, { signal })).data,
  })
export const favoritesOptions = (userId: string) =>
  queryOptions({
    queryKey: ['private', userId, 'favorites'],
    queryFn: async ({ signal }) => (await api.get<string[]>('/favorites', { signal })).data,
    enabled: userId !== 'guest',
  })
export const cartOptions = (userId: string) =>
  queryOptions({
    queryKey: ['cart', userId],
    staleTime: 0,
    queryFn: async ({ signal }) => (await api.get<Cart>('/cart', { signal })).data,
  })
export const quoteOptions = (userId: string, cart: Cart | undefined) =>
  queryOptions<Quote>({
    queryKey: ['quote', userId, cart],
    enabled: !!cart,
    staleTime: 0,
    placeholderData: (previous, query) => (query?.queryKey[1] === userId ? previous : undefined),
    queryFn: async ({ signal }) => (await api.post<Quote>('/cart/quote', null, { signal })).data,
  })
export const profileOptions = (id: string) =>
  queryOptions({
    queryKey: ['private', id, 'profile'],
    enabled: id !== 'guest',
    queryFn: async ({ signal }) => (await api.get<Profile>('/profile', { signal })).data,
  })
export const walletsOptions = (id: string) =>
  queryOptions({
    queryKey: ['private', id, 'wallets'],
    enabled: id !== 'guest',
    queryFn: async ({ signal }) => (await api.get<Wallet[]>('/wallets', { signal })).data,
  })
export function useIdentity() {
  return useQuery(sessionOptions).data?.user.id ?? 'guest'
}
export function useCart() {
  return useQuery(cartOptions(useIdentity()))
}
export function useCartMutation() {
  const client = useQueryClient()
  const id = useIdentity()
  return useMutation({
    mutationFn: async (
      action:
        | { type: 'add'; input: AddCartInput }
        | { type: 'quantity'; id: string; quantity: number }
        | { type: 'remove'; id: string }
        | { type: 'coupon'; code: string | null },
    ) => {
      if (action.type === 'add') return (await api.post<Cart>('/cart/items', action.input)).data
      if (action.type === 'quantity')
        return (
          await api.patch<Cart>(`/cart/items/${encodeURIComponent(action.id)}`, {
            quantity: action.quantity,
          })
        ).data
      if (action.type === 'remove')
        return (await api.delete<Cart>(`/cart/items/${encodeURIComponent(action.id)}`)).data
      return action.code === null
        ? (await api.delete<Cart>('/cart/coupon')).data
        : (await api.put<Cart>('/cart/coupon', { code: action.code })).data
    },
    onSuccess: async (data) => {
      // Never repopulate a previous identity's cache after logout/account switch.
      const current = client.getQueryData(sessionOptions.queryKey)?.user.id ?? 'guest'
      if (id !== current) return
      client.setQueryData(cartOptions(id).queryKey, data)
      await client.invalidateQueries({ queryKey: ['quote', id] })
    },
  })
}
export function useFavoriteMutation() {
  const client = useQueryClient()
  const id = useIdentity()
  const key = favoritesOptions(id).queryKey
  return useMutation({
    mutationKey: ['favorite', id],
    mutationFn: async ({ nftId, selected }: { nftId: string; selected: boolean }) =>
      selected
        ? (await api.delete<string[]>(`/favorites/${encodeURIComponent(nftId)}`)).data
        : (await api.post<string[]>('/favorites', { nftId })).data,
    onMutate: async ({ nftId, selected }) => {
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<string[]>(key) ?? []
      client.setQueryData(
        key,
        selected ? previous.filter((value) => value !== nftId) : [...new Set([...previous, nftId])],
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (client.getQueryData(sessionOptions.queryKey)?.user.id === id)
        client.setQueryData(key, context?.previous)
    },
    onSettled: async () => {
      if (client.getQueryData(sessionOptions.queryKey)?.user.id === id) {
        await client.invalidateQueries({ queryKey: key })
        await client.invalidateQueries({
          queryKey: ['catalog'],
          predicate: (query) => Boolean((query.queryKey[1] as CatalogSearch)?.favorites),
        })
      }
    },
  })
}
export function useProfileMutation() {
  const client = useQueryClient()
  const id = useIdentity()
  return useMutation({
    mutationFn: async (input: ProfileInput) => (await api.patch<Profile>('/profile', input)).data,
    onSuccess: (profile) => {
      const session = client.getQueryData(sessionOptions.queryKey)
      if (session?.user.id !== id) return
      client.setQueryData(profileOptions(id).queryKey, profile)
      client.setQueryData(sessionOptions.queryKey, () => ({ ...session, user: profile }))
    },
  })
}
export function usePasswordMutation() {
  return useMutation({
    mutationFn: async (input: PasswordInput) => {
      await api.put('/profile/password', input)
    },
  })
}
export function useWalletMutation() {
  const client = useQueryClient()
  const id = useIdentity()
  return useMutation({
    mutationFn: async (input: { id?: string; wallet: WalletInput }) =>
      input.id
        ? (await api.patch<Wallet>(`/wallets/${encodeURIComponent(input.id)}`, input.wallet)).data
        : (await api.post<Wallet>('/wallets', input.wallet)).data,
    onSuccess: async () => {
      if (client.getQueryData(sessionOptions.queryKey)?.user.id === id)
        await client.invalidateQueries({ queryKey: walletsOptions(id).queryKey })
    },
  })
}
