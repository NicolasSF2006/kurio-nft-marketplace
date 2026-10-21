export interface SystemHealth {
  status: 'ok'
  service: 'kurio'
}

export interface RealtimeReady {
  status: 'ok'
  transport: 'socket.io'
}

export interface ServerToClientEvents {
  'system.ready': (payload: RealtimeReady) => void
  'session.ready': (payload: import('./orders.js').RealtimeReady) => void
  'session.expired': () => void
  'nft.updated': (payload: import('./orders.js').NftUpdated) => void
  'order.updated': (payload: import('./orders.js').OrderUpdated) => void
}

export interface ClientToServerEvents {
  'session.subscribe': (payload: { token: string | null }) => void
}

export interface ApiError {
  code: string
  message: string
}
