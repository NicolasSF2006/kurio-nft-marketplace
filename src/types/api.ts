import type { Nft, PreviewSummary } from './marketplace.js'

export interface ApiError {
  code: string
  message: string
  fields?: Record<string, string>
}
export interface Edition {
  id: string
  stock: number
}
export interface CatalogNft extends Nft {
  version: number
  collection: string
  network: string
  editions: Edition[]
  popularity: number
  details?: { description: string; provenance: string; contract: string; royalties: string }
}
export type Sort = 'recent' | 'price-asc' | 'price-desc' | 'popular'
export interface CatalogSearch {
  q: string
  collection: string
  network: string
  maxPrice: string
  sort: Sort
  page: number
  favorites: boolean
  launches: boolean
}
export interface CatalogResponse {
  items: CatalogNft[]
  total: number
  page: number
  pages: number
  pageSize: number
  collections: { name: string; count: number }[]
  networks: { name: string; count: number }[]
}
export interface Profile {
  id: string
  displayName: string
  username: string
  email: string
  ens: string
  walletNickname: string
  avatar: string | null
}
export interface Session {
  user: Profile
  expiresAt: number
}
export interface AuthResponse extends Session {
  token: string
}
export interface LoginInput {
  email: string
  password: string
}
export interface SignupInput extends LoginInput {
  username: string
  confirmPassword: string
}
export type ProfileInput = Omit<Profile, 'id'>
export interface PasswordInput {
  currentPassword: string
  password: string
  confirmPassword: string
}
export type Network = 'Ethereum' | 'Polygon' | 'Solana'
export interface Wallet {
  id: string
  role: 'primary' | 'secondary'
  name: string
  network: Network
  address: string
  provider: string
  displayName: string
  email: string
  ens: string
  referral: string
}
export type WalletInput = Omit<Wallet, 'id'>
export interface CartItem {
  id: string
  nftId: string
  edition: string
  quantity: number
  nft: CatalogNft
  available: number
}
export interface Cart {
  items: CartItem[]
  coupon: string | null
}
export interface AddCartInput {
  nftId: string
  edition: string
  quantity: number
}
export interface Quote extends PreviewSummary {
  id: string
  revision: string
  expiresAt: number
  coupon: string | null
  items: { id: string; total: string }[]
}
export const mockScenarioNames = [
  'default',
  'empty',
  'slow',
  'variable',
  'out-of-order',
  'http400',
  'error',
  'offline',
  'expired-session',
  'signup-conflict',
  'invalid-coupon',
  'expired-coupon',
  'unavailable',
  'favorite-error',
  'payment-confirmed',
  'payment-refused',
  'order-pending',
  'timeout-after-create',
  'price-changed',
  'edition-sold-out',
  'socket-disconnected',
  'duplicate-event',
  'old-event',
  'purchase-session-expired',
  'wallet-refused',
] as const
export type ScenarioName = (typeof mockScenarioNames)[number]
export interface MockControls {
  reset: (scenario?: ScenarioName) => Promise<void>
  scenario: (name: ScenarioName) => Promise<void>
  expireSession: () => Promise<void>
  action: (action: import('./orders.js').MockAction) => Promise<void>
  replayOrder: (
    attempt: import('./orders.js').CheckoutAttempt,
  ) => Promise<import('./orders.js').Order>
}
declare global {
  interface Window {
    kurioMocks?: MockControls
  }
}
