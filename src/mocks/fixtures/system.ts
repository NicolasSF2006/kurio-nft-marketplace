import type { RealtimeReady, SystemHealth } from '@/types/system'

export const systemHealth = { status: 'ok', service: 'kurio' } satisfies SystemHealth
export const realtimeReady = { status: 'ok', transport: 'socket.io' } satisfies RealtimeReady
