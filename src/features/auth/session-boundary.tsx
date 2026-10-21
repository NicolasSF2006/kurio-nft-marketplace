import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useRouter } from '@tanstack/react-router'
import { clearPrivateCache, endSession, sessionOptions } from './session'
import { queryClient } from '@/lib/query-client'
import { getToken, sessionExpiredEvent } from '@/lib/session-storage'

export function SessionBoundary() {
  const session = useQuery({ ...sessionOptions, refetchInterval: 15000 })
  const location = useLocation()
  const navigate = useNavigate()
  const router = useRouter()
  useEffect(() => {
    const expire = () => {
      void endSession().then(() => router.invalidate())
    }
    const synchronize = (event: StorageEvent) => {
      if (event.key === 'kurio.session.token') {
        void clearPrivateCache().then(async () => {
          await queryClient.invalidateQueries({ queryKey: sessionOptions.queryKey })
          await router.invalidate()
        })
      }
    }
    window.addEventListener(sessionExpiredEvent, expire)
    window.addEventListener('kurio:mock-reset', expire)
    window.addEventListener('storage', synchronize)
    return () => {
      window.removeEventListener(sessionExpiredEvent, expire)
      window.removeEventListener('kurio:mock-reset', expire)
      window.removeEventListener('storage', synchronize)
    }
  }, [router])
  useEffect(() => {
    if (!session.data) return
    const timer = window.setTimeout(
      () => {
        void endSession().then(() => router.invalidate())
      },
      Math.max(0, session.data.expiresAt - Date.now()),
    )
    return () => window.clearTimeout(timer)
  }, [session.data, router])
  useEffect(() => {
    if (
      !session.isPending &&
      session.data === null &&
      !getToken() &&
      (['/profile', '/wallets', '/checkout'].includes(location.pathname) ||
        location.pathname.startsWith('/orders'))
    ) {
      void navigate({ to: '/login', search: { redirect: location.href }, replace: true })
    }
  }, [session.isPending, session.data, location.pathname, location.href, navigate])
  return null
}
