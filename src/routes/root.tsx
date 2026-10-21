import { createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/app-shell'

export const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: AppShell,
})
