import { useEffect, useState } from 'react'
import { createRealtimeClient } from '@/realtime/client'

export function useRealtimeStatus() {
  const [status, setStatus] = useState<'connecting' | 'ready' | 'disconnected' | 'error'>('connecting')

  useEffect(() => {
    const client = createRealtimeClient()
    client.on('system.ready', () => setStatus('ready'))
    client.on('disconnect', () => setStatus('disconnected'))
    client.on('connect_error', () => setStatus('error'))
    client.connect()

    return () => {
      client.removeAllListeners()
      client.disconnect()
    }
  }, [])

  return status
}
