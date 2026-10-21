import wawoff2 from 'wawoff2'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const source = 'public/fonts/roboto-mono-variable.ttf'
const output = 'public/fonts/roboto-mono-variable.woff2'
const original = await readFile(source)
const compressed = Buffer.from(await wawoff2.compress(original))
await writeFile(output, compressed)
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const result = {
  source,
  output,
  originalBytes: original.length,
  compressedBytes: compressed.length,
  sourceSha256: sha256(original),
  outputSha256: sha256(compressed),
  tool: 'wawoff2 2.0.1 (Google WOFF2/WebAssembly)',
  conditions:
    'Full variable font compression; no glyph subsetting or changes to weight/style. Original TTF and OFL preserved.',
}
await writeFile('docs/optimized-font.json', JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
