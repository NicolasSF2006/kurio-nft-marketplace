import type { CatalogNft, Network, Quote, Wallet } from './api.js'

export interface Collector {
  displayName: string
  username: string
  email: string
  ens: string
  notes: string
}
export interface WalletConnection {
  id: string
  userId: string
  walletId: string
  network: Network
  status: 'connected' | 'disconnected'
}
export interface CreateOrderInput {
  quoteId: string
  connectionId: string
  collector: Collector
}
export type OrderStatus = 'pending' | 'confirmed' | 'refused'
export interface OrderLine {
  id: string
  nftId: string
  name: string
  image: string
  token: string
  edition: string
  quantity: number
  unitPrice: string
  total: string
}
export interface Order {
  id: string
  idempotencyKey: string
  userId: string
  version: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
  transaction: string | null
  reason: string | null
  collector: Collector
  wallet: Wallet
  quote: Quote
  items: OrderLine[]
}
export interface NftUpdated {
  eventId: string
  resourceId: string
  version: number
  nft: CatalogNft
}
export interface OrderUpdated {
  eventId: string
  resourceId: string
  userId: string
  version: number
  order: Order
}
export interface RealtimeReady {
  userId: string | null
}
export const mockActions = [
  'price-up',
  'sold-out',
  'fee-up',
  'coupon-expired',
  'disconnect',
  'reconnect',
  'duplicate',
  'old',
  'confirm-order',
  'refuse-order',
  'expire-purchase',
] as const
export type MockAction = (typeof mockActions)[number]
export interface CheckoutAttempt {
  key: string
  input: CreateOrderInput
}
