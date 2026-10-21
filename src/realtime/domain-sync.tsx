import { useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { createRealtimeClient } from './client'
import { useIdentity } from '@/features/marketplace/api'
import { sessionOptions } from '@/features/auth/session'
import { getToken } from '@/lib/session-storage'
import type { CatalogNft, CatalogResponse } from '@/types/api'
import type { NftUpdated, Order, OrderUpdated } from '@/types/orders'

export function DomainSync() {
  const path = useLocation({ select: (location) => location.pathname })
  const id = useIdentity()
  const client = useQueryClient()
  const token = getToken()
  const [status, setStatus] = useState('Conectando ao tempo real…')
  const [notice, setNotice] = useState('')
  const [stats, setStats] = useState({ nft: 0, order: 0, ignored: 0, reconciled: 0 })
  const [epoch, setEpoch] = useState(0)
  useEffect(() => {
    const reset = () => setEpoch((value) => value + 1)
    window.addEventListener('kurio:mock-reset', reset)
    return () => window.removeEventListener('kurio:mock-reset', reset)
  }, [])
  useEffect(() => {
    let active = true
    const socket = createRealtimeClient()
    const versions = new Map<string, number>()
    const owns = () =>
      active &&
      (client.getQueryData(sessionOptions.queryKey)?.user.id ?? 'guest') === id &&
      getToken() === token
    const reconcile = async () => {
      if (!owns()) return
      setStatus('Tempo real conectado')
      setStats((current) => ({ ...current, reconciled: current.reconciled + 1 }))
      await client.cancelQueries({
        predicate: (query) =>
          ['catalog', 'nft', 'cart', 'quote'].includes(String(query.queryKey[0])) ||
          (query.queryKey[0] === 'private' &&
            query.queryKey[1] === id &&
            ['order', 'orders'].includes(String(query.queryKey[2]))),
      })
      if (!owns()) return
      await client.invalidateQueries({
        predicate: (query) =>
          ['catalog', 'nft', 'cart', 'quote'].includes(String(query.queryKey[0])) ||
          (query.queryKey[0] === 'private' &&
            query.queryKey[1] === id &&
            ['order', 'orders'].includes(String(query.queryKey[2]))),
      })
    }
    const nftUpdated = async (event: NftUpdated) => {
      if (!owns() || event.resourceId !== event.nft.id || event.version !== event.nft.version)
        return
      setStats((current) => ({ ...current, nft: current.nft + 1 }))
      const cached = client.getQueryData<CatalogNft>(['nft', event.resourceId])?.version ?? 0
      const catalogVersion = Math.max(
        0,
        ...client
          .getQueriesData<CatalogResponse>({ queryKey: ['catalog'] })
          .flatMap(
            ([, data]) =>
              data?.items
                .filter((item) => item.id === event.resourceId)
                .map((item) => item.version) ?? [],
          ),
      )
      const key = `nft:${event.resourceId}`
      if (event.version <= Math.max(versions.get(key) ?? 0, cached, catalogVersion)) {
        setStats((current) => ({ ...current, ignored: current.ignored + 1 }))
        return
      }
      versions.set(key, event.version)
      await client.cancelQueries({
        predicate: (query) =>
          ['catalog', 'nft', 'cart', 'quote'].includes(String(query.queryKey[0])),
      })
      if (!owns() || event.version !== (versions.get(key) ?? 0)) return
      client.setQueryData(['nft', event.resourceId], event.nft)
      setNotice(
        'Preço, disponibilidade ou condições de cotação atualizados. Revise os valores antes de comprar.',
      )
      await client.invalidateQueries({
        predicate: (query) => ['catalog', 'cart', 'quote'].includes(String(query.queryKey[0])),
      })
    }
    const orderUpdated = async (event: OrderUpdated) => {
      if (
        !owns() ||
        event.userId !== id ||
        event.order.userId !== id ||
        event.resourceId !== event.order.id ||
        event.version !== event.order.version
      )
        return
      setStats((current) => ({ ...current, order: current.order + 1 }))
      const queryKey = ['private', id, 'order', event.resourceId]
      const previous = client.getQueryData<Order>(queryKey)
      const key = `order:${event.resourceId}`
      if (
        event.version <= Math.max(previous?.version ?? 0, versions.get(key) ?? 0) ||
        (previous?.status !== 'pending' &&
          previous?.status !== undefined &&
          event.order.status !== previous.status)
      ) {
        setStats((current) => ({ ...current, ignored: current.ignored + 1 }))
        return
      }
      versions.set(key, event.version)
      await client.cancelQueries({ queryKey })
      if (!owns() || event.version !== (versions.get(key) ?? 0)) return
      client.setQueryData(queryKey, event.order)
      await client.invalidateQueries({ queryKey: ['private', id, 'orders'] })
      if (event.order.status !== 'pending') {
        await client.invalidateQueries({ queryKey: ['cart', id] })
        await client.invalidateQueries({ queryKey: ['quote', id] })
      }
    }
    let firstConnection = true
    const connected = () => {
      if (firstConnection && owns()) {
        setStats({ nft: 0, order: 0, ignored: 0, reconciled: 0 })
        setNotice('')
        firstConnection = false
      }
      socket.emit('session.subscribe', { token })
    }
    const disconnected = () => {
      if (owns()) setStatus('Tempo real desconectado. Reconectando…')
    }
    const expired = () => {
      if (owns()) void client.invalidateQueries({ queryKey: sessionOptions.queryKey })
    }
    socket.on('connect', connected)
    socket.on('session.ready', (payload) => {
      if (payload.userId === (id === 'guest' ? null : id)) void reconcile()
    })
    socket.on('nft.updated', nftUpdated)
    socket.on('order.updated', orderUpdated)
    socket.on('disconnect', disconnected)
    socket.on('connect_error', disconnected)
    socket.on('session.expired', expired)
    socket.connect()
    return () => {
      active = false
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [id, token, client, epoch])
  return (
    <div className="domain-feedback">
      <p
        className="realtime-status"
        aria-live="polite"
        data-nft-events={stats.nft}
        data-order-events={stats.order}
        data-ignored-events={stats.ignored}
        data-reconciliations={stats.reconciled}
      >
        {status}
      </p>
      {notice && !path.startsWith('/orders') && path !== '/order-preview' && (
        <div className="realtime-notice" role="status">
          {notice}
          <button
            type="button"
            aria-label="Fechar aviso de atualização"
            onClick={() => setNotice('')}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
