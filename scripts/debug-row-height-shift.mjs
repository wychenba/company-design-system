#!/usr/bin/env node
// Bug 2 visual debug: measure cell row height BEFORE vs AFTER click for all 11 cell types
// in autoRowHeight = true context. Fresh page per cell to avoid edit-state contamination.

import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/bug2-row-height-shift')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6038, r))

const browser = await chromium.launch({ headless: true })

async function probe(storyId, label, rowIdx, cellIdx) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 })
  await page.goto(`http://localhost:6038/iframe.html?id=${storyId}&viewMode=story`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[role="row"][data-row-index]')
  await page.waitForTimeout(400)

  const before = await page.evaluate(({ rowIdx, cellIdx }) => {
    const row = document.querySelector(`[role="row"][data-row-index="${rowIdx}"]`)
    const cell = row?.querySelectorAll('[role="cell"]')[cellIdx]
    if (!row || !cell) return null
    const rRect = row.getBoundingClientRect()
    const cRect = cell.getBoundingClientRect()
    return { rowH: Math.round(rRect.height), cellH: Math.round(cRect.height), cellX: cRect.x + cRect.width / 2, cellY: cRect.y + cRect.height / 2 }
  }, { rowIdx, cellIdx })
  if (!before) { console.log(`  ❌ ${label}: cell not found`); await page.close(); return }

  await page.mouse.click(before.cellX, before.cellY)
  await page.waitForTimeout(500)

  const after = await page.evaluate(({ rowIdx, cellIdx }) => {
    const row = document.querySelector(`[role="row"][data-row-index="${rowIdx}"]`)
    const cell = row?.querySelectorAll('[role="cell"]')[cellIdx]
    if (!row || !cell) return null
    const rRect = row.getBoundingClientRect()
    const cRect = cell.getBoundingClientRect()
    return { rowH: Math.round(rRect.height), cellH: Math.round(cRect.height) }
  }, { rowIdx, cellIdx })

  const rowDelta = after.rowH - before.rowH
  const cellDelta = after.cellH - before.cellH
  const status = (rowDelta === 0 && cellDelta === 0) ? '✓' : '⚠️'
  console.log(`  ${status} ${label}: row ${before.rowH}→${after.rowH}px (Δ${rowDelta}) / cell ${before.cellH}→${after.cellH}px (Δ${cellDelta})`)
  await page.close()
}

const storyAuto = 'design-system-components-datatable-展示--row-auto-height-inline-edit'
const storyFixed = 'design-system-components-datatable-展示--inline-edit'

console.log('=== autoRowHeight=true ===')
const scenarios = [
  { rowIdx: 0, cellIdx: 2, label: 'string-Product' },
  { rowIdx: 0, cellIdx: 3, label: 'string-Note(textarea)' },
  { rowIdx: 0, cellIdx: 4, label: 'currency-Price' },
  { rowIdx: 0, cellIdx: 5, label: 'category-select' },
  { rowIdx: 0, cellIdx: 6, label: 'stock-select' },
  { rowIdx: 0, cellIdx: 7, label: 'tags-multiSelect' },
  { rowIdx: 0, cellIdx: 8, label: 'owner-person' },
  { rowIdx: 0, cellIdx: 9, label: 'reviewers-multiPerson' },
  { rowIdx: 0, cellIdx: 10, label: 'release-date' },
  { rowIdx: 0, cellIdx: 11, label: 'reminder-time' },
]
for (const { rowIdx, cellIdx, label } of scenarios) {
  await probe(storyAuto, label, rowIdx, cellIdx)
}

console.log('\n=== fixed row(no autoRow)===')
for (const { rowIdx, cellIdx, label } of scenarios) {
  await probe(storyFixed, label, rowIdx, cellIdx)
}

await browser.close()
server.close()
