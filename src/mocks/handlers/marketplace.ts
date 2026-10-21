import { delay, http, HttpResponse } from 'msw'
import { env } from '@/app/env'
import { marketplacePreview } from '@/mocks/fixtures/marketplace'
import { scenario } from '@/mocks/scenarios'

const url = new URL(`${env.apiBaseUrl.replace(/\/$/, '')}/preview`, window.location.origin)

export const marketplaceHandlers = [
  http.get(url.href, async () => {
    await delay(scenario.latency)
    if (scenario.failure === 'network') return HttpResponse.error()
    if (scenario.failure === 'http')
      return HttpResponse.json(
        { code: 'PREVIEW_UNAVAILABLE', message: 'Prévia indisponível.' },
        { status: 503 },
      )
    return HttpResponse.json(marketplacePreview)
  }),
]
