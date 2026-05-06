#!/usr/bin/env node
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/bug2-number')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6039, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:6039/iframe.html?id=design-system-components-datatable-展示--row-auto-height-inline-edit&viewMode=story', { waitUntil: 'networkidle' })
await page.waitForSelector('[role="row"][data-row-index]')
await page.waitForTimeout(500)

await page.screenshot({ path: join(OUT, '01-before.png'), clip: { x: 0, y: 60, width: 1400, height: 200 } })

// Find Qty cell (number, idx=3 in row 1)
const target = await page.evaluate(() => {
  const cell = document.querySelectorAll('[role="row"][data-row-index="0"] [role="cell"]')[3]
  if (!cell) return null
  const r = cell.getBoundingClientRect()
  // Inspect cell content DOM
  const fieldDiv = cell.querySelector('[data-field-mode]')
  const input = cell.querySelector('input')
  return {
    cellH: Math.round(r.height),
    cellW: Math.round(r.width),
    cellX: r.x + r.width / 2,
    cellY: r.y + r.height / 2,
    fieldMode: fieldDiv?.getAttribute('data-field-mode'),
    fieldClass: fieldDiv?.className,
    fieldOuterHTML: fieldDiv?.outerHTML?.slice(0, 500),
    inputType: input?.type,
  }
})
console.log('BEFORE:', JSON.stringify(target, null, 2))

if (target) {
  await page.mouse.click(target.cellX, target.cellY)
  await page.waitForTimeout(700)
}

await page.screenshot({ path: join(OUT, '02-after-click.png'), clip: { x: 0, y: 60, width: 1400, height: 200 } })

const after = await page.evaluate(() => {
  const cell = document.querySelectorAll('[role="row"][data-row-index="0"] [role="cell"]')[3]
  if (!cell) return null
  const r = cell.getBoundingClientRect()
  const fieldDiv = cell.querySelector('[data-field-mode]')
  const input = cell.querySelector('input,textarea')
  const inputRect = input?.getBoundingClientRect()
  const cs = window.getComputedStyle(cell)
  const fieldCs = fieldDiv ? window.getComputedStyle(fieldDiv) : null
  const allChildren = Array.from(cell.children).map(c => {
    const r = c.getBoundingClientRect()
    return {
      tag: c.tagName,
      role: c.getAttribute('role'),
      h: Math.round(r.height),
      class: c.className?.slice(0, 80),
      innerHTML: c.innerHTML?.slice(0, 200),
    }
  })
  return {
    children: allChildren,
    cellH: Math.round(r.height),
    cellPadding: { top: cs.paddingTop, bottom: cs.paddingBottom },
    cellBorder: { top: cs.borderTopWidth, bottom: cs.borderBottomWidth },
    cellBoxSizing: cs.boxSizing,
    fieldMode: fieldDiv?.getAttribute('data-field-mode'),
    inputTag: input?.tagName,
    inputH: inputRect ? Math.round(inputRect.height) : null,
    inputPadding: fieldCs ? { top: fieldCs.paddingTop, bottom: fieldCs.paddingBottom } : null,
    inputBorder: fieldCs ? { top: fieldCs.borderTopWidth, bottom: fieldCs.borderBottomWidth } : null,
    inputBoxSizing: fieldCs?.boxSizing,
    inputLineHeight: fieldCs?.lineHeight,
  }
})
console.log('AFTER click:', JSON.stringify(after, null, 2))

await browser.close()
server.close()
