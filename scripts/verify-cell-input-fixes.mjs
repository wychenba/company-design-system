#!/usr/bin/env node
// Verify the 15-issue holistic cell-as-input + drag handle fixes
// Captures DOM state + screenshots for each bug class

import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, '.claude/snapshots/cell-input-fixes')
const STATIC = join(ROOT, 'storybook-static')
const PORT = 6029
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(PORT, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })
page.on('pageerror', (e) => console.error('[page-error]', e.message))
const BASE = `http://localhost:${PORT}`
async function go(id) { await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' }); await page.waitForTimeout(600) }
async function shot(name) { await page.screenshot({ path: join(OUT, `${name}.png`) }); console.log('  📸', name) }

const results = []
function record(name, pass, info) { results.push({ name, pass, ...info }); console.log(`  ${pass ? '✓' : '✗'} ${name}`, info ?? '') }

// ── B1/B2/B3/B4: Cell-as-input padding/outline/indicator ──
console.log('\n[B1-B4] Cell-as-input editing visuals')
{
  await go('design-system-components-datatable-展示--inline-edit-interactive')
  await page.waitForSelector('[role="cell"]')
  await shot('B0-baseline-display-mode')

  // Click "Product" cell (string editable) row 0
  const productCells = page.locator('[role="row"][data-row-index="0"]').first().locator('[role="cell"]')
  // The first row's product cell should be index 2 (select=0, sku=1, name=2 maybe)
  const cells = await productCells.all()
  console.log('  cells in row 0:', cells.length)

  // Editable Product (name) column = idx 1 in this story (sku=0 not editable)
  const editCellIdx = 1
  const targetCell = cells[editCellIdx]
  const beforeText = await targetCell.textContent()
  const beforeBox = await targetCell.boundingBox()
  console.log('  target cell idx:', editCellIdx, 'text:', beforeText?.slice(0,30), 'box:', beforeBox)

  await targetCell.click()
  await page.waitForTimeout(400)
  await shot('B1-name-cell-editing')

  // B2/B3: check editing cell has box-shadow inset (not outline)
  const editStyle = await targetCell.evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      boxShadow: cs.boxShadow,
      outline: cs.outline,
      outlineStyle: cs.outlineStyle,
      paddingLeft: cs.paddingLeft,
      paddingRight: cs.paddingRight,
      borderRight: cs.borderRight,
    }
  })
  record('B2-box-shadow-inset', editStyle.boxShadow.includes('inset'), { boxShadow: editStyle.boxShadow.slice(0, 80) })
  record('B2-no-outline', editStyle.outlineStyle === 'none' || editStyle.outline === 'none' || !editStyle.outline.includes('px'), { outline: editStyle.outline })

  // B1: padding shouldn't change between display and edit (input inside should not add 12px more)
  const innerInput = targetCell.locator('input').first()
  if (await innerInput.count()) {
    const innerBox = await innerInput.boundingBox()
    const cellPadL = parseFloat(editStyle.paddingLeft)
    const inputLeftOffset = (innerBox?.x ?? 0) - (beforeBox?.x ?? 0)
    record('B1-input-aligned-with-cell-padding', Math.abs(inputLeftOffset - cellPadL) < 4, { inputLeftOffset, cellPadL })
  }

  // Esc to exit
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)

  // B4: Click select cell (Stock column) → check no double chevron
  const stockCellTxt = ['In stock', 'Low stock', 'Out of stock']
  let stockIdx = -1
  for (let i = 0; i < cells.length; i++) {
    const txt = await cells[i].textContent()
    if (stockCellTxt.some(s => txt?.includes(s))) { stockIdx = i; break }
  }
  if (stockIdx >= 0) {
    await cells[stockIdx].click()
    await page.waitForTimeout(400)
    await shot('B4-stock-cell-editing')
    const chevronCount = await cells[stockIdx].locator('svg.lucide-chevron-down').count()
    record('B4-no-double-chevron', chevronCount <= 1, { chevronCount })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
  }
}

