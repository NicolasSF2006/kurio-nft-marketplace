import { delay, http, HttpResponse } from 'msw'
import { env } from '@/app/env'
import { catalog } from '@/mocks/fixtures/catalog'
import { passwordHash, read, resetDatabase, save, storedCart, type Database } from '@/mocks/state'
import { activeScenario, networkCondition } from '@/mocks/scenarios'
import { validateCatalogSearch } from '@/lib/catalog-search'
import Decimal from 'decimal.js'
import { Failure, fail, currentUser } from '@/mocks/http'
import {
  getNft,
  issueQuote,
  handlePurchase,
  applyAction,
  applyPurchaseScenario,
  scheduleOrders,
} from '@/mocks/purchases'
import {
  mockScenarioNames,
  type Cart,
  type ProfileInput,
  type Wallet,
  type ScenarioName,
} from '@/types/api'

const base = new URL(env.apiBaseUrl.replace(/\/$/, ''), location.origin).href
function validate(fields: Record<string, string>) {
  if (Object.keys(fields).length) fail(422, 'VALIDATION', 'Revise os campos indicados.', fields)
}
const emailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const usernameValid = (value: string) => /^[\p{L}\d_-]{3,30}$/u.test(value)
const normalize = (value: string) => value.trim().toLocaleLowerCase('pt-BR')
function owner(db: Database, request: Request) {
  if (request.headers.get('Authorization')) return currentUser(db, request).user.profile.id
  const guest = request.headers.get('X-Guest-Id')
  if (!guest || !/^[a-z\d-]{8,80}$/i.test(guest))
    fail(400, 'GUEST_REQUIRED', 'Identificação do visitante ausente.')
  return `guest:${guest}`
}
function nftById(id: string) {
  return getNft(read(), id)
}
function available(id: string, edition: string) {
  return nftById(id).editions.find((item) => item.id === edition)?.stock ?? 0
}
function cartResponse(db: Database, key: string): Cart {
  const cart = storedCart(db, key)
  return {
    coupon: cart.coupon,
    items: cart.items.map((item) => ({
      ...item,
      id: `${item.nftId}::${item.edition}`,
      nft: nftById(item.nftId),
      available: available(item.nftId, item.edition),
    })),
  }
}
function validateQuantity(nftId: string, edition: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1)
    fail(422, 'QUANTITY_INVALID', 'A quantidade deve ser um número inteiro positivo.')
  const stock = available(nftId, edition)
  if (quantity > stock)
    fail(409, 'EDITION_UNAVAILABLE', `Edição indisponível para esta quantidade. Estoque: ${stock}.`)
}
function coupon(code: string | null) {
  if (!code) return
  if (code === 'EXPIRADO' || activeScenario() === 'expired-coupon' || read().couponExpired)
    fail(422, 'COUPON_EXPIRED', 'Este cupom expirou.')
  if (code !== 'KURIO10' || activeScenario() === 'invalid-coupon')
    fail(422, 'COUPON_INVALID', 'Cupom inválido.')
}
async function authenticate(db: Database, request: Request, user: Database['users'][number]) {
  const guest = request.headers.get('X-Guest-Id')
  const target = storedCart(db, user.profile.id)
  const source = guest ? db.carts[`guest:${guest}`] : undefined
  if (source) {
    for (const item of source.items) {
      const stock = available(item.nftId, item.edition)
      if (!stock) continue
      const existing = target.items.find(
        (line) => line.nftId === item.nftId && line.edition === item.edition,
      )
      if (existing) existing.quantity = Math.min(stock, existing.quantity + item.quantity)
      else target.items.push({ ...item, quantity: Math.min(stock, item.quantity) })
    }
    target.coupon ??= source.coupon
    delete db.carts[`guest:${guest}`]
  }
  // Starting a new login on this client revokes its previous token as well.
  const previous = request.headers.get('Authorization')?.replace(/^Bearer /, '')
  if (previous) delete db.sessions[previous]
  const token = crypto.randomUUID()
  const session = { userId: user.profile.id, expiresAt: Date.now() + 30 * 60 * 1000 }
  db.sessions[token] = session
  save(db)
  return HttpResponse.json({ token, user: user.profile, expiresAt: session.expiresAt })
}

