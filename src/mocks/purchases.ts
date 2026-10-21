import Decimal from 'decimal.js'
import { delay, HttpResponse } from 'msw'
import type { CatalogNft, Quote, ScenarioName } from '@/types/api'
import {
  mockActions,
  type CreateOrderInput,
  type MockAction,
  type Order,
  type WalletConnection,
} from '@/types/orders'
import { currentUser, fail } from './http'
import { read, save, storedCart, type Database } from './state'
import { disconnectPeers, emitNft, emitOrder, expirePeers } from './events'

const timers = new Map<string, number>()
const targetId = 'emerald-ape-042'
export function getNft(db: Database, id: string): CatalogNft {
  const nft = db.nfts.find((nft) => nft.id === id)
  if (!nft) fail(404, 'NFT_NOT_FOUND', 'NFT não encontrado')
  return db.scenario === 'unavailable'
    ? { ...nft, editions: nft.editions.map((edition) => ({ ...edition, stock: 0 })) }
    : nft
}
function validateCoupon(db: Database, code: string | null) {
  if (!code) return
  if (code === 'EXPIRADO' || db.couponExpired || db.scenario === 'expired-coupon')
    fail(422, 'COUPON_EXPIRED', 'Este cupom expirou.')
  if (code !== 'KURIO10' || db.scenario === 'invalid-coupon')
    fail(422, 'COUPON_INVALID', 'Cupom inválido.')
}
function calculate(db: Database, owner: string): Omit<Quote, 'id' | 'expiresAt'> {
  const cart = storedCart(db, owner)
  validateCoupon(db, cart.coupon)
  const lines = cart.items.map((item) => {
    const nft = getNft(db, item.nftId)
    const stock = nft.editions.find((edition) => edition.id === item.edition)?.stock ?? 0
    if (item.quantity > stock)
      fail(
        409,
        'EDITION_UNAVAILABLE',
        `Edição indisponível para esta quantidade. Estoque: ${stock}.`,
      )
    return {
      ...item,
      nft,
      stock,
      id: `${item.nftId}::${item.edition}`,
      total: new Decimal(nft.price).times(item.quantity).toFixed(),
    }
  })
  const subtotal = lines.reduce((sum, item) => sum.plus(item.total), new Decimal(0))
  const discount = cart.coupon ? subtotal.times('0.1') : new Decimal(0)
  const fee = lines.length ? new Decimal(db.fee) : new Decimal(0)
  return {
    items: lines.map((item) => ({ id: item.id, total: item.total })),
    coupon: cart.coupon,
    subtotal: subtotal.toFixed(),
    discount: discount.toFixed(),
    fee: fee.toFixed(),
    total: subtotal.minus(discount).plus(fee).toFixed(),
    revision: JSON.stringify([
      owner,
      lines.map((item) => [
        item.nftId,
        item.edition,
        item.quantity,
        item.nft.version,
        item.nft.price,
        item.stock,
      ]),
      cart.coupon,
      db.couponExpired,
      db.fee,
    ]),
  }
}
export function issueQuote(db: Database, owner: string): Quote {
  const quote = { ...calculate(db, owner), id: crypto.randomUUID(), expiresAt: Date.now() + 120000 }
  for (const [id, stored] of Object.entries(db.quotes))
    if (stored.quote.expiresAt < Date.now()) delete db.quotes[id]
  const own = Object.entries(db.quotes).filter(([, value]) => value.owner === owner)
  for (const [id] of own.slice(0, Math.max(0, own.length - 30))) delete db.quotes[id]
  db.quotes[quote.id] = { owner, quote }
  save(db)
  return quote
}
function publicOrder(order: Database['orders'][string]): Order {
  const { outcome: _, settleAt: __, ...value } = order
  return value
}
export function settleOrder(id: string, status: 'confirmed' | 'refused') {
  const db = read()
  const order = db.orders[id]
  if (!order || order.status !== 'pending') return
  const changed: CatalogNft[] = []
  if (status === 'confirmed') {
    const cart = storedCart(db, order.userId)
    for (const purchased of order.items) {
      const line = cart.items.find((item) => `${item.nftId}::${item.edition}` === purchased.id)
      if (line) line.quantity = Math.max(0, line.quantity - purchased.quantity)
    }
    cart.items = cart.items.filter((item) => item.quantity > 0)
    if (!cart.items.length) cart.coupon = null
    order.transaction = `0x${order.id.replaceAll('-', '').padEnd(64, '0')}`
  } else {
    for (const purchased of order.items) {
      const nft = db.nfts.find((item) => item.id === purchased.nftId)!
      const edition = nft.editions.find((item) => item.id === purchased.edition)!
      edition.stock += purchased.quantity
      nft.version++
      changed.push(nft)
    }
    order.reason = 'Pagamento recusado na simulação. Seus itens foram preservados.'
  }
  order.status = status
  order.version++
  order.updatedAt = new Date().toISOString()
  order.settleAt = null
  save(db)
  const timer = timers.get(id)
  if (timer) window.clearTimeout(timer)
  timers.delete(id)
  for (const nft of changed) emitNft(nft)
  emitOrder(publicOrder(order))
}
export function scheduleOrders() {
  for (const timer of timers.values()) window.clearTimeout(timer)
  timers.clear()
  for (const order of Object.values(read().orders))
    if (order.status === 'pending' && order.settleAt !== null) {
      const timer = window.setTimeout(
        () => settleOrder(order.id, order.outcome),
        Math.max(0, order.settleAt - Date.now()),
      )
      timers.set(order.id, timer)
    }
}
function advanceOrders() {
  for (const order of Object.values(read().orders))
    if (order.status === 'pending' && order.settleAt !== null && order.settleAt <= Date.now())
      settleOrder(order.id, order.outcome)
}
function orderForUser(db: Database, id: string, userId: string) {
  const order = db.orders[id]
  if (!order || order.userId !== userId) fail(404, 'ORDER_NOT_FOUND', 'Pedido não encontrado.')
  return publicOrder(order)
}
function fingerprint(input: CreateOrderInput) {
  const canonical = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(canonical)
      : value !== null && typeof value === 'object'
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([key, value]) => [key, canonical(value)]),
          )
        : value
  return JSON.stringify(canonical(input))
}
function collectorFields(input: CreateOrderInput) {
  const fields: Record<string, string> = {}
  const c = input.collector
  if (!c?.displayName?.trim() || c.displayName.length > 80)
    fields.displayName = 'Informe um nome de até 80 caracteres.'
  if (!/^[\p{L}\d_-]{3,30}$/u.test(c?.username ?? ''))
    fields.username = 'Informe um nome de usuário válido.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c?.email ?? '')) fields.email = 'Informe um e-mail válido.'
  if (c?.ens && !/^[a-z\d-]{3,63}(\.eth)?$/i.test(c.ens)) fields.ens = 'Informe um nome ENS válido.'
  if ((c?.notes?.length ?? 0) > 500) fields.notes = 'Use no máximo 500 caracteres.'
  if (Object.keys(fields).length)
    fail(422, 'VALIDATION', 'Revise os dados do colecionador.', fields)
}
export async function handlePurchase(
  request: Request,
  path: string,
  method: string,
): Promise<Response | null> {
  if (!path.startsWith('/orders') && !path.startsWith('/wallet-connections')) return null
  advanceOrders()
  let db = read()
  let { user, token } = currentUser(db, request)
  if (path === '/wallet-connections' && method === 'POST') {
    const input = (await request.json()) as { walletId: string; network: string }
    db = read()
    ;({ user, token } = currentUser(db, request))
    const wallet = user.wallets.find((wallet) => wallet.id === input.walletId)
    if (!wallet)
      fail(422, 'WALLET_REQUIRED', 'Selecione uma carteira cadastrada.', {
        walletId: 'Selecione uma carteira cadastrada.',
      })
    if (input.network !== wallet.network)
      fail(422, 'NETWORK_MISMATCH', 'A rede selecionada não corresponde à carteira.', {
        network: 'Selecione a rede cadastrada para esta carteira.',
      })
    if (db.scenario === 'wallet-refused')
      fail(409, 'WALLET_REFUSED', 'Conexão recusada pela carteira simulada.')
    const connection: WalletConnection = {
      id: crypto.randomUUID(),
      userId: user.profile.id,
      walletId: wallet.id,
      network: wallet.network,
      status: 'connected',
    }
    for (const previous of Object.values(db.connections))
      if (previous.token === token) previous.status = 'disconnected'
    db.connections[connection.id] = { ...connection, token, walletState: JSON.stringify(wallet) }
    save(db)
    return HttpResponse.json(connection, { status: 201 })
  }
  if (path.startsWith('/wallet-connections/')) {
    const id = decodeURIComponent(path.slice('/wallet-connections/'.length))
    const connection = db.connections[id]
    if (!connection || connection.userId !== user.profile.id || connection.token !== token)
      fail(404, 'CONNECTION_NOT_FOUND', 'Conexão não encontrada.')
    if (method === 'DELETE') {
      connection.status = 'disconnected'
      save(db)
    }
    if (method === 'GET' || method === 'DELETE')
      return HttpResponse.json({
        id: connection.id,
        userId: connection.userId,
        walletId: connection.walletId,
        network: connection.network,
        status: connection.status,
      })
  }
  if (path === '/orders' && method === 'GET')
    return HttpResponse.json(
      Object.values(db.orders)
        .filter((order) => order.userId === user.profile.id)
        .map(publicOrder)
        .toReversed(),
    )
  if (path.startsWith('/orders/by-key/') && method === 'GET') {
    const key = decodeURIComponent(path.slice('/orders/by-key/'.length))
    const record = db.idempotency[`${user.profile.id}:${key}`]
    if (!record)
      fail(
        404,
        'ATTEMPT_NOT_FOUND',
        'Tentativa ainda não localizada. Reenvie a mesma tentativa se necessário.',
      )
    return HttpResponse.json(orderForUser(db, record.orderId, user.profile.id))
  }
  if (path.startsWith('/orders/') && method === 'GET') {
    const suffix = path.slice('/orders/'.length)
    const id = decodeURIComponent(suffix.split('/')[0] ?? '')
    const order = orderForUser(db, id, user.profile.id)
    return HttpResponse.json(
      suffix.endsWith('/status')
        ? { id: order.id, status: order.status, version: order.version }
        : order,
    )
  }
  if (path === '/orders' && method === 'POST') {
    const key = request.headers.get('Idempotency-Key') ?? ''
    if (!/^[a-z\d-]{16,80}$/i.test(key))
      fail(422, 'IDEMPOTENCY_REQUIRED', 'A tentativa precisa de uma chave de idempotência válida.')
    const input = (await request.json()) as CreateOrderInput
    // Re-read after body parsing: concurrent submissions must observe the first committed key.
    db = read()
    ;({ user, token } = currentUser(db, request))
    const digest = fingerprint(input)
    const existing = db.idempotency[`${user.profile.id}:${key}`]
    if (existing) {
      if (existing.fingerprint !== digest)
        fail(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi utilizada com outro conteúdo.')
      return HttpResponse.json(orderForUser(db, existing.orderId, user.profile.id))
    }
    collectorFields(input)
    const pending = Object.values(db.orders).find(
      (order) => order.userId === user.profile.id && order.status === 'pending',
    )
    if (pending)
      fail(
        409,
        'ORDER_PENDING',
        `Você já possui um pedido pendente: ${pending.id}. Consulte seus pedidos.`,
      )
    const connection = db.connections[input.connectionId]
    if (
      !connection ||
      connection.token !== token ||
      connection.userId !== user.profile.id ||
      connection.status !== 'connected'
    )
      fail(409, 'WALLET_DISCONNECTED', 'Conecte uma carteira cadastrada antes de confirmar.')
    const wallet = user.wallets.find(
      (wallet) => wallet.id === connection.walletId && wallet.network === connection.network,
    )
    if (!wallet || connection.walletState !== JSON.stringify(wallet))
      fail(409, 'WALLET_CHANGED', 'A carteira mudou. Conecte novamente antes de comprar.')
    const stored = db.quotes[input.quoteId]
    if (!stored || stored.owner !== user.profile.id || stored.quote.expiresAt <= Date.now())
      fail(409, 'QUOTE_STALE', 'A cotação expirou. Revise os valores e confirme novamente.')
    const current = calculate(db, user.profile.id)
    if (current.revision !== stored.quote.revision)
      fail(
        409,
        'QUOTE_STALE',
        'Preço, disponibilidade, cupom ou taxas mudaram. Revise os valores e confirme novamente.',
      )
    const cart = storedCart(db, user.profile.id)
    if (!cart.items.length) fail(422, 'CART_EMPTY', 'Seu carrinho está vazio.')
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const outcome = db.scenario === 'payment-refused' ? 'refused' : 'confirmed'
    const order: Database['orders'][string] = {
      id,
      idempotencyKey: key,
      userId: user.profile.id,
      version: 1,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      transaction: null,
      reason: null,
      collector: structuredClone(input.collector),
      wallet: structuredClone(wallet),
      quote: structuredClone(stored.quote),
      items: cart.items.map((item) => {
        const nft = getNft(db, item.nftId)
        const lineId = `${item.nftId}::${item.edition}`
        return {
          id: lineId,
          nftId: nft.id,
          name: nft.name,
          image: nft.image,
          token: nft.token,
          edition: item.edition,
          quantity: item.quantity,
          unitPrice: nft.price,
          total: stored.quote.items.find((line) => line.id === lineId)!.total,
        }
      }),
      outcome,
      settleAt: db.scenario === 'order-pending' ? null : Date.now() + 1200,
    }
    const changed: CatalogNft[] = []
    for (const item of order.items) {
      const nft = db.nfts.find((nft) => nft.id === item.nftId)!
      nft.editions.find((edition) => edition.id === item.edition)!.stock -= item.quantity
      nft.version++
      changed.push(nft)
    }
    db.orders[id] = order
    db.idempotency[`${user.profile.id}:${key}`] = { fingerprint: digest, orderId: id }
    save(db)
    for (const nft of changed) emitNft(nft)
    emitOrder(publicOrder(order))
    scheduleOrders()
    if (db.scenario === 'purchase-session-expired') {
      const latest = read()
      latest.sessions[token]!.expiresAt = 0
      save(latest)
      expirePeers(token)
    }
    if (db.scenario === 'timeout-after-create') await delay(2200)
    return HttpResponse.json(publicOrder(read().orders[id]!), { status: 201 })
  }
  return null
}
export function applyAction(action: MockAction) {
  if (!mockActions.includes(action))
    fail(422, 'ACTION_INVALID', 'Ação de demonstração desconhecida.')
  const db = read()
  if (action === 'disconnect' || action === 'reconnect') {
    db.realtimeOffline = action === 'disconnect'
    save(db)
    if (db.realtimeOffline) disconnectPeers()
    return
  }
  if (action === 'confirm-order' || action === 'refuse-order') {
    for (const order of Object.values(db.orders))
      settleOrder(order.id, action === 'confirm-order' ? 'confirmed' : 'refused')
    return
  }
  if (action === 'expire-purchase') {
    for (const token of Object.keys(db.sessions)) db.sessions[token]!.expiresAt = 0
    save(db)
    for (const token of Object.keys(db.sessions)) expirePeers(token)
    return
  }
  const nft = db.nfts.find((nft) => nft.id === targetId)!
  const previous = structuredClone(nft)
  if (action === 'sold-out')
    nft.editions = nft.editions.map((edition) => ({ ...edition, stock: 0 }))
  else if (action === 'fee-up') db.fee = new Decimal(db.fee).plus('0.001').toFixed()
  else if (action === 'coupon-expired') db.couponExpired = true
  else nft.price = new Decimal(nft.price).plus('0.1').toFixed()
  nft.version++
  save(db)
  const event = emitNft(nft)
  if (action === 'duplicate') emitNft(nft, event)
  if (action === 'old')
    emitNft(previous, {
      ...event,
      eventId: crypto.randomUUID(),
      version: previous.version,
      nft: previous,
    })
  for (const order of Object.values(db.orders)) {
    const dto = publicOrder(order)
    if (action === 'duplicate') {
      const event = emitOrder(dto)
      emitOrder(dto, event)
    }
    if (action === 'old' && dto.version > 1)
      emitOrder({ ...dto, status: 'pending', version: dto.version - 1 })
  }
}
export function applyPurchaseScenario(name: ScenarioName) {
  const actions: Partial<Record<ScenarioName, MockAction>> = {
    'price-changed': 'price-up',
    'edition-sold-out': 'sold-out',
    'socket-disconnected': 'disconnect',
    'duplicate-event': 'duplicate',
    'old-event': 'old',
  }
  const action = actions[name]
  if (action) applyAction(action)
}
