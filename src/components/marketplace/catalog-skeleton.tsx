import { Skeleton } from '@/components/ui/skeleton'

export function CatalogCardsSkeleton() {
  return Array.from({ length: 9 }, (_, index) => (
    <div className="catalog-placeholder" key={index} aria-hidden="true">
      <Skeleton className="nft-artwork" />
      <div className="nft-caption">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-3 h-4 w-1/2" />
      </div>
    </div>
  ))
}

export function CatalogLoading() {
  return (
    <div className="page-container loading-catalog" role="status" aria-label="Carregando conteúdo">
      <div className="mobile-search">
        <Skeleton className="h-full flex-1" />
        <Skeleton className="h-full w-11" />
      </div>
      <Skeleton className="catalog-loading-hero" />
      <div className="catalog-loading-section">
        <Skeleton className="catalog-sidebar h-[1100px] w-full" />
        <div>
          <Skeleton className="mb-6 h-7 w-full" />
          <div className="catalog-grid catalog-grid-desktop">
            <CatalogCardsSkeleton />
          </div>
          <div className="catalog-grid catalog-grid-mobile">
            <CatalogCardsSkeleton />
          </div>
        </div>
      </div>
      <span className="sr-only">Carregando conteúdo…</span>
    </div>
  )
}