export const restHandlers = [
  http.all(`${base}/*`, async ({ request }) => {
    const url = new URL(request.url)
    const path = url.pathname.slice(new URL(base).pathname.length)
    const method = request.method
    try {
      // Scenario controls always remain reachable, including in offline/HTTP failure scenarios.
      if (path === '/__mock/reset' && method === 'POST') {
        const input = (await request.json()) as { scenario?: ScenarioName }
        if (input.scenario && !mockScenarioNames.includes(input.scenario))
          fail(422, 'SCENARIO_INVALID', 'Cenário desconhecido.')
        await resetDatabase(input.scenario ?? 'default')
        scheduleOrders()
        applyPurchaseScenario(input.scenario ?? 'default')
        return HttpResponse.json({ ok: true })
      }
      if (path === '/__mock/scenario' && method === 'POST') {
        const input = (await request.json()) as { name: ScenarioName }
        if (!mockScenarioNames.includes(input.name))
          fail(422, 'SCENARIO_INVALID', 'Cenário desconhecido.')
        const db = read()
        db.scenario = input.name
        save(db)
        applyPurchaseScenario(input.name)
        return HttpResponse.json({ ok: true })
      }
      if (path === '/__mock/action' && method === 'POST') {
        const input = (await request.json()) as { action: import('@/types/orders').MockAction }
        applyAction(input.action)
        return HttpResponse.json({ ok: true })
      }
      if (path === '/__mock/expire-session' && method === 'POST') {
        const db = read()
        const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
        if (db.sessions[token]) db.sessions[token].expiresAt = 0
        save(db)
        return HttpResponse.json({ ok: true })
      }
      const condition = networkCondition(request)
      await delay(condition.latency)
      if (condition.failure === 'network') return HttpResponse.error()
      if (condition.failure === 'http')
        fail(503, 'SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível. Tente novamente.')
      if (activeScenario() === 'http400')
        fail(400, 'BAD_REQUEST', 'Requisição recusada no cenário HTTP 400.')
      const purchase = await handlePurchase(request, path, method)
      if (purchase) return purchase
      const db = read()
      if (path === '/auth/login' && method === 'POST') {
        const input = (await request.json()) as { email: string; password: string }
        const user = db.users.find(
          (user) => normalize(user.profile.email) === normalize(input.email ?? ''),
        )
        if (!user || (await passwordHash(input.password ?? '', user.salt)) !== user.passwordHash)
          fail(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
        return authenticate(read(), request, user)
      }
      if (path === '/auth/signup' && method === 'POST') {
        const input = (await request.json()) as {
          username: string
          email: string
          password: string
          confirmPassword: string
        }
        const fields: Record<string, string> = {}
        if (!usernameValid(input.username ?? ''))
          fields.username = 'Use de 3 a 30 letras, números, _ ou -.'
        if (!emailValid(input.email ?? '')) fields.email = 'Informe um e-mail válido.'
        if ((input.password?.length ?? 0) < 8) fields.password = 'Use pelo menos 8 caracteres.'
        if (input.password !== input.confirmPassword)
          fields.confirmPassword = 'As senhas não coincidem.'
        validate(fields)
        const salt = crypto.randomUUID()
        const hash = await passwordHash(input.password, salt)
        const latest = read()
        if (
          activeScenario() === 'signup-conflict' ||
          latest.users.some(
            (user) =>
              normalize(user.profile.email) === normalize(input.email) ||
              normalize(user.profile.username) === normalize(input.username),
          )
        )
          fail(409, 'ACCOUNT_CONFLICT', 'E-mail ou nome de usuário já cadastrado.')
        const user: Database['users'][number] = {
          profile: {
            id: crypto.randomUUID(),
            displayName: input.username,
            username: input.username,
            email: normalize(input.email),
            ens: '',
            walletNickname: '',
            avatar: null,
          },
          salt,
          passwordHash: hash,
          favorites: [],
          wallets: [],
        }
        latest.users.push(user)
        return authenticate(latest, request, user)
      }
      if (path === '/auth/session' && method === 'GET') {
        if (!request.headers.get('Authorization')) return HttpResponse.json(null)
        const { user, session } = currentUser(db, request)
        return HttpResponse.json({ user: user.profile, expiresAt: session.expiresAt })
      }
      if (path === '/auth/logout' && method === 'POST') {
        const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
        delete db.sessions[token]
        save(db)
        return HttpResponse.json({ ok: true })
      }
      if (path === '/nfts' && method === 'GET') {
        const input = validateCatalogSearch(Object.fromEntries(url.searchParams))
        const favorites = input.favorites ? currentUser(db, request).user.favorites : null
        const all = catalog.map((item) => nftById(item.id))
        let result =
          activeScenario() === 'empty'
            ? []
            : all.filter(
                (item) =>
                  (!input.q ||
                    normalize(`${item.name} ${item.description}`).includes(normalize(input.q))) &&
                  (!input.collection || item.collection === input.collection) &&
                  (!input.network || item.network === input.network) &&
                  (!input.maxPrice || new Decimal(item.price).lte(input.maxPrice)) &&
                  (!favorites || favorites.includes(item.id)) &&
                  (!input.launches || item.id.includes('-serie-4')),
              )
        if (input.sort === 'price-asc' || input.sort === 'price-desc')
          result = result.toSorted(
            (a, b) => new Decimal(a.price).cmp(b.price) * (input.sort === 'price-asc' ? 1 : -1),
          )
        if (input.sort === 'popular')
          result = result.toSorted((a, b) => b.popularity - a.popularity)
        const pageSize = 9
        return HttpResponse.json({
          items: result.slice((input.page - 1) * pageSize, input.page * pageSize),
          total: result.length,
          page: input.page,
          pages: Math.ceil(result.length / pageSize),
          pageSize,
          collections: [...new Set(all.map((nft) => nft.collection))].map((name) => ({
            name,
            count: all.filter((nft) => nft.collection === name).length,
          })),
          networks: [...new Set(all.map((nft) => nft.network))].map((name) => ({
            name,
            count: all.filter((nft) => nft.network === name).length,
          })),
        })
      }
      if (path.startsWith('/nfts/') && method === 'GET')
        return HttpResponse.json(nftById(decodeURIComponent(path.slice(6))))
      if (path === '/favorites' && method === 'GET')
        return HttpResponse.json(currentUser(db, request).user.favorites)
      if (
        (path === '/favorites' && method === 'POST') ||
        (path.startsWith('/favorites/') && method === 'DELETE')
      ) {
        const { user } = currentUser(db, request)
        if (activeScenario() === 'favorite-error')
          fail(503, 'FAVORITE_FAILED', 'Não foi possível atualizar o favorito. Alteração desfeita.')
        const id =
          method === 'POST'
            ? ((await request.json()) as { nftId: string }).nftId
            : decodeURIComponent(path.slice(11))
        nftById(id)
        user.favorites =
          method === 'POST'
            ? [...new Set([...user.favorites, id])]
            : user.favorites.filter((item) => item !== id)
        save(db)
        return HttpResponse.json(user.favorites)
      }
      if (path === '/profile' && method === 'GET')
        return HttpResponse.json(currentUser(db, request).user.profile)
      if (path === '/profile' && method === 'PATCH') {
        const { user } = currentUser(db, request)
        const input = (await request.json()) as ProfileInput
        const fields: Record<string, string> = {}
        if (!input.displayName?.trim() || input.displayName.length > 80)
          fields.displayName = 'Informe um nome de até 80 caracteres.'
        if (!usernameValid(input.username ?? ''))
          fields.username = 'Use de 3 a 30 letras, números, _ ou -.'
        if (!emailValid(input.email ?? '')) fields.email = 'Informe um e-mail válido.'
        if (input.ens && !/^[a-z\d-]{3,63}(\.eth)?$/i.test(input.ens))
          fields.ens = 'Informe um nome ENS válido.'
        if ((input.walletNickname?.length ?? 0) > 50)
          fields.walletNickname = 'Use no máximo 50 caracteres.'
        if (
          input.avatar !== null &&
          !/^data:image\/(png|jpeg|webp);base64,[a-z\d+/=]+$/i.test(input.avatar ?? '')
        )
          fields.avatar = 'Use uma imagem PNG, JPEG ou WebP.'
        if ((input.avatar?.length ?? 0) > 700000) fields.avatar = 'A imagem deve ter até 500 KB.'
        validate(fields)
        if (
          db.users.some(
            (other) =>
              other.profile.id !== user.profile.id &&
              (normalize(other.profile.email) === normalize(input.email) ||
                normalize(other.profile.username) === normalize(input.username)),
          )
        )
          fail(409, 'PROFILE_CONFLICT', 'E-mail ou usuário já cadastrado.')
        user.profile = {
          id: user.profile.id,
          displayName: input.displayName.trim(),
          username: input.username,
          email: normalize(input.email),
          ens: input.ens,
          walletNickname: input.walletNickname,
          avatar: input.avatar,
        }
        save(db)
        return HttpResponse.json(user.profile)
      }
      if (path === '/profile/password' && method === 'PUT') {
        const { user } = currentUser(db, request)
        const input = (await request.json()) as {
          currentPassword: string
          password: string
          confirmPassword: string
        }
        const fields: Record<string, string> = {}
        if ((await passwordHash(input.currentPassword ?? '', user.salt)) !== user.passwordHash)
          fields.currentPassword = 'Senha atual incorreta.'
        if ((input.password?.length ?? 0) < 8) fields.password = 'Use pelo menos 8 caracteres.'
        if (input.password !== input.confirmPassword)
          fields.confirmPassword = 'As senhas não coincidem.'
        validate(fields)
        const hash = await passwordHash(input.password, user.salt)
        const latest = read()
        const target = currentUser(latest, request).user
        target.passwordHash = hash
        // Revoke other sessions after a password change; keep this session usable.
        const token = currentUser(latest, request).token
        for (const [id, session] of Object.entries(latest.sessions))
          if (session.userId === target.profile.id && id !== token) delete latest.sessions[id]
        save(latest)
        return HttpResponse.json({ ok: true })
      }
      if (path === '/wallets' && method === 'GET')
        return HttpResponse.json(currentUser(db, request).user.wallets)
      if (
        (path === '/wallets' && method === 'POST') ||
        (path.startsWith('/wallets/') && method === 'PATCH')
      ) {
        const { user } = currentUser(db, request)
        const input = (await request.json()) as Omit<Wallet, 'id'>
        const fields: Record<string, string> = {}
        if (!input.name?.trim() || input.name.length > 50)
          fields.name = 'Informe um apelido de até 50 caracteres.'
        if (!['Ethereum', 'Polygon', 'Solana'].includes(input.network))
          fields.network = 'Selecione uma rede válida.'
        if (!['primary', 'secondary'].includes(input.role))
          fields.role = 'Selecione principal ou secundária.'
        const validAddress =
          input.network === 'Solana'
            ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input.address ?? '')
            : /^0x[a-f\d]{40}$/i.test(input.address ?? '')
        if (!validAddress)
          fields.address =
            input.network === 'Solana'
              ? 'Use um endereço Solana de 32 a 44 caracteres.'
              : 'Use 0x seguido de 40 caracteres hexadecimais.'
        if (!emailValid(input.email ?? '')) fields.email = 'Informe um e-mail válido.'
        if (!input.displayName?.trim()) fields.displayName = 'Informe o nome do perfil.'
        if (!['MetaMask', 'WalletConnect', 'Coinbase'].includes(input.provider))
          fields.provider = 'Selecione um tipo de carteira.'
        if (input.ens && !/^[a-z\d-]{3,63}(\.eth)?$/i.test(input.ens))
          fields.ens = 'Informe um nome ENS válido.'
        validate(fields)
        const id = method === 'PATCH' ? decodeURIComponent(path.slice(9)) : crypto.randomUUID()
        if (method === 'PATCH' && !user.wallets.some((wallet) => wallet.id === id))
          fail(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada.')
        if (user.wallets.some((wallet) => wallet.id !== id && wallet.role === input.role))
          fail(
            409,
            'WALLET_ROLE_CONFLICT',
            'Já existe uma carteira com esta função. Edite a carteira existente.',
          )
        if (
          user.wallets.some(
            (wallet) =>
              wallet.id !== id &&
              wallet.network === input.network &&
              wallet.address.toLowerCase() === input.address.toLowerCase(),
          )
        )
          fail(409, 'WALLET_DUPLICATE', 'Este endereço já está cadastrado nesta rede.')
        const wallet: Wallet = {
          id,
          role: input.role,
          name: input.name.trim(),
          network: input.network,
          address: input.address,
          provider: input.provider,
          displayName: input.displayName,
          email: normalize(input.email),
          ens: input.ens,
          referral: input.referral,
        }
        user.wallets = [...user.wallets.filter((item) => item.id !== id), wallet]
        save(db)
        return HttpResponse.json(wallet, { status: method === 'POST' ? 201 : 200 })
      }
      if (path === '/cart' && method === 'GET')
        return HttpResponse.json(cartResponse(db, owner(db, request)))
      if (path === '/cart/items' && method === 'POST') {
        const key = owner(db, request)
        const cart = storedCart(db, key)
        const input = (await request.json()) as { nftId: string; edition: string; quantity: number }
        const existing = cart.items.find(
          (item) => item.nftId === input.nftId && item.edition === input.edition,
        )
        validateQuantity(input.nftId, input.edition, input.quantity)
        const quantity = input.quantity + (existing?.quantity ?? 0)
        validateQuantity(input.nftId, input.edition, quantity)
        if (existing) existing.quantity = quantity
        else cart.items.push(input)
        save(db)
        return HttpResponse.json(cartResponse(db, key), { status: 201 })
      }
      if (path.startsWith('/cart/items/') && (method === 'PATCH' || method === 'DELETE')) {
        const key = owner(db, request)
        const cart = storedCart(db, key)
        const id = decodeURIComponent(path.slice(12))
        const item = cart.items.find((item) => `${item.nftId}::${item.edition}` === id)
        if (!item) fail(404, 'CART_ITEM_NOT_FOUND', 'Item não encontrado.')
        if (method === 'DELETE') cart.items = cart.items.filter((line) => line !== item)
        else {
          const input = (await request.json()) as { quantity: number }
          validateQuantity(item.nftId, item.edition, input.quantity)
          item.quantity = input.quantity
        }
        save(db)
        return HttpResponse.json(cartResponse(db, key))
      }
      if (path === '/cart/coupon' && (method === 'PUT' || method === 'DELETE')) {
        const key = owner(db, request)
        const cart = storedCart(db, key)
        const code =
          method === 'DELETE'
            ? null
            : (((await request.json()) as { code: string }).code ?? '').trim().toUpperCase()
        if (method === 'PUT' && !code) fail(422, 'COUPON_INVALID', 'Informe o código do cupom.')
        coupon(code)
        cart.coupon = code
        save(db)
        return HttpResponse.json(cartResponse(db, key))
      }
      if (path === '/cart/quote' && method === 'POST') {
        return HttpResponse.json(issueQuote(db, owner(db, request)))
      }
      fail(404, 'RESOURCE_NOT_FOUND', 'Recurso não encontrado.')
    } catch (error) {
      if (error instanceof Failure) return HttpResponse.json(error.body, { status: error.status })
      return HttpResponse.json(
        { code: 'INVALID_REQUEST', message: 'Não foi possível processar a requisição.' },
        { status: 400 },
      )
    }
  }),
]
