import { useState, type ComponentProps, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { NoticeContext, usePreviewNotice } from '@/components/marketplace/preview-notice'

export function PreviewActionsProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState('')
  return (
    <NoticeContext.Provider value={setNotice}>
      {children}
      <div className="preview-toast" role="status" aria-live="polite">
        {notice && (
          <>
            <span>{notice}</span>
            <button type="button" aria-label="Fechar aviso" onClick={() => setNotice('')}>
              ×
            </button>
          </>
        )}
      </div>
    </NoticeContext.Provider>
  )
}

export function PendingButton({
  children,
  action,
  ...props
}: ComponentProps<typeof Button> & { action: string }) {
  const notify = usePreviewNotice()
  return (
    <Button
      type="button"
      {...props}
      title={`${action}: fora do escopo do desafio`}
      onClick={() => notify(`${action} está fora do escopo deste desafio.`)}
    >
      {children}
    </Button>
  )
}

export function PreviewDisclaimer({ children }: { children?: ReactNode }) {
  return (
    <p id="preview-notice" className="preview-disclaimer">
      {children ?? 'Demonstração com dados simulados. Nenhuma transação real é realizada.'}
    </p>
  )
}
