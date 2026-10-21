import sharp from 'sharp'
import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'

const originals = ['8f387', '83794', '9add2', 'b7cfc']
const widths = [320, 640, 960, 1254]
await mkdir('public/assets/artwork', { recursive: true })
const manifest = []
for (const id of originals) {
  const source = `public/assets/figma/${id}.png`
  const original = await readFile(source)
  const variants = []
  for (const width of widths) {
    const output = `public/assets/artwork/${id}-${width}.webp`
    await sharp(original)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 90, effort: 6 })
      .toFile(output)
    variants.push({ width, path: output, bytes: (await stat(output)).size })
  }
  manifest.push({
    source,
    sha256: createHash('sha256').update(original).digest('hex'),
    bytes: original.length,
    variants,
  })
}
await writeFile(
  'docs/optimized-assets.json',
  JSON.stringify(
    { tool: 'sharp 0.35.5', format: 'WebP quality 90, effort 6; original PNG preserved', manifest },
    null,
    2,
  ) + '\n',
)
console.log(
  JSON.stringify(
    manifest.map(({ source, bytes, variants }) => ({
      source,
      originalBytes: bytes,
      largestWebP: variants.at(-1).bytes,
    })),
    null,
    2,
  ),
)
