import { useRef } from 'react'
import { Link, useNavigate, useSearch, useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Dialog } from 'radix-ui'
import { PreviewData } from '@/components/marketplace/preview'
import { CatalogSurface } from '@/features/catalog/catalog-page'
import { Field, PasswordField } from '@/components/marketplace/forms'
import { PendingButton } from '@/components/marketplace/actions'
import { Button } from '@/components/ui/button'
import { MutationFeedback } from '@/components/marketplace/feedback'
import { fieldErrors } from '@/lib/api-error'
import { api } from '@/lib/api'
import { acceptSession, authSearch } from './session'
import type { AuthResponse, SignupInput } from '@/types/api'
import { designAssets } from '@/lib/design-assets'
import { Icon } from '@/components/marketplace/icon'

function GoogleIcon() {
  const a = designAssets.login
  return (
    <span className="google-icon" aria-hidden="true">
      <img src={a.imgVector} className="google-green" alt="" />
      <img src={a.imgVector1} className="google-green-shade" alt="" />
      <img src={a.imgGroup} className="google-yellow" alt="" />
      <img src={a.imgVector2} className="google-blue" alt="" />
      <img src={a.imgVector3} className="google-blue-shade" alt="" />
      <img src={a.imgVector4} className="google-red" alt="" />
      <img src={a.imgVector5} className="google-red-shade" alt="" />
    </span>
  )
}

function AuthPage({ signup = false }: { signup?: boolean }) {
  const navigate = useNavigate()
  const router = useRouter()
  const search = authSearch(useSearch({ strict: false }))
  const mutation = useMutation({
    mutationFn: async (input: SignupInput) =>
      (await api.post<AuthResponse>(signup ? '/auth/signup' : '/auth/login', input)).data,
    onSuccess: async (result) => {
      await acceptSession(result)
      await router.invalidate()
      await navigate({ href: search.redirect })
    },
  })
  const errors = fieldErrors(mutation.error)
  const title = useRef<HTMLHeadingElement>(null)
  return (
    <>
      <div className="auth-backdrop" aria-hidden="true">
        <PreviewData>{(data) => <CatalogSurface data={data} auth />}</PreviewData>
      </div>
      <Dialog.Root
        open
        onOpenChange={(open) => {
          if (!open) void navigate({ to: '/' })
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="auth-overlay" />
          <Dialog.Content
            className={`auth-dialog ${signup ? 'signup-dialog' : 'login-dialog'}`}
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              title.current?.focus()
            }}
          >
            <Dialog.Close className="auth-close" aria-label="Fechar formulário">
              <Icon src={designAssets.login.imgX} />
            </Dialog.Close>
            <Link to="/" className="mobile-auth-wordmark">
              KURIO
            </Link>
            <div className="auth-desktop-tabs">
              <Link to="/login" search={search} className={!signup ? 'active' : ''}>
                Entrar
              </Link>
              <span>|</span>
              <Link to="/signup" search={search} className={signup ? 'active' : ''}>
                Criar conta
              </Link>
            </div>
            <Dialog.Title ref={title} tabIndex={-1} className="auth-title">
              {signup ? 'Criar perfil de colecionador' : 'Entrar'}
            </Dialog.Title>
            <Dialog.Description className="auth-description">
              {signup
                ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
                : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}
            </Dialog.Description>
            <form
              id="auth-form"
              className="auth-form"
              onSubmit={(event) => {
                event.preventDefault()
                if (mutation.isPending) return
                const data = new FormData(event.currentTarget)
                mutation.mutate({
                  username: String(data.get('username') ?? ''),
                  email: String(data.get('email') ?? ''),
                  password: String(data.get('password') ?? ''),
                  confirmPassword: String(data.get('confirmPassword') ?? ''),
                })
              }}
            >
              {signup && (
                <Field
                  className="compact-field"
                  label="Nome de usuário"
                  placeholder="Nome de usuário"
                  autoComplete="username"
                  name="username"
                  required
                  minLength={3}
                  maxLength={30}
                  error={errors.username}
                />
              )}
              <Field
                className="compact-field"
                label="E-mail"
                type="email"
                placeholder={signup ? 'Digite seu e-mail' : 'contato@email.com'}
                autoComplete="email"
                name="email"
                required
                error={errors.email}
              />
              <PasswordField
                label="Senha"
                placeholder={signup ? 'Senha' : '***********'}
                compact
                autoComplete={signup ? 'new-password' : 'current-password'}
                name="password"
                required
                minLength={signup ? 8 : 1}
                error={errors.password}
              />
              {signup && (
                <PasswordField
                  label="Confirmar senha"
                  placeholder="Confirmar senha"
                  compact
                  name="confirmPassword"
                  required
                  error={errors.confirmPassword}
                />
              )}
              {!signup && (
                <PendingButton className="forgot-password" action="Recuperar senha" variant="ghost">
                  Esqueceu a senha?
                </PendingButton>
              )}
              <MutationFeedback error={mutation.error} />
            </form>
            <Button
              type="submit"
              form="auth-form"
              className="auth-submit"
              disabled={mutation.isPending}
            >
              <span className="desktop-auth-submit">{signup ? 'Criar conta' : 'Entrar'}</span>
              <span className="mobile-auth-submit">{signup ? 'Criar perfil' : 'Entrar'}</span>
            </Button>
            <div className="auth-social">
              <p>
                <span>Ou continue com</span>
              </p>
              <PendingButton variant="outline" action="Autenticar com Google">
                <GoogleIcon />
                Continuar com Google
              </PendingButton>
              <PendingButton variant="outline" action="Autenticar com Facebook">
                <Icon src={designAssets.login.imgFacebook1} />
                Continuar com Facebook
              </PendingButton>
            </div>
            <p className="auth-switch">
              {signup ? (
                <>
                  Já tem uma conta?{' '}
                  <Link to="/login" search={search}>
                    Entre
                  </Link>
                </>
              ) : (
                <>
                  Novo na Kurio?{' '}
                  <Link to="/signup" search={search}>
                    Crie uma conta
                  </Link>
                </>
              )}
            </p>
            {mutation.isPending && <p role="status">{signup ? 'Criando conta…' : 'Entrando…'}</p>}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

export function LoginPage() {
  return <AuthPage />
}
export function SignupPage() {
  return <AuthPage signup />
}
