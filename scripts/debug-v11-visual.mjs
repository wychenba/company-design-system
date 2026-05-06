#!/usr/bin/env node
// Visual verify v11: NameCard always-render + Field outline state machine + Column resize handle
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/v11')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6053, r))

const browser = await chromium.launch({ headless: true })

// 1. NameCard always-render — InlineEdit story → hover person avatar
async function shotNameCard() {
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 })
  await page.goto('http://localhost:6053/iframe.html?id=design-system-components-datatable-展示--inline-edit&viewMode=story', { waitUntil: 'networkidle' })
  await page.waitForSelector('[role="row"][data-row-index]')
  await page.waitForTimeout(500)

  // Hover Charlie Wu (Owner cell row 2 PRD-0003)
  const target = await page.evaluate(() => {
    const cells = document.querySelectorAll('[role="row"][data-row-index="2"] [role="cell"]')
    const ownerCell = cells[7] // owner cell
    if (!ownerCell) return null
    const avatar = ownerCell.querySelector('[role="img"], img, span[aria-hidden]')
    const r = (avatar ?? ownerCell).getBoundingClientRect()
    return { x: r.x + 20, y: r.y + r.height / 2 }
  })
  if (target) {
    await page.mouse.move(target.x, target.y)
    await page.waitForTimeout(1500) // hovercard delay
    await page.screenshot({ path: join(OUT, '01-namecard-always-render.png'), fullPage: false })
    console.log('NameCard hover screenshot saved')
  }
  await page.close()
}

// 2. Field outline state — RowAutoHeightInlineEdit click cell → outline color
async function shotFieldOutline() {
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 })
  await page.goto('http://localhost:6053/iframe.html?id=design-system-components-datatable-展示--row-auto-height-inline-edit&viewMode=story', { waitUntil: 'networkidle' })
  await page.waitForSelector('[role="row"][data-row-index]')
  await page.waitForTimeout(400)

  // Click Category cell (idx 2)
  const target = await page.evaluate(() => {
    const cell = document.querySelectorAll('[role="row"][data-row-index="0"] [role="cell"]')[2]
    if (!cell) return null
    const r = cell.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })
  if (target) {
    await page.mouse.click(target.x, target.y)
    await page.waitForTimeout(700)
    await page.screenshot({ path: join(OUT, '02-field-outline-open.png'), clip: { x: 0, y: 60, width: 800, height: 250 } })
    console.log('Field outline screenshot saved')
  }
  await page.close()
}

// 3. Column resize handle hover — Basic story (we just need a story with header)
async function shotResizeHandle() {
  const page = await browser.newPage({ viewport: { width: 1400, height: 600 }, deviceScaleFactor: 2 })
  await page.goto('http://localhost:6053/iframe.html?id=design-system-components-datatable-展示--column-types&viewMode=story', { waitUntil: 'networkidle' })
  await page.waitForSelector('[role="columnheader"]')
  await page.waitForTimeout(400)

  // Hover the right edge of first column header (resize handle area)
  const handlePos = await page.evaluate(() => {
    const header = document.querySelector('[role="columnheader"]')
    if (!header) return null
    const r = header.getBoundingClientRect()
    return { x: r.right - 2, y: r.y + r.height / 2 }
  })
  if (handlePos) {
    await page.mouse.move(handlePos.x, handlePos.y)
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(OUT, '03-resize-handle-hover.png'), clip: { x: 0, y: 0, width: 800, height: 100 } })
    console.log('Resize handle screenshot saved')
  }
  await page.close()
}

await shotNameCard()
await shotFieldOutline()
await shotResizeHandle()

await browser.close()
server.close()
