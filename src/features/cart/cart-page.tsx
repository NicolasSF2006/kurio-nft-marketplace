import { Artwork } from '@/components/marketplace/artwork'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { PreviewData } from '@/components/marketplace/preview'
import { Footer } from '@/components/marketplace/footer'
import { Breadcrumb, MobilePageHeader } from '@/components/marketplace/header'
import { RelatedNfts } from '@/components/marketplace/related'
import { Quantity } from '@/components/marketplace/forms'
import { CouponInput, PriceSummary } from '@/components/marketplace/summary'
import { NetworkState, MutationFeedback } from '@/components/marketplace/feedback'
import { quoteOptions, useCart, useCartMutation, useIdentity } from '@/features/marketplace/api'
import type { MarketplacePreview, PreviewItem } from '@/types/marketplace'
import type { CartItem } from '@/types/api'

export function OrderItems({
  data,
  items,
  receipt = false,
}: {
  data: MarketplacePreview
  items: PreviewItem[]
  receipt?: boolean
}) {
  return (
    <div className={receipt ? 'order-items receipt-items' : 'order-items'}>
      {items.map((item, index) => {
        const nft = data.nfts.find((nft) => nft.id === item.nftId)
        return nft ? (
          <div className="order-item" key={`${nft.id}-${index}`}>
            <Artwork src={nft.image} alt={nft.name} width="70" height="70" />
            <div>
              <strong>{nft.name}</strong>
              <p>ID do token: {nft.token}</p>
            </div>
            <span className="item-editions">(x {item.quantity})</span>
            <strong className="item-total">{item.total} ETH</strong>
          </div>
        ) : null
      })}
    </div>
  )
}

function CartContent({ data }: { data: MarketplacePreview }) {
  const id = useIdentity()
  const cart = useCart()
  const quote = useQuery(quoteOptions(id, cart.data))
  const mutation = useCartMutation()
  const [code, setCode] = useState('')
  const change = (item: CartItem, quantity: number) =>
    mutation.mutate({ type: 'quantity', id: item.id, quantity })
  const total = (item: CartItem) =>
    quote.data?.items.find((line) => line.id === item.id)?.total ?? '—'
  return (
    <>
      <div className="cart-page page-container">
        <Breadcrumb current="Carrinho" />
        <MobilePageHeader title="Carrinho de NFTs" />
        <h1 className="sr-only desktop-only">Carrinho de NFTs</h1>
        <NetworkState pending={cart.isPending} error={cart.error} retry={cart.refetch} />
        {cart.data?.items.length === 0 && (
          <section className="empty-cart" role="status">
            <h2>Seu carrinho está vazio</h2>
            <Link to="/">Explorar NFTs</Link>
          </section>
        )}
        {!!cart.data?.items.length && (
          <div className="cart-main">
            <div className="cart-desktop-table">
              <div className="cart-table-heading">
                <span>NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
                <span className="sr-only">Remover</span>
              </div>
              {cart.data.items.map((item) => (
                <article
                  className="cart-table-row"
                  key={item.id}
                  aria-label={`${item.nft.name} ${item.edition}`}
                >
                  <Link to="/nfts/$nftId" params={{ nftId: item.nftId }} className="cart-nft">
                    <Artwork src={item.nft.image} alt={item.nft.name} width="70" height="70" />
                    <span>
                      <strong>{item.nft.name}</strong>
                      <small>Edição: {item.edition}</small>
                      {item.quantity > item.available && (
                        <small role="alert">Estoque insuficiente: {item.available}</small>
                      )}
                    </span>
                  </Link>
                  <span>{item.nft.price} ETH</span>
                  <Quantity
                    value={item.quantity}
                    max={item.available}
                    disabled={mutation.isPending}
                    onChange={(quantity) => change(item, quantity)}
                  />
                  <strong>{total(item)} ETH</strong>
                  <Button
                    variant="ghost"
                    disabled={mutation.isPending}
                    aria-label={`Remover ${item.nft.name} ${item.edition}`}
                    onClick={() => mutation.mutate({ type: 'remove', id: item.id })}
                  >
                    ×
                  </Button>
                </article>
              ))}
            </div>
            <div className="cart-mobile-items">
              {cart.data.items.map((item) => (
                <article
                  className="cart-mobile-item"
                  key={item.id}
                  aria-label={`${item.nft.name} ${item.edition}`}
                >
                  <Link to="/nfts/$nftId" params={{ nftId: item.nftId }}>
                    <Artwork src={item.nft.image} alt={item.nft.name} width="100" height="100" />
                  </Link>
                  <div>
                    <h2>{item.nft.name}</h2>
                    <p>Edição: {item.edition}</p>
                    <strong>{total(item)} ETH</strong>
                    {item.quantity > item.available && (
                      <p role="alert">Estoque insuficiente: {item.available}</p>
                    )}
                    <Button
                      variant="ghost"
                      disabled={mutation.isPending}
                      aria-label={`Remover ${item.nft.name} ${item.edition}`}
                      onClick={() => mutation.mutate({ type: 'remove', id: item.id })}
                    >
                      Remover
                    </Button>
                  </div>
                  <Quantity
                    value={item.quantity}
                    max={item.available}
                    disabled={mutation.isPending}
                    onChange={(quantity) => change(item, quantity)}
                  />
                </article>
              ))}
            </div>
            <aside className="cart-summary">
              <h2>Resumo da carteira</h2>
              <p className="coupon-label">Código promocional</p>
              <CouponInput
                value={code}
                onChange={setCode}
                onApply={() => mutation.mutate({ type: 'coupon', code })}
                pending={mutation.isPending}
              />
              {cart.data.coupon && (
                <div className="active-coupon">
                  <span>{cart.data.coupon}</span>
                  <Button
                    variant="ghost"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ type: 'coupon', code: null })}
                  >
                    Remover cupom
                  </Button>
                </div>
              )}
              <MutationFeedback
                error={mutation.error}
                success={mutation.isSuccess && 'Carrinho atualizado.'}
              />
              <NetworkState pending={quote.isPending} error={quote.error} retry={quote.refetch} />
              {quote.data && !quote.isError && <PriceSummary summary={quote.data} />}
              {quote.data && !quote.isError && !quote.isFetching && (
                <Button asChild className="checkout-link">
                  <Link to="/checkout">Conectar e finalizar</Link>
                </Button>
              )}
              <Link className="continue-shopping" to="/">
                Continuar explorando
              </Link>
            </aside>
          </div>
        )}
        {mutation.error && !cart.data?.items.length && <MutationFeedback error={mutation.error} />}
        <RelatedNfts data={data} title="Colecionadores também viram" />
        <p className="preview-disclaimer">
          Valores fornecidos pela cotação simulada. A compra só é confirmada após o resultado do
          pedido.
        </p>
      </div>
      <Footer />
    </>
  )
}

export function CartPage() {
  return <PreviewData layout="cart">{(data) => <CartContent data={data} />}</PreviewData>
}
