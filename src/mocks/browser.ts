import { setupWorker } from 'msw/browser'
import { realtimeHandlers } from '@/mocks/handlers/realtime'
import { systemHandlers } from '@/mocks/handlers/system'
import { marketplaceHandlers } from '@/mocks/handlers/marketplace'
import { restHandlers } from '@/mocks/handlers/rest'

export const worker = setupWorker(
  ...systemHandlers,
  ...marketplaceHandlers,
  ...restHandlers,
  ...realtimeHandlers,
)
