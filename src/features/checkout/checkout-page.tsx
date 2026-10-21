import { useEffect, useRef, useState } from 'react'
import { Artwork } from '@/components/marketplace/artwork'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionOptions } from '@/features/auth/session'
import { isAxiosError } from 'axios'
import {
  cartOptions,
  quoteOptions,
  profileOptions,
  useIdentity,
  walletsOptions,
} from '@/features/marketplace/api'
import { ordersOptions } from './queries'
import { CollectorFields } from './collector-fields'
import { NetworkState, MutationFeedback } from '@/components/marketplace/feedback'
import { Footer } from '@/components/marketplace/footer'
import { Breadcrumb, MobilePageHeader } from '@/components/marketplace/header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SelectField } from '@/components/marketplace/forms'
import { PriceSummary } from '@/components/marketplace/summary'
import { api } from '@/lib/api'
import { fieldErrors } from '@/lib/api-error'
import { readAttempt, saveAttempt } from '@/lib/checkout-attempt'
import type { ApiError, Cart, Network, Profile, Quote, Wallet } from '@/types/api'
import type { CheckoutAttempt, Collector, Order, WalletConnection } from '@/types/orders'

function Recovery({
  userId,
  attempt,
  onClear,
}: {
  userId: string
  attempt: CheckoutAttempt
  onClear: () => void
}) {
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['private', userId, 'recovery', attempt.key],
    retry: false,
    queryFn: async ({ signal }) =>
      (await api.get<Order>(`/orders/by-key/${encodeURIComponent(attempt.key)}`, { signal })).data,
  })
  const replay = useMutation({
    mutationFn: async () =>
      (
        await api.post<Order>('/orders', attempt.input, {
          headers: { 'Idempotency-Key': attempt.key },
          timeout: 1000,
        })
      ).data,
    onSuccess: async (order) => {
      await navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    },
  })
  useEffect(() => {
    if (query.data)
      void navigate({ to: '/orders/$orderId', params: { orderId: query.data.id }, replace: true })
  }, [query.data, navigate])
  const missing = isAxiosError(query.error) && query.error.response?.status === 404
  const safeToDiscard =
    isAxiosError<ApiError>(replay.error) &&
    [
      'QUOTE_STALE',
      'WALLET_DISCONNECTED',
      'WALLET_CHANGED',
      'VALIDATION',
      'CART_EMPTY',
      'EDITION_UNAVAILABLE',
    ].includes(replay.error.response?.data.code ?? '')
  return (
    <section className="page-container py-12 recovery-panel">
      <h1>Recuperando tentativa de compra</h1>
      <p>
        A consulta e o reenvio usam a mesma chave. Nenhuma nova tentativa é criada automaticamente.
      </p>
      <code>{attempt.key}</code>
      <NetworkState pending={query.isPending} error={query.error} retry={query.refetch} />
      <MutationFeedback error={replay.error} />
      <Button onClick={() => void query.refetch()} disabled={query.isFetching || replay.isPending}>
        Consultar tentativa
      </Button>
      {missing && (
        <Button onClick={() => replay.mutate()} disabled={replay.isPending}>
          Reenviar mesma tentativa
        </Button>
      )}
      {missing && safeToDiscard && (
        <Button variant="outline" onClick={onClear}>
          Revisar checkout
        </Button>
      )}
    </section>
  )
}

