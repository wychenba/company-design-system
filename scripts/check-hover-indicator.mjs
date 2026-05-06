#!/usr/bin/env node
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, '.claude/snapshots/hover-indicator')
mkdirSync(OUT, { recursive: true })
const STATIC = join(ROOT, 'storybook-static')

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6025, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:6025/iframe.html?id=design-system-components-datatable-展示--inline-edit-interactive&viewMode=story', { waitUntil: 'networkidle' })
await page.waitForSelector('[role="row"][data-row-index]')
await page.waitForTimeout(400)

// Default: no chevron visible (opacity 0)
const defaultIndicators = await page.evaluate(() => {
  const indicators = document.querySelectorAll('[role="row"][data-row-index="0"] svg.lucide-chevron-down, [role="row"][data-row-index="0"] svg.lucide-calendar, [role="row"][data-row-index="0"] svg.lucide-clock')
  return Array.from(indicators).map(el => ({
    icon: el.getAttribute('class')?.match(/lucide-\w+/)?.[0],
    opacity: getComputedStyle(el.closest('svg') || el).opacity,
  }))
})
console.log('default (no hover):', JSON.stringify(defaultIndicators))
await page.screenshot({ path: join(OUT, 'default-no-hover.png'), clip: { x: 0, y: 0, width: 800, height: 200 } })

// Hover row 0
const row0 = page.locator('[role="row"][data-row-index="0"]').first()
const box = await row0.boundingBox()
await page.mouse.move(box.x + 200, box.y + box.height / 2)
await page.waitForTimeout(400)
const hoverIndicators = await page.evaluate(() => {
  // Find indicators in any rendered row 0 (could be multi-region)
  const indicators = document.querySelectorAll('[role="row"][data-row-index="0"] svg')
  return Array.from(indicators).filter(el => {
    const cls = el.getAttribute('class') || ''
    return cls.match(/lucide-(chevron-down|calendar|clock)/)
  }).map(el => ({
    icon: el.getAttribute('class')?.match(/lucide-\w+/)?.[0],
    opacity: getComputedStyle(el.closest('svg') || el).opacity,
  }))
})
console.log('hover row 0:', JSON.stringify(hoverIndicators))
await page.screenshot({ path: join(OUT, 'hover-reveal.png'), clip: { x: 0, y: 0, width: 800, height: 200 } })

await browser.close()
server.close()
