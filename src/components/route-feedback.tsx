import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground">Confira o endereço ou volte ao início.</p>
      <Button asChild><Link to="/">Voltar ao início</Link></Button>
    </section>
  )
}

export function RouteErrorPage({ reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <section role="alert" className="space-y-5">
      <h1 className="text-2xl font-bold">Não foi possível abrir esta página</h1>
      <p className="text-muted-foreground">Tente novamente para retomar a navegação.</p>
      <Button onClick={() => { void router.invalidate(); reset() }}>Tentar novamente</Button>
    </section>
  )
}
