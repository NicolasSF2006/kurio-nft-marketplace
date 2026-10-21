import { Artwork } from '@/components/marketplace/artwork'
import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Dialog } from 'radix-ui'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { nftOptions, useCartMutation } from '@/features/marketplace/api'
import { FavoriteButton } from '@/components/marketplace/favorite-button'
import { Button } from '@/components/ui/button'
import { NetworkState, MutationFeedback } from '@/components/marketplace/feedback'
import type { CatalogNft } from '@/types/api'
import { PreviewData } from '@/components/marketplace/preview'
import { Breadcrumb } from '@/components/marketplace/header'
import { Footer } from '@/components/marketplace/footer'
import { RelatedNfts } from '@/components/marketplace/related'
import { PendingButton, PreviewDisclaimer } from '@/components/marketplace/actions'
import { Quantity } from '@/components/marketplace/forms'
import { Icon } from '@/components/marketplace/icon'
import { designAssets } from '@/lib/design-assets'
import type { MarketplacePreview, Nft } from '@/types/marketplace'

function Gallery({ nft }: { nft: Nft }) {
  const [selected, setSelected] = useState(1)
  return (
    <div className="nft-gallery">
      <div className="gallery-thumbnails">
        {[0, 1, 2, 3].map((index) => (
          <button
            key={index}
            type="button"
            aria-label={`Imagem ${index + 1} de ${nft.name}`}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            <Artwork
              src={nft.image}
              alt={`${nft.name}, miniatura ${index + 1}`}
              width="100"
              height="100"
              sizes="100px"
            />
          </button>
        ))}
      </div>
      <div className="gallery-main">
        <Artwork
          src={nft.image}
          alt={nft.name}
          width="404"
          height="404"
          sizes="(min-width: 1024px) 404px, (min-width: 600px) 500px, 90vw"
          fetchPriority="high"
        />
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button className="gallery-zoom" type="button" aria-label="Ampliar imagem">
              <Icon src={designAssets.detail.imgFrame238} />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content className="gallery-dialog">
              <Dialog.Title className="sr-only">{nft.name}</Dialog.Title>
              <Dialog.Description className="sr-only">
                Imagem original ampliada do NFT
              </Dialog.Description>
              <Artwork src={nft.image} alt={nft.name} sizes="90vw" />
              <Dialog.Close className="dialog-close" aria-label="Fechar imagem ampliada">
                ×
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  )
}

