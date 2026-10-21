import { Artwork } from '@/components/marketplace/artwork'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { useIdentity } from '@/features/marketplace/api'
import { orderOptions, ordersOptions } from './queries'
import { NetworkState } from '@/components/marketplace/feedback'
import { PriceSummary } from '@/components/marketplace/summary'
import { Button } from '@/components/ui/button'
import { designAssets } from '@/lib/design-assets'
import { readAttempt, saveAttempt } from '@/lib/checkout-attempt'
import type { Order } from '@/types/orders'
import { usePreviewNotice } from '@/components/marketplace/preview-notice'

function OrderReceipt({ order }: { order: Order }) {
  const notify = usePreviewNotice()
  const confirmed = order.status === 'confirmed'
  useEffect(() => {
    if (order.status !== 'pending' && readAttempt(order.userId)?.key === order.idempotencyKey)
      saveAttempt(order.userId, null)
  }, [order])
  return (
    <div className="receipt-page">
      <section
        className="receipt-card"
        aria-labelledby="receipt-title"
        data-order-version={order.version}
      >
        <Link to="/orders" className="receipt-close" aria-label="Voltar aos pedidos">
          <Artwork src={designAssets.confirmation.imgX} alt="" />
        </Link>
        <div className="receipt-header">
          {confirmed && (
            <Artwork src={designAssets.confirmation.imgGroup} alt="Ilustração de agradecimento" />
          )}
          <h1 id="receipt-title">
            {confirmed
              ? 'Seus NFTs agora estão na sua carteira'
              : order.status === 'pending'
                ? 'Pedido pendente'
                : 'Pagamento recusado'}
          </h1>
        </div>
        <p className="order-state" role="status">
          {confirmed
            ? 'Pedido confirmado na simulação'
            : order.status === 'pending'
              ? 'Aguardando resultado. Você pode recarregar esta página com segurança.'
              : order.reason}
        </p>
        <dl className="receipt-meta">
          <div>
            <dt>Pedido</dt>
            <dd data-testid="order-id">{order.id}</dd>
          </div>
          <div>
            <dt>Data</dt>
            <dd>{new Date(order.createdAt).toLocaleString('pt-BR')}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{order.quote.total} ETH</dd>
          </div>
          <div>
            <dt>Carteira</dt>
            <dd>
              {order.wallet.name} · {order.wallet.network}
            </dd>
          </div>
        </dl>
        <div className="receipt-body">
          <h2>{confirmed ? 'Detalhes da transação' : 'Detalhes do pedido'}</h2>
          <div className="order-items receipt-items">
            {order.items.map((item) => (
              <div className="order-item" key={item.id}>
                <Artwork src={item.image} alt={item.name} width="70" height="70" />
                <div>
                  <strong>{item.name}</strong>
                  <p>Edição: {item.edition}</p>
                </div>
                <span className="item-editions">(x {item.quantity})</span>
                <strong className="item-total">{item.total} ETH</strong>
              </div>
            ))}
          </div>
          <PriceSummary summary={order.quote} />
          {confirmed && (
            <>
              <p className="simulated-transaction">Referência simulada: {order.transaction}</p>
              <p>
                Compra confirmada apenas na demonstração. Nenhum pagamento real ou transferência de
                blockchain foi realizado.
              </p>
              <Button
                type="button"
                title="Explorador simulado"
                onClick={() =>
                  notify(
                    `Explorador simulado. Referência: ${order.transaction}. Nenhuma transação blockchain real foi enviada.`,
                  )
                }
              >
                Ver no Etherscan (simulado)
              </Button>
            </>
          )}
          {order.status === 'refused' && (
            <Button asChild>
              <Link to="/cart">Revisar carrinho</Link>
            </Button>
          )}
          <div className="order-actions">
            <Link to="/orders">Meus pedidos</Link>
            <Link to="/">Continuar explorando</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
export function OrderPage() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  const id = useIdentity()
  const query = useQuery({
    ...orderOptions(id, orderId),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 5000 : false),
  })
  if (query.isError && isAxiosError(query.error) && query.error.response?.status === 404)
    return (
      <section className="page-container py-12">
        <h1>Pedido não encontrado</h1>
        <Link to="/orders">Meus pedidos</Link>
      </section>
    )
  if (!query.data || query.isError)
    return (
      <div className="page-container">
        <NetworkState pending={query.isPending} error={query.error} retry={query.refetch} />
      </div>
    )
  return <OrderReceipt order={query.data} />
}
export function OrdersPage() {
  const query = useQuery(ordersOptions(useIdentity()))
  return (
    <section className="page-container orders-page">
      <h1>Meus pedidos</h1>
      <NetworkState pending={query.isPending} error={query.error} retry={query.refetch} />
      {query.data?.length === 0 && <p>Nenhum pedido encontrado.</p>}
      {query.data?.map((order) => (
        <article className="order-list-item" key={order.id}>
          <Link to="/orders/$orderId" params={{ orderId: order.id }}>
            Pedido {order.id}
          </Link>
          <span>
            {order.status === 'confirmed'
              ? 'Confirmado'
              : order.status === 'refused'
                ? 'Recusado'
                : 'Pendente'}
          </span>
          <strong>{order.quote.total} ETH</strong>
        </article>
      ))}
      <Link to="/cart">Voltar ao carrinho</Link>
    </section>
  )
}
