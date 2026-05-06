#!/usr/bin/env node
// User report: drag×virtual broken AFTER scroll (not on initial). Test scroll-to-100+
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/drag-virtual-scroll-deep')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6052, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 })
page.on('pageerror', err => console.log('PAGE ERROR:', err.message))

await page.goto('http://localhost:6052/iframe.html?id=design-system-components-datatable-展示--row-drag-with-virtualization&viewMode=story', { waitUntil: 'networkidle' })
await page.waitForSelector('[role="row"][data-row-index]')
await page.waitForTimeout(500)

// Find the scroller element
const scrollerInfo = await page.evaluate(() => {
  const row = document.querySelector('[role="row"][data-row-index="0"]')
  let s = row
  while (s && s.scrollHeight <= s.clientHeight) s = s.parentElement
  return s ? { tag: s.tagName, scrollHeight: s.scrollHeight, clientHeight: s.clientHeight } : null
})
console.log('Scroller found:', scrollerInfo)

// Scroll progressively and capture state at each checkpoint
const checkpoints = [0, 1000, 2500, 4000, 6000]
for (const scrollTop of checkpoints) {
  await page.evaluate((y) => {
    const row = document.querySelector('[role="row"][data-row-index]')
    let s = row
    while (s && s.scrollHeight <= s.clientHeight) s = s.parentElement
    if (s) s.scrollTop = y
  }, scrollTop)
  await page.waitForTimeout(600)

  const state = await page.evaluate(() => {
    const rows = document.querySelectorAll('[role="row"][data-row-index]')
    const indexes = Array.from(rows).map(r => parseInt(r.getAttribute('data-row-index') || '0', 10))
    return {
      mountedCount: rows.length,
      minIdx: indexes.length ? Math.min(...indexes) : null,
      maxIdx: indexes.length ? Math.max(...indexes) : null,
      empty: rows.length === 0,
    }
  })
  console.log(`scrollTop=${scrollTop}:`, JSON.stringify(state))
  await page.screenshot({ path: join(OUT, `scroll-${scrollTop}.png`), fullPage: false })
}

// Now test: drag at row that's currently visible, then scroll the source out
console.log('\n=== Drag while scrolling test ===')
// Reset to top
await page.evaluate(() => {
  const row = document.querySelector('[role="row"][data-row-index]')
  let s = row
  while (s && s.scrollHeight <= s.clientHeight) s = s.parentElement
  if (s) s.scrollTop = 0
})
await page.waitForTimeout(400)

// Hover row 0 to reveal handle
const row0Box = await page.evaluate(() => {
  const r = document.querySelector('[role="row"][data-row-index="0"]')?.getBoundingClientRect()
  return r ? { x: r.x + 100, y: r.y + r.height / 2 } : null
})
await page.mouse.move(row0Box.x, row0Box.y)
await page.waitForTimeout(400)

const handleBox = await page.evaluate(() => {
  const handle = document.querySelector('button[aria-label*="拖曳"]')
  if (!handle) return null
  const r = handle.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
})

if (!handleBox) {
  console.log('No handle found')
  await browser.close(); server.close(); process.exit(0)
}

await page.mouse.move(handleBox.x, handleBox.y)
await page.mouse.down()
await page.mouse.move(handleBox.x, handleBox.y + 30, { steps: 5 })
await page.waitForTimeout(200)

// Scroll while dragging — push source out far
for (const target of [1500, 3000, 5000, 7000]) {
  await page.evaluate((y) => {
    const row = document.querySelector('[role="row"][data-row-index]')
    let s = row
    while (s && s.scrollHeight <= s.clientHeight) s = s.parentElement
    if (s) s.scrollTop = y
  }, target)
  await page.waitForTimeout(500)
  const state = await page.evaluate(() => {
    const rows = document.querySelectorAll('[role="row"][data-row-index]')
    const indexes = Array.from(rows).map(r => parseInt(r.getAttribute('data-row-index') || '0', 10))
    const overlay = document.querySelector('[id^="DndDescribedBy"]')
    return {
      mountedCount: rows.length,
      minIdx: indexes.length ? Math.min(...indexes) : null,
      maxIdx: indexes.length ? Math.max(...indexes) : null,
      empty: rows.length === 0,
    }
  })
  console.log(`drag+scroll to ${target}:`, JSON.stringify(state))
  await page.screenshot({ path: join(OUT, `drag-scroll-${target}.png`), fullPage: false })
}

await page.mouse.up()
await browser.close()
server.close()
