import { spawn } from 'node:child_process'
import path from 'node:path'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'

const require = createRequire(import.meta.url)
const args = process.argv.slice(2)
const temporaryDirectory = path.resolve('.cache/tmp')
mkdirSync(temporaryDirectory, { recursive: true })
const demo = args[0] === 'demo'
if (demo) args.shift()
const child = spawn(process.execPath, [require.resolve('@playwright/test/cli'), ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PLAYWRIGHT_BROWSERS_PATH: path.resolve('.cache/ms-playwright'),
    TEMP: temporaryDirectory,
    TMP: temporaryDirectory,
    TMPDIR: temporaryDirectory,
    ...(demo ? { E2E_MODE: 'demo' } : {}),
  },
})
child.on('error', (error) => { console.error(error); process.exitCode = 1 })
child.on('exit', (code) => { process.exitCode = code ?? 1 })
