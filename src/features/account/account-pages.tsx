import { useRef, useState } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Field, SelectField, PasswordField } from '@/components/marketplace/forms'
import { PendingButton } from '@/components/marketplace/actions'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/marketplace/icon'
import { MobilePageHeader } from '@/components/marketplace/header'
import { NetworkState, MutationFeedback } from '@/components/marketplace/feedback'
import { fieldErrors } from '@/lib/api-error'
import {
  useIdentity,
  profileOptions,
  walletsOptions,
  useProfileMutation,
  usePasswordMutation,
  useWalletMutation,
} from '@/features/marketplace/api'
import { endSession } from '@/features/auth/session'
import { api } from '@/lib/api'
import { designAssets } from '@/lib/design-assets'
import type { Profile, ProfileInput, Wallet, WalletInput } from '@/types/api'

function AccountSidebar({ wallets = false }: { wallets?: boolean }) {
  const a = designAssets.profile
  const navigate = useNavigate()
  const router = useRouter()
  const logout = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout')
    },
    onSuccess: async () => {
      await endSession()
      await router.invalidate()
      await navigate({ to: '/' })
    },
  })
  return (
    <aside className="account-sidebar">
      <h2>Meu perfil</h2>
      <nav aria-label="Navegação da conta">
        <Link to="/orders">Meus pedidos</Link>
        <Link to="/profile" className={!wallets ? 'active' : ''}>
          <Icon src={a.imgUser} />
          Dados do perfil
        </Link>
        <Link to="/wallets" className={wallets ? 'active' : ''}>
          <Icon src={a.imgLocation} />
          Carteiras
        </Link>
        <Link to="/" search={{ favorites: true }}>
          <Icon src={a.imgHeart1} />
          Lista de interesse
        </Link>
        {[
          ['Atividade', a.imgShopping1],
          ['Ofertas', a.imgActivity],
          ['Arquivos baixados', a.imgDownload],
          ['Suporte', a.imgDangerTriangle],
        ].map(([label, icon]) =>
          label && icon ? (
            <PendingButton key={label} action={label} variant="ghost">
              <Icon src={icon} />
              {label}
            </PendingButton>
          ) : null,
        )}
        <Button
          className="account-logout"
          variant="ghost"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <Icon src={a.imgLogout1} />
          Sair
        </Button>
        <MutationFeedback error={logout.error} />
      </nav>
    </aside>
  )
}

function ProfileForm({ profile }: { profile: Profile }) {
  const [draft, setDraft] = useState<ProfileInput>({ ...profile })
  const save = useProfileMutation()
  const password = usePasswordMutation()
  const [avatarError, setAvatarError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const errors = fieldErrors(save.error)
  const passwordErrors = fieldErrors(password.error)
  const field = (key: keyof Omit<ProfileInput, 'avatar'>) => ({
    value: draft[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setDraft({ ...draft, [key]: event.target.value }),
    error: errors[key],
  })
  return (
    <section className="profile-form">
      <h1>Perfil do colecionador</h1>
      <form
        id="profile-form"
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate(draft)
        }}
      >
        <div className="form-grid">
          <Field
            label="Nome de exibição"
            required
            autoComplete="name"
            maxLength={80}
            {...field('displayName')}
          />
          <Field
            label="Nome de usuário"
            required
            autoComplete="username"
            minLength={3}
            maxLength={30}
            {...field('username')}
          />
          <Field label="E-mail" type="email" required autoComplete="email" {...field('email')} />
          <div className="ens-field">
            <SelectField label="Sufixo ENS" defaultValue="eth">
              <option value="eth">.eth</option>
            </SelectField>
            <Field label="Nome ENS" {...field('ens')} />
          </div>
          <Field label="Apelido da carteira" maxLength={50} {...field('walletNickname')} />
          <div className="avatar-field">
            <p>Avatar</p>
            <div>
              <span className="avatar-icon">
                {draft.avatar ? (
                  <img src={draft.avatar} alt="Avatar do colecionador" />
                ) : (
                  <Icon src={designAssets.profile.imgImage2} />
                )}
              </span>
              <input
                ref={input}
                type="file"
                className="sr-only"
                aria-label="Arquivo do avatar"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  setAvatarError('')
                  if (!file) return
                  if (
                    file.size > 500000 ||
                    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
                  ) {
                    setAvatarError('Use PNG, JPEG ou WebP de até 500 KB.')
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = () =>
                    setDraft((current) => ({ ...current, avatar: String(reader.result) }))
                  reader.onerror = () => setAvatarError('Não foi possível ler a imagem.')
                  reader.readAsDataURL(file)
                }}
              />
              <Button type="button" onClick={() => input.current?.click()}>
                Alterar
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDraft({ ...draft, avatar: null })
                  if (input.current) input.current.value = ''
                }}
              >
                Remover
              </Button>
            </div>
            {(avatarError || errors.avatar) && (
              <p role="alert" className="field-error">
                {avatarError || errors.avatar}
              </p>
            )}
          </div>
        </div>
        <Button type="submit" disabled={save.isPending}>
          Salvar perfil
        </Button>
        <MutationFeedback error={save.error} success={save.isSuccess && 'Perfil salvo.'} />
      </form>
      <form
        className="change-password"
        onSubmit={(event) => {
          event.preventDefault()
          const form = event.currentTarget
          const data = new FormData(form)
          password.mutate(
            {
              currentPassword: String(data.get('currentPassword')),
              password: String(data.get('password')),
              confirmPassword: String(data.get('confirmPassword')),
            },
            { onSuccess: () => form.reset() },
          )
        }}
      >
        <h2>Alterar senha</h2>
        <PasswordField
          label="Senha atual"
          name="currentPassword"
          required
          autoComplete="current-password"
          error={passwordErrors.currentPassword}
        />
        <PasswordField
          label="Nova senha"
          name="password"
          required
          minLength={8}
          error={passwordErrors.password}
        />
        <PasswordField
          label="Confirmar nova senha"
          name="confirmPassword"
          required
          minLength={8}
          error={passwordErrors.confirmPassword}
        />
        <Button type="submit" disabled={password.isPending}>
          Alterar senha
        </Button>
        <MutationFeedback
          error={password.error}
          success={password.isSuccess && 'Senha alterada.'}
        />
      </form>
    </section>
  )
}

