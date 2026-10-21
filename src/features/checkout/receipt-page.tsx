import { Artwork } from '@/components/marketplace/artwork'
import { Link } from '@tanstack/react-router'
import { PreviewData } from '@/components/marketplace/preview'
import { OrderItems } from '@/features/cart/cart-page'
import { PendingButton } from '@/components/marketplace/actions'
import { designAssets } from '@/lib/design-assets'
export function ReceiptPage() {
  return (
    <PreviewData layout="cart">
      {(data) => (
        <div className="receipt-page">
          <section className="receipt-card" aria-labelledby="receipt-title">
            <Link to="/checkout" className="receipt-close" aria-label="Fechar prévia do recibo">
              <Artwork src={designAssets.confirmation.imgX} alt="" />
            </Link>
            <div className="receipt-header">
              <Artwork src={designAssets.confirmation.imgGroup} alt="Ilustração de agradecimento" />
              <h1 id="receipt-title">Prévia visual do recibo</h1>
            </div>
            <p id="preview-notice" className="receipt-preview-label">
              PRÉVIA DO DESIGN · NENHUM PEDIDO REALIZADO
            </p>
            <dl className="receipt-meta">
              <div>
                <dt>ID da transação</dt>
                <dd>{data.receipt.transaction}</dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>{data.receipt.date}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{data.desktopCart.summary.total} ETH</dd>
              </div>
              <div>
                <dt>Carteira</dt>
                <dd>{data.receipt.wallet}</dd>
              </div>
            </dl>
            <div className="receipt-body">
              <h2>Detalhes da transação</h2>
              <div className="receipt-table-heading">
                <span>NFTs</span>
                <span>Edições</span>
                <span>Subtotal</span>
              </div>
              <OrderItems data={data} items={data.desktopCart.items} receipt />
              <dl className="receipt-totals">
                <div>
                  <dt>Taxa de rede</dt>
                  <dd>{data.desktopCart.summary.fee} ETH</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{data.desktopCart.summary.total} ETH</dd>
                </div>
              </dl>
              <p>
                Modelo visual da confirmação na Ethereum. Nenhuma transação foi enviada, nenhum NFT
                foi transferido e estes valores são apenas de referência.
              </p>
              <PendingButton action="Explorar transação de demonstração">
                Ver no Etherscan
              </PendingButton>
            </div>
          </section>
        </div>
      )}
    </PreviewData>
  )
}
