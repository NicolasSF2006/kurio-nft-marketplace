export interface Nft {
  id: string
  name: string
  price: string
  previousPrice?: string
  image: string
  token: string
  edition: string
  description: string
  mobileDescription?: string
  collection?: string
  attributes?: string[]
  rating?: string
  reviewCount?: number
}

export interface PreviewItem {
  nftId: string
  quantity: number
  total: string
}

export interface PreviewSummary {
  subtotal: string
  discount: string
  fee: string
  total: string
}

export interface MarketplacePreview {
  cartBadgeCount: number
  nfts: Nft[]
  homeIds: string[]
  authIds: string[]
  authImages: string[]
  mobileIds: string[]
  relatedIds: string[]
  desktopCart: { items: PreviewItem[]; summary: PreviewSummary }
  mobileCart: { items: PreviewItem[]; summary: PreviewSummary }
  collections: { name: string; count: number }[]
  networks: { name: string; count: number }[]
  articles: { title: string; date: string; reading: string; description: string; image: string }[]
  wallets: { name: string; address: string; network: string }[]
  receipt: { transaction: string; date: string; wallet: string }
}
