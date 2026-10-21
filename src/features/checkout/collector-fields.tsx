import { Field, SelectField } from '@/components/marketplace/forms'
import type { Wallet, Network } from '@/types/api'
import type { Collector } from '@/types/orders'

export function CollectorFields({
  collector,
  onChange,
  wallet,
  network,
  onNetwork,
  errors,
  locked = false,
}: {
  collector: Collector
  onChange: (input: Collector) => void
  wallet: Wallet | undefined
  network: Network
  onNetwork: (value: Network) => void
  errors: Record<string, string>
  locked?: boolean
}) {
  return (
    <div className="wallet-fields form-grid">
      <Field
        label="Nome de exibição"
        value={collector.displayName}
        onChange={(event) => onChange({ ...collector, displayName: event.target.value })}
        required
        error={errors.displayName}
        disabled={locked}
      />
      <Field
        label="Nome de usuário"
        value={collector.username}
        onChange={(event) => onChange({ ...collector, username: event.target.value })}
        required
        error={errors.username}
        disabled={locked}
      />
      <SelectField
        label="Rede"
        error={errors.network}
        value={network}
        onChange={(event) => onNetwork(event.target.value as Network)}
        disabled={locked}
        required
      >
        <option>Ethereum</option>
        <option>Polygon</option>
        <option>Solana</option>
      </SelectField>
      <Field label="Nome do perfil" value={collector.displayName} readOnly />
      <Field
        label="Endereço da carteira"
        value={wallet?.address ?? ''}
        readOnly
        placeholder="Selecione uma carteira cadastrada"
      />
      <Field
        label="Carteira secundária"
        className="secondary-address"
        value=""
        readOnly
        placeholder="Opcional"
      />
      <SelectField label="Tipo de carteira" value={wallet?.provider ?? ''} disabled>
        <option value="">Selecione uma carteira</option>
        <option>MetaMask</option>
        <option>WalletConnect</option>
        <option>Coinbase</option>
      </SelectField>
      <Field label="Código de indicação" value={wallet?.referral ?? ''} readOnly />
      <Field
        label="E-mail"
        value={collector.email}
        type="email"
        onChange={(event) => onChange({ ...collector, email: event.target.value })}
        required
        error={errors.email}
        disabled={locked}
      />
      <div className="ens-field">
        <SelectField label="Nome ENS" defaultValue="eth">
          <option value="eth">.eth</option>
        </SelectField>
        <Field
          label="Nome ENS do colecionador"
          value={collector.ens}
          onChange={(event) => onChange({ ...collector, ens: event.target.value })}
          error={errors.ens}
          disabled={locked}
        />
      </div>
    </div>
  )
}
