import { createRoute, stripSearchParams, type SearchSchemaInput } from '@tanstack/react-router'
import { HomePage } from '@/components/home-page'
import { rootRoute } from '@/routes/root'
import { validateCatalogSearch } from '@/lib/catalog-search'
import { requireSession } from '@/features/auth/session'

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) =>
    validateCatalogSearch(search),
  search: { middlewares: [stripSearchParams(validateCatalogSearch({}))] },
  beforeLoad: (context) => {
    if (context.search.favorites) return requireSession(context)
  },
  component: HomePage,
})
