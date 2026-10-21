import type { PreviewSummary } from '@/types/marketplace'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function CouponInput({
  value,
  onChange,
  onApply,
  pending,
}: {
  value: string
  onChange: (value: string) => void
  onApply: () => void
  pending: boolean
}) {
  return (
    <form
      className="coupon-input"
      onSubmit={(event) => {
        event.preventDefault()
        onApply()
      }}
    >
      <label className="sr-only" htmlFor="coupon-code">
        Código promocional
      </label>
      <Input
        id="coupon-code"
        placeholder="Digite o código promocional..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
      <Button type="submit" disabled={pending}>
        Aplicar
      </Button>
    </form>
  )
}

export function PriceSummary({ summary }: { summary: PreviewSummary }) {
  return (
    <dl className="price-summary">
      <div>
        <dt>Subtotal</dt>
        <dd>{summary.subtotal} ETH</dd>
      </div>
      <div>
        <dt>Desconto do lançamento</dt>
        <dd>(-) {summary.discount} ETH</dd>
      </div>
      <div>
        <dt>Taxa de rede</dt>
        <dd>{summary.fee} ETH</dd>
      </div>
      <div className="estimated-fee">
        <dt className="sr-only">Observação da taxa</dt>
        <dd>Taxa estimada</dd>
      </div>
      <div className="summary-total">
        <dt>Total</dt>
        <dd>{summary.total} ETH</dd>
      </div>
    </dl>
  )
}
