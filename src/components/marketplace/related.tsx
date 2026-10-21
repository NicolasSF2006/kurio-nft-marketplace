import type { MarketplacePreview } from '@/types/marketplace'
import { NftCard } from '@/components/marketplace/nft-card'
import { designAssets } from '@/lib/design-assets'

export function RelatedNfts({
  data,
  title = 'Mais desta coleção',
}: {
  data: MarketplacePreview
  title?: string
}) {
  return (
    <section className="related-section">
      <h2>{title}</h2>
      <div className="related-grid">
        {data.relatedIds.map((id) => {
          const nft = data.nfts.find((item) => item.id === id)
          return nft ? <NftCard key={id} nft={nft} /> : null
        })}
      </div>
      <img
        className="carousel-dots"
        src={designAssets.cart.imgCarouselDots}
        alt="Página 2 de 3 da coleção de demonstração"
      />
    </section>
  )
}