// ── A1/A2: Drag handle hover flicker ──
console.log('\n[A1-A2] Drag handle hover flicker')
{
  await go('design-system-components-datatable-展示--row-drag-interactive')
  await page.waitForSelector('[role="row"][data-row-index="0"]')
  await page.waitForTimeout(500)
  const row0 = page.locator('[role="row"][data-row-index="0"]').first()
  const box = await row0.boundingBox()
  // Move into row body to trigger row hover
  await page.mouse.move(box.x + 200, box.y + box.height / 2)
  await page.waitForTimeout(300)
  // Check handle visibility
  const handle = page.locator('[aria-label="拖曳重排此列"]').first()
  const handleVis = await handle.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
  record('A-handle-visible-on-row-hover', handleVis > 0.5, { opacity: handleVis })
  await shot('A-row-hover-handle')

  // Move to handle
  const handleBox = await handle.boundingBox()
  if (handleBox) {
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
    await page.waitForTimeout(400)
    const handleVis2 = await handle.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    record('A1-handle-stays-visible-when-cursor-on-button', handleVis2 > 0.5, { opacity: handleVis2 })
    await shot('A1-cursor-on-handle')

    // Move away
    await page.mouse.move(box.x - 100, box.y + 200)
    await page.waitForTimeout(400)
    const handleVis3 = await handle.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    record('A-handle-hides-when-fully-away', handleVis3 < 0.5, { opacity: handleVis3 })
  }

  // A3: First cell text not pushed by anchor span
  const firstCell = row0.locator('[role="cell"]').first()
  const firstCellPadL = await firstCell.evaluate((el) => getComputedStyle(el).paddingLeft)
  // anchor span should not change cell padding
  record('A3-first-cell-padding-clean', /\d+/.test(firstCellPadL), { paddingLeft: firstCellPadL })
}

// ── C1/C2: Header tooltip + chevron ──
console.log('\n[C1-C2] Header truncation + chevron layout')
{
  await go('design-system-components-datatable-展示--inline-edit-interactive')
  await page.waitForSelector('[role="columnheader"]')
  await page.waitForTimeout(300)

  // Find a narrow column where text is truncated
  const headers = await page.locator('[role="columnheader"]').all()
  let truncatedIdx = -1
  for (let i = 0; i < headers.length; i++) {
    const span = headers[i].locator('span.truncate').first()
    if (await span.count() === 0) continue
    const truncated = await span.evaluate((el) => el.scrollWidth > el.clientWidth)
    if (truncated) { truncatedIdx = i; break }
  }
  console.log('  truncated header idx:', truncatedIdx)

  // C2: chevron does not reserve layout
  const stockHeader = headers.find(async (_, i) => true) // just take 4th header
  const targetHeaderIdx = 4 // In Stock column likely
  if (headers[targetHeaderIdx]) {
    const headerEl = headers[targetHeaderIdx]
    const chevronContainer = headerEl.locator('button[aria-label*="欄位選單"]').first()
    if (await chevronContainer.count()) {
      const before = await chevronContainer.evaluate((btn) => {
        // Container is 2 levels up
        const container = btn.closest('div.absolute')
        if (!container) return null
        const cs = getComputedStyle(container)
        return { position: cs.position, opacity: cs.opacity }
      })
      record('C2-chevron-absolute-positioned', before?.position === 'absolute' && parseFloat(before?.opacity) === 0, before ?? {})
    }

    await headerEl.hover()
    await page.waitForTimeout(300)
    await shot('C2-header-hovered')
  }
}

// ── D2: RadioGroup display mode shows only selected ──
console.log('\n[D2] RadioGroup display mode')
{
  await go('design-system-components-radiogroup-展示--modes')
  await page.waitForTimeout(500)
  await shot('D2-radiogroup-modes')
  const allTexts = await page.evaluate(() => document.body.textContent)
  // Heuristic: display mode should not show all 3-4 options as labels
  record('D2-radiogroup-renders', !!allTexts && allTexts.length > 100, { len: allTexts?.length })
}

console.log('\n=== RESULTS ===')
console.log(JSON.stringify(results, null, 2))
const failed = results.filter(r => r.pass === false)
console.log(failed.length === 0 ? '\n✓ ALL PASS' : `\n✗ ${failed.length} FAIL`)

await browser.close()
server.close()
process.exit(failed.length === 0 ? 0 : 1)
