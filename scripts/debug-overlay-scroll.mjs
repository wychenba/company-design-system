#!/usr/bin/env node
// Debug: TimePicker / DatePicker / Select dropdown overlay scroll behavior
// when used inside DataTable cell (cell-as-input context)

import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/overlay-scroll')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6041, r))

const browser = await chromium.launch({ headless: true })

async function probe(label, cellIdx) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 })
  await page.goto('http://localhost:6041/iframe.html?id=design-system-components-datatable-展示--inline-edit&viewMode=story', { waitUntil: 'networkidle' })
  await page.waitForSelector('[role="row"][data-row-index]')
  await page.waitForTimeout(400)

  // Click cell to open editor
  const target = await page.evaluate((cellIdx) => {
    const cell = document.querySelectorAll('[role="row"][data-row-index="0"] [role="cell"]')[cellIdx]
    if (!cell) return null
    const r = cell.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }, cellIdx)
  if (!target) { console.log(`  ❌ ${label}: cell not found`); await page.close(); return }

  await page.mouse.click(target.x, target.y)
  await page.waitForTimeout(800)

  // Inspect overlay state
  const info = await page.evaluate(() => {
    // Look for Radix portal content
    const popover = document.querySelector('[data-radix-popper-content-wrapper]')
    if (!popover) return { popover: null }
    const content = popover.querySelector('[role="dialog"]') || popover.querySelector('[data-state="open"]')
    const rect = popover.getBoundingClientRect()
    const cs = content ? window.getComputedStyle(content) : null
    return {
      popover: {
        h: Math.round(rect.height),
        w: Math.round(rect.width),
        contentH: content ? Math.round(content.getBoundingClientRect().height) : null,
        contentClasses: content?.className?.slice(0, 200),
        overflow: cs?.overflowY,
      }
    }
  })

  console.log(`${label}:`, JSON.stringify(info, null, 2))

  await page.screenshot({ path: join(OUT, `${label}.png`), fullPage: false })
  await page.close()
}

await probe('select-Category', 2)
await probe('select-Stock', 5)
await probe('multiSelect-Tags', 6)
await probe('person-Owner', 7)
await probe('date-Release', 9)
await probe('time-Reminder', 10)

await browser.close()
server.close()
