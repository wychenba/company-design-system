#!/usr/bin/env node
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, '.claude/snapshots/align-check')
mkdirSync(OUT, { recursive: true })
const STATIC = join(ROOT, 'storybook-static')

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6024, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:6024/iframe.html?id=design-system-components-datatable-展示--inline-edit-interactive&viewMode=story', { waitUntil: 'networkidle' })
await page.waitForSelector('[role="row"][data-row-index]')

// Measure: SKU header cell text X vs PRD-001 cell text X
const align = await page.evaluate(() => {
  // Find header cells
  const headers = Array.from(document.querySelectorAll('[role="columnheader"]'))
  // Find body cells row 0
  const row0Cells = Array.from(document.querySelectorAll('[role="row"][data-row-index="0"] [role="cell"]'))

  function textRect(el) {
    if (!el) return null
    // Find first non-whitespace text node descendant
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
    const node = walker.nextNode()
    if (!node || !node.textContent.trim()) {
      // Fallback: rect of the element itself
      return el.getBoundingClientRect()
    }
    const r = document.createRange()
    r.selectNode(node)
    return r.getBoundingClientRect()
  }

  const data = []
  // SKU header (skip select column header [0])
  if (headers.length >= 2) {
    const skuHeader = headers.find(h => h.textContent?.includes('SKU'))
    const skuBody = row0Cells.find(c => c.textContent?.includes('PRD-'))
    if (skuHeader && skuBody) {
      const hRect = textRect(skuHeader)
      const bRect = textRect(skuBody)
      data.push({
        col: 'SKU',
        header_text_x: hRect?.x,
        body_text_x: bRect?.x,
        delta: (bRect?.x ?? 0) - (hRect?.x ?? 0),
        header_cell_x: skuHeader.getBoundingClientRect().x,
        body_cell_x: skuBody.getBoundingClientRect().x,
      })
    }
    const productHeader = headers.find(h => h.textContent?.includes('Product'))
    const productBody = row0Cells.find(c => c.textContent?.includes('Wireless') || c.textContent?.includes('Bluetooth'))
    if (productHeader && productBody) {
      const hRect = textRect(productHeader)
      const bRect = textRect(productBody)
      data.push({
        col: 'Product',
        header_text_x: hRect?.x,
        body_text_x: bRect?.x,
        delta: (bRect?.x ?? 0) - (hRect?.x ?? 0),
      })
    }
  }
  return data
})

console.log('alignment:', JSON.stringify(align, null, 2))
await page.screenshot({ path: join(OUT, 'inline-edit-align.png'), clip: { x: 0, y: 0, width: 800, height: 200 } })
console.log('screenshot saved')
await browser.close()
server.close()
