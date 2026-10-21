import type { AddCartInput, Profile, Wallet, ScenarioName, CatalogNft, Quote } from '@/types/api'
import type { Order, WalletConnection } from '@/types/orders'
import { catalog } from '@/mocks/fixtures/catalog'

interface User {
  profile: Profile
  salt: string
  passwordHash: string
  favorites: string[]
  wallets: Wallet[]
}
export interface StoredCart {
  items: AddCartInput[]
  coupon: string | null
}
export interface Database {
  version: 4
  users: User[]
  sessions: Record<string, { userId: string; expiresAt: number }>
  carts: Record<string, StoredCart>
  scenario: ScenarioName
  nfts: CatalogNft[]
  fee: string
  couponExpired: boolean
  quotes: Record<string, { owner: string; quote: Quote }>
  orders: Record<string, Order & { outcome: 'confirmed' | 'refused'; settleAt: number | null }>
  idempotency: Record<string, { fingerprint: string; orderId: string }>
  connections: Record<string, WalletConnection & { token: string; walletState: string }>
  realtimeOffline: boolean
}
const key = 'kurio.mock.database.v3'

export async function passwordHash(password: string, salt: string) {
  const encoder = new TextEncoder()
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 120000, hash: 'SHA-256' },
    material,
    256,
  )
  return Array.from(new Uint8Array(bits), (value) => value.toString(16).padStart(2, '0')).join('')
}

export function save(db: Database) {
  localStorage.setItem(key, JSON.stringify(db))
}
export function read(): Database {
  const raw = localStorage.getItem(key)
  if (!raw) throw new Error('Mock database was not initialized')
  return JSON.parse(raw) as Database
}
export async function resetDatabase(scenario: ScenarioName = 'default') {
  const users = await Promise.all(
    ['nova', 'luna'].map(async (name, index) => {
      const salt = `kurio-demo-${name}-v3`
      return {
        profile: {
          id: `user-${name}`,
          displayName: index ? 'Luna Costa' : 'Nova Sato',
          username: name,
          email: `${name}@kurio.test`,
          ens: '',
          walletNickname: '',
          avatar: null,
        },
        salt,
        passwordHash: await passwordHash('Kurio123!', salt),
        favorites: [],
        wallets: [],
      }
    }),
  )
  save({ version: 4, users, sessions: {}, carts: {}, scenario, ...purchaseDefaults() })
}
function purchaseDefaults() {
  return {
    nfts: structuredClone(catalog),
    fee: '0.016',
    couponExpired: false,
    quotes: {},
    orders: {},
    idempotency: {},
    connections: {},
    realtimeOffline: false,
  }
}
export async function initializeDatabase(scenario: ScenarioName) {
  try {
    const existing = read()
    if (existing.version === 4) return
    if (Number(existing.version) === 3) {
      save({ ...existing, version: 4, ...purchaseDefaults() })
      return
    }
  } catch {
    /* missing or obsolete local fixture */
  }
  await resetDatabase(scenario)
}
export function storedCart(db: Database, owner: string): StoredCart {
  return (db.carts[owner] ??= { items: [], coupon: null })
}
