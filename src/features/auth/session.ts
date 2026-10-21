import { queryOptions } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { redirect } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/query-client'
import { setToken } from '@/lib/session-storage'
import type { AuthResponse, Session } from '@/types/api'

export const sessionOptions = queryOptions({
  queryKey: ['session'],
  retry: false,
  staleTime: 0,
  queryFn: async ({ signal }): Promise<Session | null> => {
    try {
      return (await api.get<Session | null>('/auth/session', { signal })).data
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) return null
      throw error
    }
  },
})
export async function clearPrivateCache() {
  const predicate = (query: { queryKey: readonly unknown[] }) =>
    ['private', 'cart', 'quote'].includes(String(query.queryKey[0])) ||
    (query.queryKey[0] === 'catalog' &&
      Boolean((query.queryKey[1] as { favorites?: boolean })?.favorites))
  await queryClient.cancelQueries({ predicate })
  queryClient.removeQueries({ predicate })
  queryClient.getMutationCache().clear()
}
export async function acceptSession(result: AuthResponse) {
  await queryClient.cancelQueries({ queryKey: sessionOptions.queryKey })
  await clearPrivateCache()
  setToken(result.token)
  queryClient.setQueryData(sessionOptions.queryKey, () => ({
    user: result.user,
    expiresAt: result.expiresAt,
  }))
}
export async function endSession() {
  await queryClient.cancelQueries({ queryKey: sessionOptions.queryKey })
  setToken(null)
  await clearPrivateCache()
  queryClient.setQueryData(sessionOptions.queryKey, null)
}
export async function requireSession({ location }: { location: { href: string } }) {
  const session = await queryClient.fetchQuery(sessionOptions)
  if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
}
export function authSearch(input: Record<string, unknown>) {
  const value = typeof input.redirect === 'string' ? input.redirect : '/profile'
  // Only local paths; never permit protocol-relative or external redirects.
  return {
    redirect:
      value.startsWith('/') &&
      !value.startsWith('//') &&
      !value.includes('\\') &&
      !/^\/(login|signup)([/?#]|$)/.test(value)
        ? value
        : '/profile',
  }
}
