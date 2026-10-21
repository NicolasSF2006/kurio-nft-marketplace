import { Link, useLocation } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useCart } from '@/features/marketplace/api'
import { sessionOptions } from '@/features/auth/session'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/marketplace/icon'
import { usePreviewNotice } from '@/components/marketplace/preview-notice'
import { designAssets } from '@/lib/design-assets'

export function Header() {
  const { data } = useCart()
  const quantity = data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? '—'
  const session = useQuery(sessionOptions)
  const pathname = useLocation({ select: (location) => location.pathname })
  const market = ['/nfts/', '/cart', '/checkout'].some((path) => pathname.startsWith(path))
  const notify = usePreviewNotice()
  return (
    <header className={`site-header page-container ${market ? 'market-header' : ''}`}>
      <Link to="/" className="wordmark" aria-label="Kurio — início">
        KURIO
      </Link>
      <nav aria-label="Navegação principal" className="desktop-links">
        <Link to="/" className={!market ? 'nav-active' : ''}>
          Início
        </Link>
        <Link to="/" hash="catalogo" className={market ? 'nav-active' : ''}>
          Mercado
        </Link>
        <button
          type="button"
          title="Fora do escopo desta entrega"
          onClick={() => notify('A página de criadores está fora do escopo do desafio.')}
        >
          Criadores
        </button>
        <button
          type="button"
          title="Fora do escopo desta entrega"
          onClick={() => notify('Conteúdo editorial está fora do escopo do desafio.')}
        >
          Aprenda
        </button>
      </nav>
      <div className="header-actions">
        <Link to="/" hash="busca" aria-label="Buscar NFTs">
          <Icon src={designAssets.home.imgSearchIcon} />
        </Link>
        <Link to="/cart" aria-label={`Carrinho de NFTs, ${quantity} itens`} className="header-cart">
          <Icon src={designAssets.home.imgCartIcon} />
          <span className="cart-badge" aria-hidden="true">
            <img src={designAssets.home.imgBadge} alt="" />
            <span>{quantity}</span>
          </span>
        </Link>
        <Button asChild className="header-login">
          <Link to={session.data ? '/profile' : '/login'}>
            <Icon src={session.data ? designAssets.profile.imgUser : designAssets.home.imgLogout} />
            {session.data ? 'Perfil' : 'Entrar'}
          </Link>
        </Button>
      </div>
    </header>
  )
}

export function MobileNavigation() {
  const notify = usePreviewNotice()
  const a = designAssets['mobile-home']
  return (
    <nav className="mobile-navigation" aria-label="Navegação mobile">
      <Link to="/" aria-label="Início">
        <Icon src={a.imgHome} />
      </Link>
      <Link to="/" search={{ favorites: true }} aria-label="Favoritos">
        <Icon src={a.imgVector1} />
      </Link>
      <button
        type="button"
        className="scan-action"
        aria-label="Scanner — fora do escopo"
        onClick={() => notify('O scanner não faz parte do escopo deste desafio.')}
      >
        <span className="scan-icon">
          {[a.imgVector2, a.imgVector3, a.imgVector4, a.imgVector5, a.imgVector6].map((src, i) => (
            <img key={src} className={`scan-part scan-part-${i}`} src={src} alt="" />
          ))}
        </span>
      </button>
      <Link to="/cart" aria-label="Carrinho">
        <Icon src={a.imgShop} />
      </Link>
      <Link to="/profile" aria-label="Perfil do colecionador">
        <Icon src={a.imgUser} />
      </Link>
    </nav>
  )
}

export function MobilePageHeader({
  title,
  back = '/',
}: {
  title: string
  back?: '/' | '/cart' | '/profile'
}) {
  return (
    <div className="mobile-page-header">
      <Link to={back} aria-label="Voltar">
        <Icon src={designAssets['mobile-cart'].imgArrowLeft2} />
      </Link>
      <h1>{title}</h1>
    </div>
  )
}

export function Breadcrumb({ current }: { current?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <Link to="/">Início</Link>
      <span>/</span>
      <Link to="/" hash="catalogo">
        Mercado
      </Link>
      {current && (
        <>
          <span>/</span>
          <span aria-current="page">{current}</span>
        </>
      )}
    </nav>
  )
}
