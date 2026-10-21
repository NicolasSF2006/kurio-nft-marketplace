import { createRouter } from '@tanstack/react-router'
import { NotFoundPage, RouteErrorPage } from '@/components/route-feedback'
import { queryClient } from '@/lib/query-client'
import { rootRoute } from '@/routes/root'
import { indexRoute } from '@/routes/index'
import { systemRoute } from '@/routes/system'
import { marketplaceRoutes } from '@/routes/marketplace'

export const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, systemRoute, ...marketplaceRoutes]),
  context: { queryClient },
  defaultErrorComponent: RouteErrorPage,
  defaultNotFoundComponent: NotFoundPage,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
