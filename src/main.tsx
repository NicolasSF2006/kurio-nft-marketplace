import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { AppProviders } from '@/app/providers'
import { initializeNetwork } from '@/app/bootstrap'
import '@/app/styles.css'

async function bootstrap() {
  await initializeNetwork()
  const { router } = await import('@/app/router')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  )
}

void bootstrap().catch((error: unknown) => {
  console.error('Falha na inicialização do Kurio:', error)
  const root = document.getElementById('root')
  if (root) {
    root.setAttribute('role', 'alert')
    const title = document.createElement('h1')
    title.textContent = 'Não foi possível iniciar o Kurio'
    const description = document.createElement('p')
    description.textContent = 'Confira a configuração de ambiente e recarregue a página.'
    root.replaceChildren(title, description)
  }
})