function CheckoutContent({
  userId,
  cart,
  quote,
  wallets,
  profile,
  refreshing,
}: {
  userId: string
  cart: Cart
  quote: Quote
  wallets: Wallet[]
  profile: Profile
  refreshing: boolean
}) {
  const navigate = useNavigate()
  const client = useQueryClient()
  const [selected, setSelected] = useState(wallets[0]?.id ?? '')
  const wallet = wallets.find((wallet) => wallet.id === selected)
  const [network, setNetwork] = useState<Network>(wallet?.network ?? 'Ethereum')
  const [collector, setCollector] = useState<Collector>({
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ens: profile.ens,
    notes: '',
  })
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [accepted, setAccepted] = useState(quote.revision)
  const [forceReview, setForceReview] = useState(false)
  const [attempt, setAttempt] = useState(() => readAttempt(userId))
  const submitting = useRef(false)
  const [submitError, setSubmitError] = useState<unknown>(null)
  const [creating, setCreating] = useState(false)
  const [expiredQuote, setExpiredQuote] = useState<string | null>(null)
  const expired = expiredQuote === quote.id
  const orders = useQuery(ordersOptions(userId))
  const pending = orders.data?.find((order) => order.status === 'pending')
  useEffect(() => {
    const timer = window.setTimeout(
      () => setExpiredQuote(quote.id),
      Math.max(0, quote.expiresAt - Date.now()),
    )
    return () => window.clearTimeout(timer)
  }, [quote.id, quote.expiresAt])
  const createOrder = useMutation({
    mutationKey: ['private', userId, 'create-order'],
    mutationFn: async (next: CheckoutAttempt) =>
      (
        await api.post<Order>('/orders', next.input, {
          headers: { 'Idempotency-Key': next.key },
          timeout: 1000,
        })
      ).data,
  })
  const connect = useMutation({
    mutationFn: async () =>
      (await api.post<WalletConnection>('/wallet-connections', { walletId: selected, network }))
        .data,
    onSuccess: setConnection,
  })
  const disconnect = useMutation({
    mutationFn: async () => {
      if (connection) await api.delete(`/wallet-connections/${connection.id}`)
    },
    onSuccess: () => setConnection(null),
  })
  const reviewRequired = accepted !== quote.revision || forceReview || expired
  const connected =
    connection?.status === 'connected' &&
    connection.walletId === selected &&
    connection.network === network
  const errors = fieldErrors(submitError)
  async function submit() {
    if (submitting.current || !connected || reviewRequired || pending || refreshing) return
    submitting.current = true
    setCreating(true)
    setSubmitError(null)
    const next: CheckoutAttempt = {
      key: crypto.randomUUID(),
      input: { quoteId: quote.id, connectionId: connection!.id, collector },
    }
    saveAttempt(userId, next)
    try {
      const order = await createOrder.mutateAsync(next)
      if (client.getQueryData(sessionOptions.queryKey)?.user.id !== userId) return
      await navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    } catch (error) {
      setSubmitError(error)
      const code = isAxiosError<ApiError>(error) ? error.response?.data.code : undefined
      // These errors prove no order was committed. Network/timeouts remain recoverable.
      if (
        [
          'QUOTE_STALE',
          'WALLET_DISCONNECTED',
          'WALLET_CHANGED',
          'VALIDATION',
          'CART_EMPTY',
          'EDITION_UNAVAILABLE',
        ].includes(code ?? '')
      ) {
        saveAttempt(userId, null)
        if (code === 'WALLET_DISCONNECTED' || code === 'WALLET_CHANGED') setConnection(null)
        if (code === 'QUOTE_STALE') {
          setForceReview(true)
          await client.invalidateQueries({ queryKey: ['quote', userId] })
        }
      } else setAttempt(next)
    } finally {
      submitting.current = false
      setCreating(false)
    }
  }
  if (attempt)
    return (
      <Recovery
        userId={userId}
        attempt={attempt}
        onClear={() => {
          saveAttempt(userId, null)
          setAttempt(null)
          setForceReview(true)
        }}
      />
    )
  const fields = (
    <CollectorFields
      collector={collector}
      onChange={setCollector}
      wallet={wallet}
      network={network}
      onNetwork={(value) => {
        setNetwork(value)
        setConnection(null)
        connect.reset()
      }}
      errors={{ ...fieldErrors(connect.error), ...errors }}
      locked={creating || !!pending}
    />
  )
  const walletPicker = (
    <div className="checkout-wallet-controls">
      <SelectField
        className="desktop-wallet-select"
        label="Carteira cadastrada"
        value={selected}
        onChange={(event) => {
          const next = wallets.find((wallet) => wallet.id === event.target.value)
          setSelected(event.target.value)
          setNetwork(next?.network ?? 'Ethereum')
          setConnection(null)
        }}
        disabled={creating || !!pending}
      >
        <option value="">Selecione uma carteira</option>
        {wallets.map((wallet) => (
          <option key={wallet.id} value={wallet.id}>
            {wallet.name} · {wallet.network}
          </option>
        ))}
      </SelectField>
      <fieldset className="connected-wallets mobile-wallet-list">
        <legend className="sr-only">Carteira cadastrada</legend>
        {wallets.map((item) => (
          <label className={selected === item.id ? 'checked' : ''} key={item.id}>
            <input
              type="radio"
              name="registered-wallet"
              checked={selected === item.id}
              disabled={creating || !!pending}
              onChange={() => {
                setSelected(item.id)
                setNetwork(item.network)
                setConnection(null)
              }}
            />
            <span>
              <strong>{item.name}</strong>
              <span>{item.address}</span>
              <span>{item.network}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {!wallets.length && (
        <p>
          Cadastre uma carteira para continuar. <Link to="/wallets">Adicionar carteira</Link>
        </p>
      )}
      {wallet && <p className="selected-wallet-address">{wallet.address}</p>}
      <p aria-live="polite">
        {connected ? 'Carteira conectada na simulação.' : 'Carteira desconectada.'}
      </p>
      <Button
        type="button"
        disabled={!wallet || creating || connect.isPending || disconnect.isPending || !!pending}
        onClick={() => (connected ? disconnect.mutate() : connect.mutate())}
      >
        {connected ? 'Desconectar carteira' : 'Conectar carteira'}
      </Button>
      <MutationFeedback error={connect.error || disconnect.error} />
    </div>
  )
  const review = (
    <>
      {reviewRequired && (
        <div className="quote-change" role="alert">
          <p>
            {expired ? 'A cotação expirou.' : 'Preço, estoque, cupom ou taxas mudaram.'} Revise os
            valores antes de confirmar.
          </p>
          {expired ? (
            <Button
              type="button"
              onClick={() => {
                setForceReview(true)
                void client.invalidateQueries({ queryKey: ['quote', userId] })
              }}
            >
              Atualizar cotação
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                setAccepted(quote.revision)
                setForceReview(false)
              }}
            >
              Revisar novos valores
            </Button>
          )}
        </div>
      )}
      <MutationFeedback error={submitError} />
      {creating && <p role="status">Enviando tentativa de compra…</p>}
      {pending ? (
        <Link to="/orders/$orderId" params={{ orderId: pending.id }}>
          Retomar pedido pendente
        </Link>
      ) : (
        <Button
          type="submit"
          className="confirm-purchase"
          disabled={!connected || reviewRequired || creating || orders.isPending || refreshing}
        >
          Confirmar compra
        </Button>
      )}
    </>
  )
  return (
    <>
      <form
        className="checkout-page page-container"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <Breadcrumb current="Pagamento" />
        <div className="desktop-checkout">
          <h1 className="sr-only">Pagamento</h1>
          <div className="checkout-main">
            <section className="collector-form">
              <h2>Perfil do colecionador</h2>
              {fields}
              <label className="notes-field" htmlFor="collector-notes">
                Observação do colecionador (opcional)
                <Textarea
                  id="collector-notes"
                  maxLength={500}
                  value={collector.notes}
                  onChange={(event) => setCollector({ ...collector, notes: event.target.value })}
                />
              </label>
            </section>
            <aside className="checkout-summary">
              <h2>Seus NFTs</h2>
              <CheckoutItems cart={cart} quote={quote} />
              <Link to="/cart" className="promo-return">
                Tem um código promocional? Aplique aqui
              </Link>
              <PriceSummary summary={quote} />
              {walletPicker}
              {review}
            </aside>
          </div>
        </div>
        <div className="mobile-checkout">
          <MobilePageHeader title="Pagamento com carteira" back="/cart" />
          <div className="connected-wallet-heading">
            <h2>Carteiras cadastradas</h2>
            <Link to="/wallets">Trocar carteira</Link>
          </div>
          {walletPicker}
          <details className="mobile-collector" open={!!Object.keys(errors).length || undefined}>
            <summary>Dados do colecionador</summary>
            {fields}
          </details>
          <CheckoutItems cart={cart} quote={quote} />
          <PriceSummary summary={quote} />
          {review}
        </div>
        <p className="preview-disclaimer">
          Demonstração: nenhuma blockchain, extensão ou pagamento real é utilizado.
        </p>
      </form>
      <Footer />
    </>
  )
}
function CheckoutItems({ cart, quote }: { cart: Cart; quote: Quote }) {
  return (
    <div className="order-items">
      {cart.items.map((item) => (
        <div className="order-item" key={item.id}>
          <Artwork src={item.nft.image} alt={item.nft.name} width="70" height="70" sizes="70px" />
          <div>
            <strong>{item.nft.name}</strong>
            <p>Edição: {item.edition}</p>
          </div>
          <span className="item-editions">(x {item.quantity})</span>
          <strong className="item-total">
            {quote.items.find((line) => line.id === item.id)?.total ?? '—'} ETH
          </strong>
        </div>
      ))}
    </div>
  )
}
export function CheckoutPage() {
  const id = useIdentity()
  const cart = useQuery(cartOptions(id))
  const quote = useQuery(quoteOptions(id, cart.data))
  const wallets = useQuery(walletsOptions(id))
  const profile = useQuery(profileOptions(id))
  const [attempt, setAttempt] = useState(() => (id === 'guest' ? null : readAttempt(id)))
  if (attempt)
    return (
      <Recovery
        userId={id}
        attempt={attempt}
        onClear={() => {
          saveAttempt(id, null)
          setAttempt(null)
        }}
      />
    )
  const error = cart.error || quote.error || wallets.error || profile.error
  if (error)
    return (
      <section className="page-container py-12">
        <h1>Revise seu carrinho</h1>
        <NetworkState
          pending={false}
          error={error}
          retry={() => {
            void cart.refetch()
            void quote.refetch()
            void wallets.refetch()
            void profile.refetch()
          }}
        />
        <Link to="/cart">Voltar ao carrinho</Link>
      </section>
    )
  if (!cart.data || !quote.data || !wallets.data || !profile.data)
    return (
      <div className="page-container">
        <NetworkState pending error={null} retry={() => undefined} />
      </div>
    )
  if (!cart.data.items.length)
    return (
      <section className="page-container py-16">
        <h1>Carrinho vazio</h1>
        <Link to="/">Explorar NFTs</Link>
      </section>
    )
  return (
    <CheckoutContent
      key={id}
      userId={id}
      cart={cart.data}
      quote={quote.data}
      wallets={wallets.data}
      profile={profile.data}
      refreshing={quote.isFetching}
    />
  )
}
