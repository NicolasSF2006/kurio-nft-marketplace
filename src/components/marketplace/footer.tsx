import { Link } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { usePreviewNotice } from '@/components/marketplace/preview-notice'
import { Icon } from '@/components/marketplace/icon'
import { designAssets } from '@/lib/design-assets'

export function Footer() {
  const notify = usePreviewNotice()
  const auxiliary = (label: string) => (
    <button
      type="button"
      key={label}
      title="Conteúdo fora do escopo"
      onClick={() => notify(`${label}: conteúdo fora do escopo do desafio.`)}
    >
      {label}
    </button>
  )
  return (
    <footer className="site-footer page-container">
      <div className="footer-features">
        <div>
          <span className="footer-medallion">W</span>
          <h3>Segurança da carteira</h3>
          <p>Proteja sua carteira e colecione arte digital verificada com confiança.</p>
        </div>
        <div>
          <span className="footer-medallion">C</span>
          <h3>Criadores em destaque</h3>
          <p>Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.</p>
        </div>
        <div>
          <span className="footer-medallion">D</span>
          <h3>Alertas de lançamentos</h3>
          <p>
            Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.
          </p>
        </div>
        <div className="footer-newsletter">
          <h3>Antecipe-se ao próximo lançamento</h3>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              notify('A inscrição na newsletter está fora do escopo desta entrega.')
            }}
          >
            <label className="sr-only" htmlFor="newsletter-email">
              E-mail para newsletter
            </label>
            <Input id="newsletter-email" type="email" placeholder="digite seu e-mail..." required />
            <Button type="submit">Enviar</Button>
          </form>
          <p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p>
        </div>
      </div>
      <div className="footer-brand">
        <Link to="/" className="wordmark">
          KURIO
        </Link>
        <p>
          Feito para colecionadores,
          <br />
          criadores e cultura
        </p>
        <a href="mailto:contato@email.com">contato@email.com</a>
        <a href="tel:+551140028922">+55 11 4002 8922</a>
      </div>
      <div className="footer-links">
        <div>
          <h3>Meu perfil</h3>
          <Link to="/profile">Meu perfil</Link>
          <Link to="/" search={{ favorites: true }}>
            Lista de interesse
          </Link>
          {['Minha coleção', 'Atividade', 'Estúdio do criador'].map(auxiliary)}
        </div>
        <div>
          <h3>Central de ajuda</h3>
          {[
            'Central de ajuda',
            'Como comprar NFTs',
            'Carteira e segurança',
            'Política do mercado',
            'Denunciar item',
          ].map(auxiliary)}
        </div>
        <div>
          <h3>Coleções</h3>
          {['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'].map((collection) => (
            <Link key={collection} to="/" search={{ collection }}>
              {collection}
            </Link>
          ))}
        </div>
        <div>
          <h3>Redes sociais</h3>
          <div className="social-icons">
            {[
              designAssets.home.imgFrame108,
              designAssets.home.imgFrame109,
              designAssets.home.imgFrame110,
              designAssets.home.imgFrame111,
              designAssets.home.imgFrame112,
            ].map((src, i) => (
              <button
                type="button"
                key={src}
                aria-label={`${['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube'][i]} — fora do escopo`}
                onClick={() =>
                  notify('Os canais sociais desta marca de demonstração não estão disponíveis.')
                }
              >
                <Icon src={src} />
              </button>
            ))}
          </div>
          <h3>Carteiras compatíveis</h3>
          <Link to="/wallets" className="wallet-brands">
            METAMASK · WALLETCONNECT · COINBASE
          </Link>
        </div>
      </div>
      <p className="copyright">© 2026 Kurio. Propriedade digital para todos.</p>
      <div className="preview-links">
        <Link to="/system">Verificar infraestrutura</Link>
        <Link to="/order-preview">Prévia do recibo</Link>
        <Link to="/wallets">Carteiras</Link>
        <span>Demonstração · sem transações reais</span>
      </div>
    </footer>
  )
}
