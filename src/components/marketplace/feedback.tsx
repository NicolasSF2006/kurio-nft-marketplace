import { errorMessage } from '@/lib/api-error'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function MutationFeedback({
  error,
  success,
}: {
  error?: unknown
  success?: string | false
}) {
  if (error)
    return (
      <p className="form-feedback" role="alert">
        {errorMessage(error)}
      </p>
    )
  if (success)
    return (
      <p className="form-feedback" role="status">
        {success}
      </p>
    )
  return null
}
export function NetworkState({
  pending,
  error,
  retry,
}: {
  pending: boolean
  error: unknown
  retry: () => unknown
}) {
  if (pending)
    return (
      <div role="status" aria-label="Carregando dados" className="network-loading">
        <Skeleton className="h-32 w-full" />
        <span className="sr-only">Carregando dados…</span>
      </div>
    )
  if (error)
    return (
      <div role="alert" className="network-error">
        <p>{errorMessage(error)}</p>
        <Button onClick={() => void retry()}>Tentar novamente</Button>
      </div>
    )
  return null
}
