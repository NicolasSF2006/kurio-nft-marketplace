import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'

process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve('.cache/ms-playwright')
const temporaryDirectory = path.resolve('.cache/tmp')
await mkdir(temporaryDirectory, { recursive: true })
process.env.TEMP = temporaryDirectory
process.env.TMP = temporaryDirectory
process.env.TMPDIR = temporaryDirectory
const { chromium } = await import('@playwright/test')
const require = createRequire(import.meta.url)
const cli = require.resolve('lighthouse/cli/index.js')
const baseURL = process.env.LIGHTHOUSE_BASE_URL || 'http://127.0.0.1:4173'
const requestedProfile = process.argv[2]
if (requestedProfile && !['desktop', 'mobile'].includes(requestedProfile)) {
  throw new Error('Perfil esperado: desktop ou mobile.')
}
const profiles = requestedProfile ? [requestedProfile] : ['mobile', 'desktop']
const pages = process.argv.slice(3).length ? process.argv.slice(3) : ['/', '/nfts/emerald-ape-042']
const chromePath = chromium.executablePath()
if (!existsSync(chromePath)) throw new Error('Instale o Chromium com npm run test:install.')
await fetch(baseURL).catch(() => {
  throw new Error('Inicie npm run preview após npm run build:demo antes da auditoria.')
})

const directory = path.resolve(process.env.LIGHTHOUSE_OUTPUT_DIR || 'reports/lighthouse')
await mkdir(directory, { recursive: true })
const medians = []
const failedAttempts = []
const median = (values) => [...values].sort((a, b) => a - b)[1]

for (const profile of profiles) {
  for (const page of pages) {
    const url = new URL(page, baseURL).href
    const label = page.replace(/[^a-z0-9]/gi, '-') || 'home'
    const runs = []
    const reports = []
    for (let run = 1; run <= 3; run++) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        const filename = `${profile}-${label}-${run}${attempt === 1 ? '' : '-retry'}`
        const outputPath = path.join(directory, filename)
        try {
          await new Promise((resolve, reject) => {
            const child = spawn(
              process.execPath,
              [
                cli,
                url,
                '--config-path=./lighthouse.config.mjs',
                '--output=html',
                '--output=json',
                `--output-path=${outputPath}`,
                '--chrome-flags=--headless --no-first-run',
                '--quiet',
              ],
              {
                stdio: 'inherit',
                env: { ...process.env, CHROME_PATH: chromePath, LIGHTHOUSE_PROFILE: profile },
              },
            )
            child.on('error', reject)
            child.on('exit', (code) =>
              code === 0 ? resolve() : reject(new Error(`Lighthouse terminou com código ${code}`)),
            )
          })
          const report = JSON.parse(await readFile(`${outputPath}.report.json`, 'utf8'))
          if (report.runtimeError) throw new Error(report.runtimeError.message)
          runs.push(report)
          reports.push(`${filename}.report`)
          console.log(
            `${profile} ${page} ${run}/3: ${Object.entries(report.categories)
              .map(([id, category]) => `${id}=${Math.round(category.score * 100)}`)
              .join(' ')}`,
          )
          break
        } catch (error) {
          failedAttempts.push({
            profile,
            url,
            run,
            attempt,
            error: String(error),
            recordedAt: new Date().toISOString(),
          })
          await writeFile(
            path.join(directory, 'failed-attempts.json'),
            JSON.stringify(failedAttempts, null, 2),
          )
          if (attempt === 2) throw error
          console.error(
            `Falha de execução Lighthouse, nova instância de Chrome para ${profile} ${page} ${run}/3. Nenhuma pontuação válida é descartada.`,
          )
        }
      }
    }
    medians.push({
      profile,
      url,
      reports,
      lighthouseVersion: runs[0].lighthouseVersion,
      categories: Object.fromEntries(
        ['performance', 'accessibility', 'best-practices', 'seo'].map((category) => [
          category,
          median(runs.map((run) => run.categories[category].score * 100)),
        ]),
      ),
      metrics: Object.fromEntries(
        ['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time'].map(
          (metric) => [metric, median(runs.map((run) => run.audits[metric].numericValue))],
        ),
      ),
      configSettings: runs[0].configSettings,
      environment: runs[0].environment,
      runWarnings: runs.flatMap((run) => run.runWarnings ?? []),
      externalOrigins: [
        ...new Set(
          runs.flatMap((run) =>
            (run.audits['network-requests'].details?.items ?? [])
              .map((request) => {
                try {
                  return new URL(request.url).origin
                } catch {
                  return null
                }
              })
              .filter((origin) => origin && origin !== new URL(baseURL).origin),
          ),
        ),
      ],
    })
  }
}

const result = {
  recordedAt: new Date().toISOString(),
  node: process.version,
  os: `${os.platform()} ${os.release()} ${os.arch()}`,
  cpu: os.cpus()[0]?.model,
  memoryBytes: os.totalmem(),
  chromePath,
  conditions:
    'Build de demonstração, cenário default; três medições sequenciais por página e perfil; contexto Chrome novo em cada execução; armazenamento reiniciado pelo Lighthouse; sem bloqueio de origens ou auditorias omitidas.',
  failedAttempts,
  medians,
}
await writeFile(path.join(directory, 'summary.json'), JSON.stringify(result, null, 2))
console.log(`Resumo: ${path.join(directory, 'summary.json')}`)
