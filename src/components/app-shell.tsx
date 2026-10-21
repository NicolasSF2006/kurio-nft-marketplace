import { Outlet, useLocation } from '@tanstack/react-router'
import { Header, MobileNavigation } from '@/components/marketplace/header'
import { PreviewActionsProvider } from '@/components/marketplace/actions'
import { SessionBoundary } from '@/features/auth/session-boundary'
import { DomainSync } from '@/realtime/domain-sync'

export function AppShell() {
  const path = useLocation({ select: (location) => location.pathname })
  const utility = path === '/system'
  const bottomNav = ['/', '/profile', '/wallets', '/system'].includes(path)
  return (
    <PreviewActionsProvider>
      <SessionBoundary />
      <DomainSync />
      <div
        className={`app-shell ${path === '/order-preview' || path.startsWith('/orders/') ? 'receipt-shell' : ''} ${bottomNav ? 'has-bottom-nav' : ''}`}
      >
        <a href="#main" className="skip-link">
          Pular para o conteúdo
        </a>
        <Header />
        <main id="main" tabIndex={-1} className={utility ? 'page-container utility-page' : ''}>
          <Outlet />
        </main>
        {bottomNav && <MobileNavigation />}
      </div>
    </PreviewActionsProvider>
  )
}
