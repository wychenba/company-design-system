#!/usr/bin/env node
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, '.claude/snapshots/divider-check')
mkdirSync(OUT, { recursive: true })
const STATIC = join(ROOT, 'storybook-static')

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6026, r))

const browser = await chromium.launch({ headless: true })

const STORIES = [
  { id: 'design-system-components-datatable-展示--inline-edit-interactive', label: 'inline-edit-autoRowHeight', mode: 'autoRowHeight' },
  { id: 'design-system-components-datatable-展示--column-types', label: 'column-types-fixed', mode: 'fixed' },
  { id: 'design-system-components-datatable-展示--row-auto-height', label: 'row-auto-height', mode: 'autoRowHeight' },
]

for (const story of STORIES) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 800 }, deviceScaleFactor: 2 })
  await page.goto(`http://localhost:6026/iframe.html?id=${story.id}&viewMode=story`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[role="row"][data-row-index]')
  await page.waitForTimeout(400)

  const result = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('[role="row"][data-row-index]')).slice(0, 3)
    return rows.map((row, ri) => {
      const cells = Array.from(row.querySelectorAll('[role="cell"]'))
      const rowH = row.getBoundingClientRect().height
      return {
        rowIndex: ri,
        rowHeight: rowH,
        cells: cells.map((cell, i) => {
          const r = cell.getBoundingClientRect()
          const inner = cell.querySelector('[class*="truncate"], .truncate')
          return {
            i, text: cell.textContent?.slice(0, 18), w: r.width, h: r.height,
            stretchOK: Math.abs(r.height - rowH) < 0.5,
            hasTruncate: !!inner,
          }
        }),
      }
    })
  })

  console.log(`\n=== ${story.label} (${story.mode}) ===`)
  for (const row of result) {
    const heights = row.cells.map(c => c.h).join(',')
    const allStretch = row.cells.every(c => c.stretchOK)
    console.log(`row ${row.rowIndex} h=${row.rowHeight} cells=[${heights}] stretchOK=${allStretch}`)
  }

  await page.screenshot({ path: join(OUT, `${story.label}.png`), clip: { x: 0, y: 0, width: 1500, height: 400 } })
  await page.close()
}

await browser.close()
server.close()
