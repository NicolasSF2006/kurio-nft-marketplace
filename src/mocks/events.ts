import type { toSocketIo } from '@mswjs/socket.io-binding'
import type { WebSocketHandlerConnection } from 'msw'
import type { CatalogNft } from '@/types/api'
import type { NftUpdated, Order, OrderUpdated } from '@/types/orders'
import { read } from './state'

interface Peer {
  client: ReturnType<typeof toSocketIo>['client']
  raw: WebSocketHandlerConnection['client']
  token: string | null | undefined
}
const peers = new Set<Peer>()
function userId(token: Peer['token']) {
  if (!token) return null
  const db = read()
  const session = db.sessions[token]
  return session && session.expiresAt > Date.now() && db.scenario !== 'expired-session'
    ? session.userId
    : null
}
export function registerPeer(client: Peer['client'], raw: Peer['raw']) {
  const peer: Peer = { client, raw, token: undefined }
  peers.add(peer)
  const heartbeat = window.setInterval(() => raw.send('2'), 15000)
  raw.addEventListener('close', () => {
    window.clearInterval(heartbeat)
    peers.delete(peer)
  })
  client.on('session.subscribe', (_message, payload: { token: string | null }) => {
    peer.token = payload.token
    client.emit('session.ready', { userId: userId(peer.token) })
    if (peer.token && !userId(peer.token)) client.emit('session.expired')
  })
  if (read().realtimeOffline) queueMicrotask(() => raw.close(1012, 'Cenário de desconexão'))
}
export function emitNft(nft: CatalogNft, event?: NftUpdated) {
  const payload = event ?? {
    eventId: crypto.randomUUID(),
    resourceId: nft.id,
    version: nft.version,
    nft: structuredClone(nft),
  }
  for (const peer of peers)
    if (peer.token !== undefined && !read().realtimeOffline)
      peer.client.emit('nft.updated', payload)
  return payload
}
export function emitOrder(order: Order, event?: OrderUpdated) {
  const payload = event ?? {
    eventId: crypto.randomUUID(),
    resourceId: order.id,
    userId: order.userId,
    version: order.version,
    order: structuredClone(order),
  }
  for (const peer of peers)
    if (userId(peer.token) === order.userId && !read().realtimeOffline)
      peer.client.emit('order.updated', payload)
  return payload
}
export function disconnectPeers() {
  for (const peer of peers) peer.raw.close(1012, 'Conexão interrompida na simulação')
}
export function expirePeers(token: string) {
  for (const peer of peers) if (peer.token === token) peer.client.emit('session.expired')
}
