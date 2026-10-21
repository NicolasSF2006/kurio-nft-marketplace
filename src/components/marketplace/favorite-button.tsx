import { useIsMutating, useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { favoritesOptions, useFavoriteMutation, useIdentity } from '@/features/marketplace/api'
import { usePreviewNotice } from './preview-notice'
import { errorMessage } from '@/lib/api-error'
import { Icon } from './icon'
import { designAssets } from '@/lib/design-assets'

export function FavoriteButton({
  nftId,
  name,
  className = '',
  compact = false,
}: {
  nftId: string
  name: string
  className?: string
  compact?: boolean
}) {
  const id = useIdentity()
  const query = useQuery(favoritesOptions(id))
  const mutation = useFavoriteMutation()
  const busy = useIsMutating({ mutationKey: ['favorite', id] }) > 0
  const selected = query.data?.includes(nftId) ?? false
  const navigate = useNavigate()
  const location = useLocation()
  const notify = usePreviewNotice()
  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      aria-label={`${selected ? 'Remover favorito' : 'Favoritar'} ${name}`}
      aria-pressed={selected}
      disabled={busy || (id !== 'guest' && query.isPending)}
      onClick={() => {
        if (id === 'guest') {
          void navigate({ to: '/login', search: { redirect: location.href } })
          return
        }
        if (query.isError) {
          void query.refetch()
          notify('Não foi possível consultar os favoritos. Tente novamente.')
          return
        }
        mutation.mutate({ nftId, selected }, { onError: (error) => notify(errorMessage(error)) })
      }}
    >
      {compact && !selected ? (
        <Icon src={designAssets['mobile-home'].imgFrame410} />
      ) : selected ? (
        '♥'
      ) : (
        '♡'
      )}
      {!compact && (selected ? ' Favoritado' : ' Favoritar')}
    </Button>
  )
}
