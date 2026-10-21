import { Artwork } from '@/components/marketplace/artwork'
import { CatalogCardsSkeleton } from '@/components/marketplace/catalog-skeleton'
import { useId, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { catalogOptions, useIdentity } from '@/features/marketplace/api'
import { validateCatalogSearch } from '@/lib/catalog-search'
import { NetworkState } from '@/components/marketplace/feedback'
import type { CatalogSearch, Sort } from '@/types/api'
import { Dialog } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PreviewData } from '@/components/marketplace/preview'
import { Footer } from '@/components/marketplace/footer'
import { Icon } from '@/components/marketplace/icon'
import { NftCard } from '@/components/marketplace/nft-card'
import { usePreviewNotice } from '@/components/marketplace/preview-notice'
import { designAssets } from '@/lib/design-assets'
import type { MarketplacePreview } from '@/types/marketplace'

function Filters({
  data,
  search,
  update,
}: {
  data: Pick<MarketplacePreview, 'collections' | 'networks'>
  search: CatalogSearch
  update: (patch: Partial<CatalogSearch>) => void
}) {
  const rangeId = useId()
  const [price, setPrice] = useState(search.maxPrice || '12.30')
  return (
    <div className="filters-panel">
      <section>
        <h3>Coleções</h3>
        <div>
          {data.collections.map((item) => (
            <button
              type="button"
              key={item.name}
              aria-pressed={search.collection === item.name}
              onClick={() => {
                update({ collection: search.collection === item.name ? '' : item.name })
              }}
            >
              <span>{item.name}</span>
              <span>({item.count})</span>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3>Faixa de preço</h3>
        <label className="sr-only" htmlFor={rangeId}>
          Preço máximo em ETH
        </label>
        <input
          id={rangeId}
          type="range"
          min="0.02"
          max="12.30"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
        <p>Preço: 0,02 - {price.replace('.', ',')} ETH</p>
        <Button onClick={() => update({ maxPrice: price })}>Aplicar</Button>
      </section>
      <section>
        <h3>Rede</h3>
        <div>
          {data.networks.map((item) => (
            <button
              type="button"
              key={item.name}
              aria-pressed={search.network === item.name}
              onClick={() => {
                update({ network: search.network === item.name ? '' : item.name })
              }}
            >
              <span>{item.name}</span>
              <span>({item.count})</span>
            </button>
          ))}
        </div>
      </section>
      <Button
        variant="ghost"
        onClick={() => {
          setPrice('12.30')
          update({
            collection: '',
            network: '',
            maxPrice: '',
            q: '',
            favorites: false,
            launches: false,
          })
        }}
      >
        Limpar filtros
      </Button>
    </div>
  )
}

export function Hero({ data }: { data: MarketplacePreview }) {
  const a = designAssets.home
  return (
    <section className="home-hero">
      <div className="hero-copy">
        <p>Bem-vindo à Kurio</p>
        <h2>
          <span className="desktop-hero-title">
            SEJA DONO DO FUTURO
            <br />
            DA ARTE DIGITAL
          </span>
          <span className="mobile-hero-title">
            SEJA DONO DA
            <br />
            CULTURA DIGITAL
          </span>
        </h2>
        <p className="hero-description">
          <span className="desktop-hero-title">
            Descubra NFTs selecionados de criadores emergentes e consagrados.
            <br />
            Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.
          </span>
          <span className="mobile-hero-title">
            Descubra NFTs selecionados de criadores do mundo todo.
          </span>
        </p>
        <Button asChild>
          <a href="#catalogo">
            EXPLORAR <span className="mobile-arrow">→</span>
          </a>
        </Button>
      </div>
      <div className="hero-art">
        <Artwork
          src={a.imgFrame136}
          alt="Emerald Ape com jaqueta verde e óculos de sol"
          width="450"
          height="450"
          sizes="(min-width: 1024px) 450px, 137px"
          fetchPriority="high"
        />
        <Artwork
          className="hero-mini"
          src={data.nfts[1]?.image}
          alt="Sage Nomad em destaque"
          width="58"
          height="58"
        />
      </div>
      <Artwork className="hero-dots desktop-dots" src={a.imgGroup4} alt="Destaque 1 de 3" />
      <Artwork
        className="hero-dots mobile-dots"
        src={designAssets['mobile-home'].imgFrame4}
        alt="Destaque 1 de 3"
      />
    </section>
  )
}

export function CatalogSurface({
  data,
  auth = false,
}: {
  data: MarketplacePreview
  auth?: boolean
}) {
  const search = validateCatalogSearch(useSearch({ strict: false }))
  const navigate = useNavigate()
  const id = useIdentity()
  const query = useQuery({ ...catalogOptions(search, id), enabled: !auth })
  const update = (patch: Partial<CatalogSearch>) => {
    const next = { ...search, ...patch, page: patch.page ?? 1 }
    if (next.favorites && id === 'guest') {
      void navigate({ to: '/login', search: { redirect: '/?favorites=true' } })
      return
    }
    void navigate({ to: '/', search: next, resetScroll: false })
  }
  const filters = query.data ?? data
  const tab = search.favorites
    ? 'Favoritos'
    : search.launches
      ? 'Novos lançamentos'
      : search.sort === 'popular'
        ? 'Em alta'
        : 'Todos os NFTs'
  const notify = usePreviewNotice()
  const nfts = auth
    ? data.authIds.flatMap((id, index) => {
        const nft = data.nfts.find((item) => item.id === id)
        return nft ? [{ ...nft, image: data.authImages[index] ?? nft.image }] : []
      })
    : (query.data?.items ?? [])
  return (
    <div className={`catalog-surface page-container ${auth ? 'auth-backdrop-content' : ''}`}>
      <div className="mobile-search">
        <label className="search-control">
          <Icon src={designAssets['mobile-home'].imgSearch} />
          <Input
            value={search.q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Explorar coleções"
            aria-label="Buscar NFTs"
          />
        </label>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button className="filter-trigger" type="button" aria-label="Abrir filtros">
              <Icon src={designAssets['mobile-home'].imgFilter} />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content className="filter-dialog">
              <Dialog.Title>Filtrar NFTs</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Combine coleção, rede e preço. Toque novamente para desmarcar.
              </Dialog.Description>
              <Dialog.Close className="dialog-close" aria-label="Fechar filtros">
                ×
              </Dialog.Close>
              <Filters key={search.maxPrice} data={filters} search={search} update={update} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      <Hero data={data} />
      <section className="catalog-section" id="catalogo" aria-label="Catálogo de NFTs">
        <aside className="catalog-sidebar">
          <Filters key={search.maxPrice} data={filters} search={search} update={update} />
          {!auth && (
            <div className="featured-banner">
              <h3>NFT EM DESTAQUE</h3>
              <p>OFERTA LIMITADA</p>
              <Link to="/nfts/$nftId" params={{ nftId: 'sage-nomad-009' }}>
                <Artwork
                  src={designAssets.home.imgNftArtwork18}
                  alt="Sage Nomad — NFT em destaque"
                  width="310"
                  height="368"
                />
              </Link>
            </div>
          )}
        </aside>
        <div className="catalog-results">
          <div className="catalog-toolbar">
            <div className="catalog-tabs" role="group" aria-label="Categorias do catálogo">
              {['Todos os NFTs', 'Novos lançamentos', 'Em alta', 'Favoritos'].map((label) => (
                <button
                  key={label}
                  type="button"
                  className={tab === label ? 'selected' : ''}
                  aria-pressed={tab === label}
                  onClick={() => {
                    update({
                      favorites: label === 'Favoritos',
                      launches: label === 'Novos lançamentos',
                      sort: label === 'Em alta' ? 'popular' : 'recent',
                    })
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="sort-control">
              Ordenar por:
              <select
                aria-label="Ordenar NFTs"
                value={search.sort}
                onChange={(event) => update({ sort: event.target.value as Sort })}
              >
                <option value="recent">Listados recentemente</option>
                <option value="price-asc">Menor preço</option>
                <option value="price-desc">Maior preço</option>
                <option value="popular">Popularidade</option>
              </select>
            </label>
          </div>
          <label className="desktop-search" id="busca">
            <span className="sr-only">Buscar NFTs</span>
            <Input
              placeholder="Buscar NFTs no catálogo"
              value={search.q}
              onChange={(event) => update({ q: event.target.value })}
            />
          </label>
          {!auth && query.isError && (
            <NetworkState pending={false} error={query.error} retry={query.refetch} />
          )}
          {!auth && query.isPending && (
            <span className="sr-only" role="status" aria-label="Carregando dados">
              Carregando NFTs…
            </span>
          )}
          <div className="catalog-grid catalog-grid-desktop" aria-busy={query.isFetching}>
            {!auth && query.isPending && <CatalogCardsSkeleton />}
            {nfts.map((nft, index) => (
              <NftCard
                key={`${nft.id}-${index}`}
                nft={nft}
                hideCaption={!auth && index === 7}
                badge={index === 2}
                favorite={!auth}
              />
            ))}
          </div>
          <div className="catalog-grid catalog-grid-mobile" aria-busy={query.isFetching}>
            {!auth && query.isPending && <CatalogCardsSkeleton />}
            {nfts.map((nft, index) => (
              <NftCard key={nft.id} nft={nft} badge={index === 2} favorite={!auth} />
            ))}
          </div>
          {!query.isPending && !query.isError && nfts.length === 0 && (
            <p className="empty-catalog" role="status">
              Nenhum NFT encontrado para esta busca.
            </p>
          )}
          <nav className="pagination" aria-label="Paginação do catálogo">
            {Array.from(
              { length: query.data?.pages ?? (auth ? 4 : 0) },
              (_, index) => index + 1,
            ).map((page) => (
              <button
                key={page}
                type="button"
                aria-current={page === search.page ? 'page' : undefined}
                onClick={() => update({ page })}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              aria-label="Próxima página"
              disabled={search.page >= (query.data?.pages ?? 1)}
              onClick={() => update({ page: search.page + 1 })}
            >
              <Icon src={designAssets.home.imgArrowRight2} />
            </button>
          </nav>
        </div>
      </section>
      {!auth && (
        <>
          <div className="promo-grid">
            <article>
              <Artwork
                src={designAssets.home.imgFrame136}
                alt="Lançamento de Emerald Ape"
                width="292"
                height="250"
              />
              <div>
                <h3>
                  Lançamentos gênesis
                  <br />
                  de edição limitada
                </h3>
                <p>
                  Colecione edições escassas diretamente dos criadores antes da revelação pública.
                </p>
                <Button asChild>
                  <Link to="/nfts/$nftId" params={{ nftId: 'emerald-ape-042' }}>
                    Explorar →
                  </Link>
                </Button>
              </div>
            </article>
            <article>
              <Artwork
                src={designAssets.home.imgNftArtwork05}
                alt="Arte digital selecionada: Ivory Baron"
                width="287"
                height="250"
              />
              <div>
                <h3>
                  Arte digital selecionada
                  <br />e muito mais
                </h3>
                <p>
                  Explore novos artistas, coleções verificadas e obras digitais que definem a
                  cultura.
                </p>
                <Button asChild>
                  <Link to="/nfts/$nftId" params={{ nftId: 'ivory-baron-088' }}>
                    Explorar →
                  </Link>
                </Button>
              </div>
            </article>
          </div>
          <section className="editorial-section">
            <h2>Diário da Cunhagem</h2>
            <p>
              Histórias, guias e insights para colecionadores sobre o universo da propriedade
              digital.
            </p>
            <div className="article-grid">
              {data.articles.map((article) => (
                <article key={article.title}>
                  <Artwork
                    src={article.image}
                    alt={article.title}
                    width="268"
                    height="195"
                    loading="lazy"
                  />
                  <div>
                    <p className="article-date">
                      {article.date} | {article.reading}
                    </p>
                    <h3>{article.title}</h3>
                    <p>{article.description}</p>
                    <button
                      type="button"
                      title="Conteúdo editorial fora do escopo"
                      onClick={() =>
                        notify(
                          'Este artigo faz parte da composição visual do Figma. Páginas editoriais estão fora do escopo.',
                        )
                      }
                    >
                      Ler mais →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export function CatalogPage() {
  return (
    <>
      <h1 className="sr-only">Kurio NFT Marketplace</h1>
      <PreviewData>{(data) => <CatalogSurface data={data} />}</PreviewData>
      <Footer />
      <div className="mobile-stage-links">
        <Link to="/system">Verificar infraestrutura</Link>
        <Link to="/order-preview">Prévia do recibo</Link>
        <p>Ambiente de demonstração · sem transações reais</p>
      </div>
    </>
  )
}
