#!/usr/bin/env node
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, '.claude/snapshots/drag-flicker')
mkdirSync(OUT, { recursive: true })
const STATIC = join(ROOT, 'storybook-static')

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6027, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1200, height: 700 }, deviceScaleFactor: 2 })

await page.goto('http://localhost:6027/iframe.html?id=design-system-components-datatable-展示--row-drag-with-virtualization&viewMode=story', { waitUntil: 'networkidle' })
await page.waitForSelector('[role="row"][data-row-index]')
await page.waitForTimeout(500)

// Locate the scrollable center body
const scrollContainer = await page.evaluateHandle(() => {
  const candidates = document.querySelectorAll('div')
  for (const c of candidates) {
    const cs = getComputedStyle(c)
    if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && c.scrollHeight > c.clientHeight) return c
  }
  return null
})

// Hover row 0 + find drag handle (Portal-rendered, position:fixed)
const firstRow = await page.$('[role="row"][data-row-index="0"]')
const rRect = await firstRow.boundingBox()
await page.mouse.move(rRect.x + 100, rRect.y + 20)
await page.waitForTimeout(300)

let handleRect = null
const all = await page.$$('button')
for (const b of all) {
  const r = await b.boundingBox()
  if (!r) continue
  if (Math.abs(r.y + r.height / 2 - (rRect.y + rRect.height / 2)) < 5 && r.x < rRect.x + 5) {
    handleRect = r
    break
  }
}
console.log('handle rect:', handleRect)
if (!handleRect) { console.log('FAIL handle not found'); await browser.close(); server.close(); process.exit(1) }

// Inject row-mount tracker — count if data-row-index=0 row remains in DOM during scroll
await page.evaluate(() => {
  // @ts-ignore
  window.__dragRowMountedHistory = []
  const tick = () => {
    const r0 = document.querySelector('[role="row"][data-row-index="0"]')
    // @ts-ignore
    window.__dragRowMountedHistory.push(!!r0)
  }
  // @ts-ignore
  window.__tick = tick
})

// Start drag
console.log('\n=== Press handle, drag down, scroll past PRD-0045 ===')
await page.mouse.move(handleRect.x + handleRect.width / 2, handleRect.y + handleRect.height / 2)
await page.mouse.down()
await page.waitForTimeout(50)
await page.mouse.move(handleRect.x + handleRect.width / 2, handleRect.y + handleRect.height / 2 + 15, { steps: 5 })
await page.waitForTimeout(50)

// Now scroll the table body via wheel ON the table area while holding pointer
const tableEl = await page.$('[data-data-table-outer]')
const tRect = await tableEl.boundingBox()
const wheelX = tRect.x + tRect.width / 2
const wheelY = tRect.y + tRect.height / 2

// Scroll past PRD-0045 (idx 44 × 40px = 1760px scrollTop)
for (let i = 0; i < 60; i++) {
  await page.mouse.wheel(0, 50)
  await page.evaluate(() => window.__tick())
  await page.waitForTimeout(30)
}

// Inspect — is row 0 still in DOM?
const result = await page.evaluate(() => {
  const r0 = document.querySelector('[role="row"][data-row-index="0"]')
  const rect = r0?.getBoundingClientRect()
  const allIdx = Array.from(document.querySelectorAll('[role="row"][data-row-index]'))
    .map(r => Number(r.getAttribute('data-row-index')))
    .sort((a, b) => a - b)
  const minIdx = allIdx[0]
  const maxIdx = allIdx[allIdx.length - 1]
  // @ts-ignore
  const history = window.__dragRowMountedHistory
  return {
    row0InDom: !!r0,
    row0Rect: rect ? { x: rect.x, y: rect.y, w: rect.width, h: rect.height } : null,
    mountedIdxRange: [minIdx, maxIdx],
    mountedCount: allIdx.length,
    historyOnRatio: history.filter(Boolean).length / history.length,
    historyLen: history.length,
  }
})
console.log('mid-drag state:', result)

await page.screenshot({ path: join(OUT, 'mid-drag-scrolled-v4.png') })

await page.mouse.up()
await page.waitForTimeout(200)

await browser.close()
server.close()

if (!result.row0InDom) {
  console.log('\n❌ FAIL: row 0 unmounted during scroll-while-drag — flicker likely')
  process.exit(1)
} else {
  console.log(`\n✅ PASS: row 0 stayed mounted (${(result.historyOnRatio*100).toFixed(0)}% of frames)`)
}
