import { env } from '@/app/env'
import { queryClient } from '@/lib/query-client'

export async function initializeNetwork() {
  if (env.mocksEnabled) {
    const [{ initializeDatabase }, { scheduleOrders }, { worker }, { api }, { setToken }] =
      await Promise.all([
        import('@/mocks/state'),
        import('@/mocks/purchases'),
        import('@/mocks/browser'),
        import('@/lib/api'),
        import('@/lib/session-storage'),
      ])
    await initializeDatabase(env.mockScenario as import('@/types/api').ScenarioName)
    scheduleOrders()
    await worker.start({
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
      onUnhandledRequest(request, print) {
        if (new URL(request.url).pathname.startsWith('/api/')) print.error()
      },
    })
    window.kurioMocks = {
      async reset(scenario = 'default') {
        await queryClient.cancelQueries()
        await api.post('/__mock/reset', { scenario })
        setToken(null)
        const { clearAttempts } = await import('@/lib/checkout-attempt')
        clearAttempts()
        queryClient.clear()
        window.dispatchEvent(new Event('kurio:mock-reset'))
      },
      async scenario(name) {
        await api.post('/__mock/scenario', { name })
        await queryClient.invalidateQueries()
      },
      async expireSession() {
        await api.post('/__mock/expire-session')
        await queryClient.invalidateQueries({ queryKey: ['session'] })
      },
      async action(action) {
        await api.post('/__mock/action', { action })
      },
      async replayOrder(attempt) {
        return (
          await api.post<import('@/types/orders').Order>('/orders', attempt.input, {
            headers: { 'Idempotency-Key': attempt.key },
            timeout: 1000,
          })
        ).data
      },
    }
    return
  }

  // Avoid interception by a previous demo loaded on the same origin.
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
      registrations
        .filter((registration) => {
          const script = registration.active?.scriptURL
          return (
            script && new URL(script).pathname === `${import.meta.env.BASE_URL}mockServiceWorker.js`
          )
        })
        .map((registration) => registration.unregister()),
    )
  }
}
