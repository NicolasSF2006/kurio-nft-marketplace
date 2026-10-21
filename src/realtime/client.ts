import { io, type Socket } from 'socket.io-client'
import { env } from '@/app/env'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types/system'

export type RealtimeClient = Socket<ServerToClientEvents, ClientToServerEvents>

// Register listeners before connecting; dispose the connection when its owner unmounts.
export function createRealtimeClient(): RealtimeClient {
  return io(env.socketUrl, {
    autoConnect: false,
    forceNew: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 250,
    reconnectionDelayMax: 1000,
    randomizationFactor: 0,
    timeout: 10_000,
  })
}
