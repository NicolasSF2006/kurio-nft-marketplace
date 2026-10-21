import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { systemHealthOptions } from '@/features/system/queries'
import { useRealtimeStatus } from '@/features/system/use-realtime-status'
import { MockControls } from './mock-controls'

export function SystemStatus() {
  const health = useQuery(systemHealthOptions)
  const realtime = useRealtimeStatus()
  const realtimeMessages = {
    connecting: 'Conectando ao transporte Socket.IO…',
    ready: 'Socket.IO: evento de diagnóstico recebido.',
    disconnected: 'Socket.IO: desconectado; aguardando reconexão.',
    error: 'Socket.IO: conexão indisponível.',
  }

  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Verificação da infraestrutura</h1>
      <div className="space-y-4 rounded-lg border bg-muted p-6">
        <div aria-live="polite" aria-busy={health.isPending}>
          {health.isPending && (
            <>
              <p>Consultando API…</p>
              <Skeleton className="mt-3 h-6 w-48" />
            </>
          )}
          {health.isError && <p role="alert">Não foi possível consultar a API. Tente novamente.</p>}
          {health.isSuccess && (
            <p>
              API {health.data.service}: {health.data.status}
            </p>
          )}
        </div>
        <p role="status">{realtimeMessages[realtime]}</p>
        <Button
          variant="outline"
          disabled={health.isFetching}
          onClick={() => {
            void health.refetch()
          }}
        >
          {health.isFetching ? 'Consultando…' : 'Consultar novamente'}
        </Button>
      </div>
      <MockControls />
    </section>
  )
}
