import { env } from '@/app/env'
import { read } from '@/mocks/state'
import { mockScenarioNames, type ScenarioName } from '@/types/api'

if (!mockScenarioNames.includes(env.mockScenario as ScenarioName))
  throw new Error(`Cenário MSW inválido: ${env.mockScenario}`)
export function activeScenario(): ScenarioName {
  try {
    return read().scenario
  } catch {
    return env.mockScenario as ScenarioName
  }
}
export function networkCondition(request?: Request) {
  const name = activeScenario()
  const url = request ? new URL(request.url) : null
  const hash = Array.from(url?.search ?? '').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return {
    latency:
      name === 'slow'
        ? 2000
        : name === 'variable'
          ? 80 + (hash % 7) * 160
          : name === 'out-of-order'
            ? Math.max(80, 1000 - (url?.searchParams.get('q')?.length ?? 0) * 160)
            : 120,
    failure: name === 'offline' ? 'network' : name === 'error' ? 'http' : null,
  }
}
// Retain the original diagnostic/preview API contract.
export const scenario = {
  get latency() {
    return networkCondition().latency
  },
  get failure() {
    return networkCondition().failure
  },
}
