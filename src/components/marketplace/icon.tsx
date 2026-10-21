import { cn } from '@/lib/utils'

// SVGs retain their exported intrinsic dimensions. Wrappers position them without redrawing paths.
export function Icon({ src, className = '' }: { src: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('design-icon', className)}>
      <img src={src} alt="" />
    </span>
  )
}
