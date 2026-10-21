import { createRoute, lazyRouteComponent, type SearchSchemaInput } from '@tanstack/react-router'
import { rootRoute } from '@/routes/root'
import { NftPage } from '@/features/nft/nft-page'
import { authSearch, requireSession } from '@/features/auth/session'

const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$nftId',
  component: NftPage,
})
const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: lazyRouteComponent(() => import('@/features/cart/cart-page'), 'CartPage'),
})
const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  beforeLoad: requireSession,
  component: lazyRouteComponent(() => import('@/features/checkout/checkout-page'), 'CheckoutPage'),
})
const receiptRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order-preview',
  component: lazyRouteComponent(() => import('@/features/checkout/receipt-page'), 'ReceiptPage'),
})
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => authSearch(search),
  component: lazyRouteComponent(() => import('@/features/auth/auth-page'), 'LoginPage'),
})
const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => authSearch(search),
  component: lazyRouteComponent(() => import('@/features/auth/auth-page'), 'SignupPage'),
})
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: requireSession,
  component: lazyRouteComponent(() => import('@/features/account/account-pages'), 'ProfilePage'),
})
const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
  beforeLoad: requireSession,
  component: lazyRouteComponent(() => import('@/features/account/account-pages'), 'WalletsPage'),
})

export const marketplaceRoutes = [
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/orders',
    beforeLoad: requireSession,
    component: lazyRouteComponent(() => import('@/features/checkout/order-page'), 'OrdersPage'),
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/orders/$orderId',
    beforeLoad: requireSession,
    component: lazyRouteComponent(() => import('@/features/checkout/order-page'), 'OrderPage'),
  }),
  nftRoute,
  cartRoute,
  checkoutRoute,
  receiptRoute,
  loginRoute,
  signupRoute,
  profileRoute,
  walletsRoute,
]
