import type { ComponentProps } from 'react'

// Only derivatives of the four original Figma portraits. Unknown/API images retain their source.
export function Artwork({
  src,
  sizes = '(min-width: 1024px) 280px, (min-width: 600px) 33vw, 50vw',
  ...props
}: ComponentProps<'img'>) {
  const match =
    typeof src === 'string' ? /^\/assets\/figma\/(8f387|83794|9add2|b7cfc)\.png$/.exec(src) : null
  const srcSet = match
    ? [320, 640, 960, 1254]
        .map((width) => `/assets/artwork/${match[1]}-${width}.webp ${width}w`)
        .join(', ')
    : undefined
  return <img src={src} srcSet={srcSet} sizes={match ? sizes : undefined} {...props} />
}
