import { useId, useState, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Icon } from '@/components/marketplace/icon'
import { designAssets } from '@/lib/design-assets'
import { usePreviewNotice } from '@/components/marketplace/preview-notice'

export function Field({
  label,
  required = false,
  className = '',
  error,
  ...props
}: ComponentProps<typeof Input> & { label: string; error?: string | undefined }) {
  const id = useId()
  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="required-mark" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <Input
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

export function PasswordField({
  label,
  placeholder,
  compact = false,
  autoComplete = 'new-password',
  error,
  ...props
}: Omit<ComponentProps<typeof Input>, 'type'> & {
  label: string
  placeholder?: string
  compact?: boolean
  autoComplete?: string
  error?: string | undefined
}) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  return (
    <div className={`form-field password-field ${compact ? 'compact-field' : ''}`}>
      <label className={compact ? 'sr-only' : ''} htmlFor={id}>
        {label}
      </label>
      <div className="password-wrap">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          <Icon src={designAssets.profile.imgHide} />
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

export function SelectField({
  label,
  children,
  required = false,
  className = '',
  error,
  ...props
}: ComponentProps<'select'> & { label: string; error?: string | undefined }) {
  const id = useId()
  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="required-mark" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        defaultValue={props.value === undefined ? '' : undefined}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

export function EnsField({ compact = false }: { compact?: boolean }) {
  return (
    <div className="ens-field">
      <SelectField
        label={compact ? 'Nome ENS' : 'Sufixo ENS'}
        defaultValue="eth"
        required={compact}
      >
        <option value="eth">.eth</option>
      </SelectField>
      {!compact && <Field label="Nome ENS" required />}
    </div>
  )
}

export function Quantity({
  value = 1,
  onChange,
  pending = false,
  max = 50,
  disabled = false,
}: {
  value?: number
  onChange?: (value: number) => void
  pending?: boolean
  max?: number
  disabled?: boolean
}) {
  const notify = usePreviewNotice()
  const change = (next: number) =>
    pending
      ? notify('Alterar quantidades do carrinho é uma ação pendente para a próxima etapa.')
      : onChange?.(Math.max(1, Math.min(max, next)))
  return (
    <div className="quantity" aria-label="Quantidade">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={disabled || value <= 1}
        onClick={() => change(value - 1)}
      >
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={disabled || value >= max}
        onClick={() => change(value + 1)}
      >
        +
      </button>
    </div>
  )
}