export function ProfilePage() {
  const query = useQuery(profileOptions(useIdentity()))
  return (
    <div className="account-page page-container">
      <MobilePageHeader title="Meu perfil" />
      <div className="account-layout">
        <AccountSidebar />
        <NetworkState pending={query.isPending} error={query.error} retry={query.refetch} />
        {query.data && <ProfileForm key={query.data.id} profile={query.data} />}
      </div>
    </div>
  )
}

function WalletEditor({
  wallet,
  role,
  profile,
}: {
  wallet?: Wallet | undefined
  role: Wallet['role']
  profile: Profile
}) {
  const mutation = useWalletMutation()
  const errors = fieldErrors(mutation.error)
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const input: WalletInput = {
          role,
          name: String(data.get('name')),
          network: String(data.get('network')) as WalletInput['network'],
          address: String(data.get('address')),
          provider: String(data.get('provider')),
          displayName: String(data.get('displayName')),
          email: String(data.get('email')),
          ens: String(data.get('ens') ?? ''),
          referral: String(data.get('referral') ?? ''),
        }
        mutation.mutate(wallet ? { id: wallet.id, wallet: input } : { wallet: input })
      }}
    >
      <div className="wallet-fields form-grid">
        <Field label="Nome de exibição" value={profile.displayName} readOnly />
        <Field
          label="Apelido da carteira"
          name="name"
          required
          maxLength={50}
          defaultValue={wallet?.name ?? ''}
          error={errors.name}
        />
        <SelectField
          label="Rede"
          name="network"
          required
          defaultValue={wallet?.network ?? 'Ethereum'}
        >
          <option>Ethereum</option>
          <option>Polygon</option>
          <option>Solana</option>
        </SelectField>
        <Field
          label="Nome do perfil"
          name="displayName"
          required
          defaultValue={wallet?.displayName ?? profile.displayName}
          error={errors.displayName}
        />
        <Field
          label="Endereço da carteira"
          name="address"
          required
          defaultValue={wallet?.address ?? ''}
          placeholder="Endereço da carteira"
          error={errors.address}
        />
        <Field
          label="Função da carteira"
          value={role === 'primary' ? 'Principal' : 'Secundária'}
          readOnly
        />
        <SelectField
          label="Tipo de carteira"
          name="provider"
          required
          defaultValue={wallet?.provider ?? 'MetaMask'}
        >
          <option>MetaMask</option>
          <option>WalletConnect</option>
          <option>Coinbase</option>
        </SelectField>
        <Field label="Código de indicação" name="referral" defaultValue={wallet?.referral ?? ''} />
        <Field
          label="E-mail"
          name="email"
          type="email"
          required
          defaultValue={wallet?.email ?? profile.email}
          error={errors.email}
        />
        <div className="ens-field">
          <SelectField label="Sufixo ENS" defaultValue="eth">
            <option value="eth">.eth</option>
          </SelectField>
          <Field label="Nome ENS" name="ens" defaultValue={wallet?.ens ?? ''} error={errors.ens} />
        </div>
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        Salvar carteira {role === 'primary' ? 'principal' : 'secundária'}
      </Button>
      <MutationFeedback error={mutation.error} success={mutation.isSuccess && 'Carteira salva.'} />
    </form>
  )
}

export function WalletsPage() {
  const id = useIdentity()
  const query = useQuery(walletsOptions(id))
  const profile = useQuery(profileOptions(id))
  const [secondary, setSecondary] = useState(false)
  const primary = query.data?.find((wallet) => wallet.role === 'primary')
  const second = query.data?.find((wallet) => wallet.role === 'secondary')
  return (
    <div className="account-page wallets-page page-container">
      <MobilePageHeader title="Carteiras" back="/profile" />
      <div className="account-layout">
        <AccountSidebar wallets />
        <section className="wallets-form">
          <div className="section-title-row">
            <h1>Carteira principal</h1>
          </div>
          <p className="wallets-description">
            Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
          </p>
          <NetworkState
            pending={query.isPending || profile.isPending}
            error={query.error || profile.error}
            retry={() => {
              void query.refetch()
              void profile.refetch()
            }}
          />
          {query.data && profile.data && (
            <>
              <WalletEditor
                key={`${id}-primary`}
                wallet={primary}
                role="primary"
                profile={profile.data}
              />
              <section className="secondary-wallet">
                <div className="section-title-row">
                  <h2>Carteira secundária</h2>
                  {!secondary && !second && (
                    <Button variant="ghost" onClick={() => setSecondary(true)}>
                      Adicionar carteira secundária
                    </Button>
                  )}
                </div>
                {secondary || second ? (
                  <WalletEditor
                    key={`${id}-secondary`}
                    wallet={second}
                    role="secondary"
                    profile={profile.data}
                  />
                ) : (
                  <p>Você ainda não adicionou uma carteira secundária.</p>
                )}
              </section>
            </>
          )}
          <p className="preview-disclaimer">
            Endereços usados apenas na simulação. Nenhuma extensão ou blockchain será conectada.
          </p>
        </section>
      </div>
    </div>
  )
}
