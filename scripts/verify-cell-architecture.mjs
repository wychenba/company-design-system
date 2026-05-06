#!/usr/bin/env node
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, '.claude/snapshots/verify-arch')
mkdirSync(OUT, { recursive: true })
const STATIC = join(ROOT, 'storybook-static')

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6029, r))

const browser = await chromium.launch({ headless: true })

async function probe(storyId, cellIdx, label) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 })
  await page.goto(`http://localhost:6029/iframe.html?id=${storyId}&viewMode=story`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[role="row"][data-row-index]')
  await page.waitForTimeout(400)

  const measure = async (state) => page.evaluate((idx) => {
    const cell = document.querySelectorAll('[role="row"][data-row-index="0"] [role="cell"]')[idx]
    if (!cell) return null
    const cellR = cell.getBoundingClientRect()
    // Find the first text-bearing element inside cell (input value or text node)
    const input = cell.querySelector('input, textarea')
    let textTop = null, textH = null
    if (input) {
      const r = input.getBoundingClientRect()
      textTop = r.top - cellR.top
      textH = r.height
    } else {
      const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT)
      let node
      while ((node = walker.nextNode())) {
        const t = node.textContent?.trim()
        if (t && t !== '—' && t !== '$') {
          const range = document.createRange()
          range.selectNodeContents(node)
          const rr = range.getBoundingClientRect()
          if (rr.height > 0) { textTop = rr.top - cellR.top; textH = rr.height; break }
        }
      }
    }
    return { cellH: cellR.height, textTop, textH }
  }, cellIdx)

  const display = await measure('display')
  await page.screenshot({ path: join(OUT, `${label}-display-cell${cellIdx}.png`), clip: { x: 0, y: 80, width: 1500, height: 600 } })

  const rect = await page.evaluate((idx) => {
    const cell = document.querySelectorAll('[role="row"][data-row-index="0"] [role="cell"]')[idx]
    if (!cell) return null
    const r = cell.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }, cellIdx)

  if (rect) await page.mouse.click(rect.x, rect.y)
  await page.waitForTimeout(400)
  const edit = await measure('edit')
  await page.screenshot({ path: join(OUT, `${label}-edit-cell${cellIdx}.png`), clip: { x: 0, y: 80, width: 1500, height: 600 } })

  const drift = display && edit && display.textTop != null && edit.textTop != null
    ? Math.abs(display.textTop - edit.textTop)
    : null
  console.log(`[${label} cell-${cellIdx}] display.textTop=${display?.textTop?.toFixed(1)} edit.textTop=${edit?.textTop?.toFixed(1)} cellH=${display?.cellH} drift=${drift?.toFixed(1)}`)
  await page.close()
  return { display, edit, drift }
}

console.log('\n=== Fixed mode (InlineEditInteractive) ===')
await probe('design-system-components-datatable-展示--inline-edit-interactive', 1, 'fixed')  // Product
await probe('design-system-components-datatable-展示--inline-edit-interactive', 6, 'fixed')  // Price

console.log('\n=== AutoRowHeight mode (RowAutoHeightInlineEdit) ===')
await probe('design-system-components-datatable-展示--row-auto-height-inline-edit', 1, 'autoRow')  // Product
await probe('design-system-components-datatable-展示--row-auto-height-inline-edit', 2, 'autoRow')  // Category select
await probe('design-system-components-datatable-展示--row-auto-height-inline-edit', 3, 'autoRow')  // Note (wrap text)
await probe('design-system-components-datatable-展示--row-auto-height-inline-edit', 4, 'autoRow')  // Price

await browser.close()
server.close()
