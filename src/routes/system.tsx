import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { rootRoute } from '@/routes/root'

export const systemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/system',
  component: lazyRouteComponent(() => import('@/features/system/system-status'), 'SystemStatus'),
})