function DetailContent({ data, nft }: { data: MarketplacePreview; nft: CatalogNft }) {
  const [edition, setEdition] = useState('1/50')
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState('details')
  const cart = useCartMutation()
  const stock = nft.editions.find((item) => item.id === edition)?.stock ?? 0
  const buy = () => cart.mutate({ type: 'add', input: { nftId: nft.id, edition, quantity } })
  return (
    <>
      <div className="detail-page page-container">
        <Breadcrumb />
        <div className="detail-mobile-actions">
          <Link to="/" aria-label="Voltar ao catálogo">
            <Icon src={designAssets['mobile-detail'].imgArrowLeft2} />
          </Link>
          <FavoriteButton nftId={nft.id} name={nft.name} compact />
        </div>
        <div className="detail-product">
          <Gallery nft={nft} />
          <section className="detail-info">
            <div className="detail-title">
              <h1>{nft.name}</h1>
              <span className="mobile-rating">
                {nft.rating ? `★${nft.rating}` : '—'}
                <span>({nft.reviewCount ?? '—'})</span>
              </span>
            </div>
            <div className="detail-price-rating">
              <strong>{nft.price} ETH</strong>
              <span>
                <span
                  className="stars"
                  role="img"
                  aria-label={`${nft.rating ?? 'Sem nota'} de 5 estrelas`}
                >
                  {nft.rating &&
                    [0, 1, 2, 3, 4].map((i) => (
                      <Icon
                        key={i}
                        src={i === 4 ? designAssets.detail.imgStar1 : designAssets.detail.imgStar}
                      />
                    ))}
                </span>
                {nft.reviewCount ?? 'Sem'} avaliações de colecionadores
              </span>
            </div>
            <div className="detail-description">
              <h2>Sobre este NFT:</h2>
              <p className="desktop-detail-description">{nft.description}</p>
              <p className="mobile-detail-description">
                {nft.mobileDescription ?? nft.description}
              </p>
            </div>
            <fieldset className="edition-picker">
              <legend>Edição:</legend>
              {['1/1', '1/10', '1/50', 'ABERTA'].map((value, i) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={edition === value}
                  data-unavailable={!nft.editions.find((item) => item.id === value)?.stock}
                  title={
                    !nft.editions.find((item) => item.id === value)?.stock
                      ? 'Edição indisponível'
                      : undefined
                  }
                  onClick={() => {
                    setEdition(value)
                    setQuantity(1)
                    cart.reset()
                  }}
                >
                  <Artwork
                    src={
                      [
                        designAssets.detail.imgEllipse24,
                        designAssets.detail.imgEllipse25,
                        designAssets.detail.imgEllipse26,
                        designAssets.detail.imgEllipse27,
                      ][i]
                    }
                    alt=""
                  />
                  <span>{value}</span>
                </button>
              ))}
            </fieldset>
            <p className="edition-stock" role="status">
              {stock ? `${stock} edições disponíveis` : 'Edição indisponível'}
            </p>
            <div className="desktop-buy-row">
              <Quantity
                value={quantity}
                onChange={setQuantity}
                max={stock}
                disabled={!stock || cart.isPending}
              />
              <div>
                <Button onClick={buy} disabled={!stock || cart.isPending}>
                  COMPRAR
                </Button>
                <FavoriteButton nftId={nft.id} name={nft.name} />
              </div>
            </div>
            <MutationFeedback
              error={cart.error}
              success={cart.isSuccess && 'NFT adicionado ao carrinho.'}
            />
            <div className="token-info">
              <p>ID do token: {nft.token}</p>
              <p>Coleção: {nft.collection ?? 'Não informada nesta prévia'}</p>
              <p>Atributos: {nft.attributes?.join(', ') ?? 'Não informados nesta prévia'}</p>
            </div>
            <div className="share-nft">
              Compartilhar este NFT:{' '}
              <PendingButton action="Compartilhar NFT" variant="ghost" size="sm">
                in ✉ ♥
              </PendingButton>
            </div>
          </section>
        </div>
        <section className="nft-description-section">
          <div className="detail-tabs" role="group" aria-label="Informações sobre o NFT">
            <button
              type="button"
              className={tab === 'details' ? 'selected' : ''}
              aria-pressed={tab === 'details'}
              onClick={() => setTab('details')}
            >
              Detalhes do NFT
            </button>
            <button
              type="button"
              className={tab === 'reviews' ? 'selected' : ''}
              aria-pressed={tab === 'reviews'}
              onClick={() => setTab('reviews')}
            >
              Avaliações de colecionadores ({nft.reviewCount ?? 'pendente'})
            </button>
          </div>
          {tab === 'details' ? (
            <div>
              <p>{nft.details?.description ?? nft.description}</p>
              <p>
                A propriedade inclui a arte em alta resolução, lançamentos exclusivos para
                colecionadores e um registro permanente de procedência registrada na rede. Nova Sato
                recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e
                lançamentos da comunidade.
              </p>
              <h3>Rede:</h3>
              <p>{nft.details?.provenance ?? nft.network}</p>
              <h3>Contrato:</h3>
              <p>{nft.details?.contract ?? 'Não informado na simulação.'}</p>
              <h3>Direitos autorais:</h3>
              <p>{nft.details?.royalties ?? 'Não informado na simulação.'}</p>
            </div>
          ) : (
            <p className="py-6">Avaliações ainda não estão disponíveis nesta prévia.</p>
          )}
        </section>
        <RelatedNfts data={data} />
        <PreviewDisclaimer>
          Adicionar ao carrinho não efetua uma compra. Revise a cotação e finalize no pagamento
          simulado.
        </PreviewDisclaimer>
      </div>
      <Footer />
      <div className="mobile-buy-bar">
        <div>
          <span>Qtd.</span>
          <Quantity
            value={quantity}
            onChange={setQuantity}
            max={stock}
            disabled={!stock || cart.isPending}
          />
          <strong>{nft.price} ETH</strong>
        </div>
        <div>
          <Button onClick={buy} disabled={!stock || cart.isPending}>
            Comprar NFT
          </Button>
          <Link to="/cart" aria-label="Ver carrinho">
            <Icon src={designAssets['mobile-detail'].imgShop} />
          </Link>
        </div>
      </div>
    </>
  )
}

export function NftPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const query = useQuery(nftOptions(nftId))
  if (query.isPending)
    return (
      <div className="page-container">
        <NetworkState pending error={null} retry={query.refetch} />
      </div>
    )
  if (query.isError)
    return (
      <section className="page-container py-16">
        {isAxiosError(query.error) && query.error.response?.status === 404 ? (
          <>
            <h1>NFT não encontrado</h1>
            <Link to="/">Voltar ao catálogo</Link>
          </>
        ) : (
          <NetworkState pending={false} error={query.error} retry={query.refetch} />
        )}
      </section>
    )
  return (
    <PreviewData layout="detail">
      {(data) => {
        const nft = query.data
        return nft ? (
          <DetailContent data={data} nft={nft} />
        ) : (
          <section className="page-container py-16">
            <h1>NFT não encontrado</h1>
            <Link to="/">Voltar ao catálogo</Link>
          </section>
        )
      }}
    </PreviewData>
  )
}
