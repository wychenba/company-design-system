#!/usr/bin/env node
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/time-picker-cell')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6042, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 2400, height: 800 }, deviceScaleFactor: 2 }) // wider to show all columns
await page.goto('http://localhost:6042/iframe.html?id=design-system-components-datatable-展示--inline-edit&viewMode=story', { waitUntil: 'networkidle' })
await page.waitForSelector('[role="row"][data-row-index]')
await page.waitForTimeout(400)

// Find Reminder (time) cell - last column
const target = await page.evaluate(() => {
  const cells = document.querySelectorAll('[role="row"][data-row-index="0"] [role="cell"]')
  console.log('cell count:', cells.length)
  // last cell should be reminderTime
  const lastCell = cells[cells.length - 1]
  if (!lastCell) return null
  lastCell.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' })
  const r = lastCell.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, idx: cells.length - 1 }
})
console.log('Time cell target:', target)

if (target) {
  await page.mouse.click(target.x, target.y)
  await page.waitForTimeout(800)
  await page.screenshot({ path: join(OUT, '01-time-overlay.png'), fullPage: false })

  const overlay = await page.evaluate(() => {
    const popper = document.querySelector('[data-radix-popper-content-wrapper]')
    if (!popper) return { popover: null }
    const rect = popper.getBoundingClientRect()
    const content = popper.firstElementChild
    const cs = content ? window.getComputedStyle(content) : null
    return {
      popoverH: Math.round(rect.height),
      popoverW: Math.round(rect.width),
      contentClass: content?.className?.slice(0, 250),
      contentHtml: content?.innerHTML?.slice(0, 500),
      contentH: content ? Math.round(content.getBoundingClientRect().height) : null,
      overflow: cs?.overflowY,
    }
  })
  console.log('Overlay:', JSON.stringify(overlay, null, 2))
}

await browser.close()
server.close()
