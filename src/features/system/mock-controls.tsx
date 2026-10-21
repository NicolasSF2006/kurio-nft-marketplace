import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { mockScenarioNames, type ScenarioName } from '@/types/api'
import { SelectField } from '@/components/marketplace/forms'
import { Button } from '@/components/ui/button'
import { MutationFeedback } from '@/components/marketplace/feedback'
import { env } from '@/app/env'
import { mockActions, type MockAction } from '@/types/orders'

export function MockControls() {
  const [name, setName] = useState<ScenarioName>('default')
  const [action, setAction] = useState<MockAction>('price-up')
  const router = useRouter()
  const mutation = useMutation({
    mutationFn: async (operation: 'scenario' | 'reset' | 'expire' | 'event') => {
      if (!window.kurioMocks) throw new Error('Mocks não estão ativos.')
      if (operation === 'reset') await window.kurioMocks.reset(name)
      else if (operation === 'expire') await window.kurioMocks.expireSession()
      else if (operation === 'event') {
        await window.kurioMocks.action(action)
        return
      } else await window.kurioMocks.scenario(name)
      await router.invalidate()
    },
  })
  if (!env.mocksEnabled) return null
  return (
    <section className="mock-controls">
      <h2>Cenários da demonstração</h2>
      <p>
        O reset restaura as duas contas e limpa carrinhos, favoritos, perfis e carteiras. A
        alteração de cenário preserva os dados.
      </p>
      <SelectField
        label="Cenário MSW"
        value={name}
        onChange={(event) => setName(event.target.value as ScenarioName)}
      >
        {mockScenarioNames.map((name) => (
          <option key={name}>{name}</option>
        ))}
      </SelectField>
      <div>
        <Button disabled={mutation.isPending} onClick={() => mutation.mutate('scenario')}>
          Aplicar cenário
        </Button>
        <Button
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate('reset')}
        >
          Restaurar estado inicial
        </Button>
        <Button
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate('expire')}
        >
          Expirar sessão
        </Button>
      </div>
      <SelectField
        label="Ação de tempo real"
        value={action}
        onChange={(event) => setAction(event.target.value as MockAction)}
      >
        {mockActions.map((action) => (
          <option key={action}>{action}</option>
        ))}
      </SelectField>
      <Button disabled={mutation.isPending} onClick={() => mutation.mutate('event')}>
        Disparar ação simulada
      </Button>
      <MutationFeedback
        error={mutation.error}
        success={mutation.isSuccess && 'Cenário atualizado.'}
      />
    </section>
  )
}
