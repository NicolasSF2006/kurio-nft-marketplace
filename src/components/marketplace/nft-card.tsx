import { Artwork } from '@/components/marketplace/artwork'
import { Link } from '@tanstack/react-router'
import type { Nft } from '@/types/marketplace'
import { FavoriteButton } from './favorite-button'

export function NftCard({
  nft,
  hideCaption = false,
  badge = false,
  favorite = false,
}: {
  nft: Nft
  hideCaption?: boolean
  badge?: boolean
  favorite?: boolean
}) {
  return (
    <article className="nft-card">
      <div className="nft-artwork">
        <Link to="/nfts/$nftId" params={{ nftId: nft.id }} aria-label={`Ver ${nft.name}`}>
          <Artwork src={nft.image} alt={nft.name} width="512" height="512" loading="lazy" />
        </Link>
        {badge && <span className="rarity-badge">RARO</span>}
        {favorite && (
          <FavoriteButton nftId={nft.id} name={nft.name} className="card-favorite" compact />
        )}
      </div>
      <div className={hideCaption ? 'nft-caption desktop-caption-hidden' : 'nft-caption'}>
        <Link to="/nfts/$nftId" params={{ nftId: nft.id }}>
          {nft.name}
        </Link>
        <p>
          <strong>{nft.price} ETH</strong>
          {nft.previousPrice && <del>{nft.previousPrice} ETH</del>}
        </p>
      </div>
    </article>
  )
}
