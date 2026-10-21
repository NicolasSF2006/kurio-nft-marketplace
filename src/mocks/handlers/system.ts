import { delay, http, HttpResponse } from 'msw'
import { env } from '@/app/env'
import { systemHealth } from '@/mocks/fixtures/system'
import { scenario } from '@/mocks/scenarios'
import type { ApiError } from '@/types/system'

const healthUrl = new URL(`${env.apiBaseUrl.replace(/\/$/, '')}/health`, window.location.origin)

export const systemHandlers = [
  http.get(healthUrl.href, async () => {
    await delay(scenario.latency)
    if (scenario.failure === 'network') return HttpResponse.error()
    if (scenario.failure === 'http') {
      return HttpResponse.json<ApiError>(
        { code: 'SERVICE_UNAVAILABLE', message: 'Serviço temporariamente indisponível.' },
        { status: 503 },
      )
    }
    return HttpResponse.json(systemHealth)
  }),
]
