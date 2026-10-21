import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { marketplacePreviewOptions } from '@/features/marketplace/queries'
import type { MarketplacePreview } from '@/types/marketplace'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CatalogLoading } from './catalog-skeleton'

export function PreviewData({
  children,
  layout = 'catalog',
}: {
  children: (data: MarketplacePreview) => ReactNode
  layout?: 'catalog' | 'detail' | 'cart'
}) {
  const query = useQuery(marketplacePreviewOptions)
  if (query.isPending && layout === 'catalog') return <CatalogLoading />
  if (query.isPending)
    return (
      <div
        className={`page-container loading-${layout}`}
        role="status"
        aria-label="Carregando conteúdo"
      >
        <Skeleton className="mb-8 h-12 w-64 max-w-full" />
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          {Array.from({ length: layout === 'catalog' ? 6 : 3 }, (_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
        <span className="sr-only">Carregando conteúdo…</span>
      </div>
    )
  if (query.isError)
    return (
      <section className="page-container py-16" role="alert">
        <h1 className="mb-5 text-2xl font-bold">Não foi possível carregar o conteúdo</h1>
        <p className="mb-5 text-muted-foreground">Verifique a conexão e tente novamente.</p>
        <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
      </section>
    )
  return children(query.data)
}
