#!/usr/bin/env node
// Reproduce: 列拖曳 × 虛擬捲動 story shows empty body
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/drag-virtual-empty')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6051, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 })
page.on('pageerror', err => console.log('PAGE ERROR:', err.message))
page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()) })

const tStart = Date.now()
await page.goto('http://localhost:6051/iframe.html?id=design-system-components-datatable-展示--row-drag-with-virtualization&viewMode=story', { waitUntil: 'networkidle' })
console.log(`Loaded in ${Date.now() - tStart}ms`)

await page.waitForTimeout(1500)

const state = await page.evaluate(() => {
  const rows = document.querySelectorAll('[role="row"][data-row-index]')
  const grid = document.querySelector('[role="grid"]')
  const errorMsg = document.body.innerText.includes('error') || document.body.innerText.includes('Error')
  return {
    mountedRows: rows.length,
    rowIds: Array.from(rows).slice(0, 5).map(r => r.getAttribute('data-sortable-row-id') || r.getAttribute('data-row-index')),
    gridPresent: !!grid,
    bodyHasErrorText: errorMsg,
    bodyTextSnippet: document.body.innerText.slice(0, 300),
  }
})
console.log('State after 1.5s:', JSON.stringify(state, null, 2))

await page.screenshot({ path: join(OUT, '01-initial-load.png'), fullPage: false })

await browser.close()
server.close()
