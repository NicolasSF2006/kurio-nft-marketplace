import { Field, SelectField, EnsField } from '@/components/marketplace/forms'
export function WalletFields({ checkout = false }: { checkout?: boolean }) {
  return (
    <div className="wallet-fields form-grid">
      <Field label="Nome de exibição" required />
      <Field label={checkout ? 'Nome de usuário' : 'Apelido da carteira'} required />
      <SelectField label="Rede" required>
        <option value="" disabled>
          Selecione uma rede
        </option>
        <option>Ethereum</option>
        <option>Polygon</option>
        <option>Solana</option>
      </SelectField>
      <Field label="Nome do perfil" required />
      <Field label="Endereço da carteira" placeholder="Endereço 0x da carteira" required />
      <Field
        label="Carteira secundária"
        className="secondary-address"
        placeholder="ENS ou carteira secundária (opcional)"
      />
      <SelectField label="Tipo de carteira" required>
        <option value="" disabled>
          Selecione uma carteira
        </option>
        <option>MetaMask</option>
        <option>WalletConnect</option>
        <option>Coinbase Wallet</option>
      </SelectField>
      <Field label="Código de indicação" required />
      <Field label="E-mail" type="email" autoComplete="email" required />
      <EnsField compact={checkout} />
    </div>
  )
}
