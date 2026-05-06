#!/usr/bin/env node
// Verify virtual scrolling: only viewport rows in DOM, scroll changes mounted set
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/virtual-scroll')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6045, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 1 })

// Story uses 10k rows
const tStart = Date.now()
await page.goto('http://localhost:6045/iframe.html?id=design-system-components-datatable-展示--virtual-scroll&viewMode=story', { waitUntil: 'networkidle' })
const initialLoad = Date.now() - tStart
console.log(`Initial load: ${initialLoad}ms`)

await page.waitForSelector('[role="row"][data-row-index]')
await page.waitForTimeout(500)

const initial = await page.evaluate(() => {
  const rows = document.querySelectorAll('[role="row"][data-row-index]')
  const indexes = Array.from(rows).map(r => parseInt(r.getAttribute('data-row-index') || '0', 10))
  const scroller = document.querySelector('[data-table-body], [role="grid"] > div, .overflow-y-auto')
  return {
    mountedRowCount: rows.length,
    minIndex: Math.min(...indexes),
    maxIndex: Math.max(...indexes),
    totalDataRows: 10000,
    scrollerScrollHeight: scroller?.scrollHeight,
  }
})
console.log('Initial:', JSON.stringify(initial, null, 2))

// Scroll to middle (5000)
await page.evaluate(() => {
  const rowZero = document.querySelector('[role="row"][data-row-index="0"]')
  const scroller = rowZero?.closest('[style*="overflow"]') || rowZero?.parentElement?.parentElement
  let s = rowZero
  while (s && s.scrollHeight <= s.clientHeight) s = s.parentElement
  if (s) s.scrollTop = s.scrollHeight / 2
})
await page.waitForTimeout(500)

const middle = await page.evaluate(() => {
  const rows = document.querySelectorAll('[role="row"][data-row-index]')
  const indexes = Array.from(rows).map(r => parseInt(r.getAttribute('data-row-index') || '0', 10))
  return {
    mountedRowCount: rows.length,
    minIndex: Math.min(...indexes),
    maxIndex: Math.max(...indexes),
  }
})
console.log('After scroll to middle:', JSON.stringify(middle, null, 2))

// Scroll to end
await page.evaluate(() => {
  const rowZero = document.querySelector('[role="row"][data-row-index="0"]') ||
                  document.querySelector('[role="row"][data-row-index]')
  let s = rowZero
  while (s && s.scrollHeight <= s.clientHeight) s = s.parentElement
  if (s) s.scrollTop = s.scrollHeight
})
await page.waitForTimeout(500)

const end = await page.evaluate(() => {
  const rows = document.querySelectorAll('[role="row"][data-row-index]')
  const indexes = Array.from(rows).map(r => parseInt(r.getAttribute('data-row-index') || '0', 10))
  return {
    mountedRowCount: rows.length,
    minIndex: Math.min(...indexes),
    maxIndex: Math.max(...indexes),
  }
})
console.log('After scroll to end:', JSON.stringify(end, null, 2))

await page.screenshot({ path: join(OUT, 'end.png') })
await browser.close()
server.close()

const totalMounted = initial.mountedRowCount
const expectedVirtual = totalMounted < 100  // virtualization should show <100 rows for 10k data
console.log(`\n${expectedVirtual ? '✅' : '❌'} Virtualization: ${totalMounted} mounted of 10000 (expect <100)`)
