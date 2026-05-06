#!/usr/bin/env node
// v12 visual confirmation: all 4 edges 1px clean (no 2px seam)
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/v12-seam-fix')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6056, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 700 }, deviceScaleFactor: 4 })

await page.goto('http://localhost:6056/iframe.html?id=design-system-components-datatable-展示--inline-edit&viewMode=story', { waitUntil: 'networkidle' })
await page.waitForSelector('[role="row"][data-row-index]')
await page.waitForTimeout(500)

// Click Stock cell row 1
const target = await page.evaluate(() => {
  const cells = document.querySelectorAll('[role="row"][data-row-index="1"] [role="cell"]')
  const cell = cells[5]
  if (!cell) return null
  const r = cell.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
})
await page.mouse.click(target.x, target.y)
await page.waitForTimeout(700)

// Pixel sample at the 4 expected border positions to confirm color
const colorSample = await page.evaluate(() => {
  const cells = document.querySelectorAll('[role="row"][data-row-index="1"] [role="cell"]')
  const cell = cells[5]
  if (!cell) return null
  const r = cell.getBoundingClientRect()
  const field = cell.querySelector('[data-field-mode="edit"]')
  if (!field) return null
  const fr = field.getBoundingClientRect()
  const fcs = window.getComputedStyle(field)
  return {
    cellRect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height },
    fieldRect: { left: fr.left, top: fr.top, right: fr.right, bottom: fr.bottom, w: fr.width, h: fr.height },
    fieldComputed: {
      position: fcs.position,
      borderTopColor: fcs.borderTopColor,
      borderRightColor: fcs.borderRightColor,
      borderBottomColor: fcs.borderBottomColor,
      borderLeftColor: fcs.borderLeftColor,
      borderTopWidth: fcs.borderTopWidth,
      borderRightWidth: fcs.borderRightWidth,
      borderBottomWidth: fcs.borderBottomWidth,
      borderLeftWidth: fcs.borderLeftWidth,
      zIndex: fcs.zIndex,
      visibility: fcs.visibility,
      opacity: fcs.opacity,
    },
    fieldDataState: field.getAttribute('data-state'),
    fieldClass: field.className,
  }
})
console.log('Color sample:', JSON.stringify(colorSample, null, 2))

// Zoom in screenshot focused on the editing cell with all 4 edges visible — capture wider area
// Wider screenshot capturing editing cell with all 4 grid divider neighbors visible
await page.screenshot({
  path: join(OUT, 'v12-stock-cell-open.png'),
  clip: {
    x: Math.max(0, target.x - 250),
    y: Math.max(0, target.y - 100),
    width: 500,
    height: 200,
  },
})

// Pixel inspection: read color at expected border positions
const bordersAt = await page.evaluate((t) => {
  // Get cell rect via DOM
  const cells = document.querySelectorAll('[role="row"][data-row-index="1"] [role="cell"]')
  const cell = cells[5]
  const r = cell.getBoundingClientRect()
  // Use canvas to sample colors from screenshot? Not feasible cross-context.
  // Instead just return cell + Field rect for visual lookup
  return {
    cellRect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom },
    cellViewport: { centerX: t.x, centerY: t.y },
  }
}, target)
console.log('Border lookup hints:', JSON.stringify(bordersAt))

console.log('Screenshot saved')
await browser.close()
server.close()
