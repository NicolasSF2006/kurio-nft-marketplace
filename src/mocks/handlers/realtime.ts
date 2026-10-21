import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { env } from '@/app/env'
import { realtimeReady } from '@/mocks/fixtures/system'
import { registerPeer } from '@/mocks/events'

// MSW normalizes the Socket.IO transport path to the default namespace (/).
const socketUrl = new URL('/', env.socketUrl)
socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:'
const realtime = ws.link(socketUrl.href)

export const realtimeHandlers = [
  realtime.addEventListener('connection', (connection) => {
    const { client } = toSocketIo(connection)
    registerPeer(client, connection.client)
    queueMicrotask(() => client.emit('system.ready', realtimeReady))
  }),
]
