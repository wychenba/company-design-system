#!/usr/bin/env node
// v9 baseline DOM measurement: confirm root cause of 4-edge seam
// Measure pixel positions of:
//   - prev cell.border-r (1px stripe)
//   - editing cell Field.border-l (1px stripe)
//   - row N-1.border-b vs Field.border-t
//   - row N.border-b vs Field.border-b
// If positions are ADJACENT (not overlapping) → confirms 2px seam root cause

import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/v9-seam-measure')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6055, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 4 })  // 4x for sub-pixel clarity

await page.goto('http://localhost:6055/iframe.html?id=design-system-components-datatable-展示--inline-edit&viewMode=story', { waitUntil: 'networkidle' })
await page.waitForSelector('[role="row"][data-row-index]')
await page.waitForTimeout(500)

// Click row 1 cell index 5 (Stock select column) to enter edit mode
const target = await page.evaluate(() => {
  const cells = document.querySelectorAll('[role="row"][data-row-index="1"] [role="cell"]')
  const cell = cells[5]
  if (!cell) return null
  const r = cell.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
})

if (target) {
  await page.mouse.click(target.x, target.y)
  await page.waitForTimeout(700)
}

// Measure: editing cell + adjacent prev cell + adjacent rows
const measurement = await page.evaluate(() => {
  const editingRow = document.querySelector('[role="row"][data-row-index="1"]')
  if (!editingRow) return { error: 'no editing row' }
  const editingCell = editingRow.querySelectorAll('[role="cell"]')[5]
  const prevCell = editingRow.querySelectorAll('[role="cell"]')[4]
  if (!editingCell || !prevCell) return { error: 'no cells' }

  // Find Field wrapper inside editing cell (data-field-mode="edit")
  const field = editingCell.querySelector('[data-field-mode="edit"]')
  if (!field) return { error: 'no Field' }

  const editingCellRect = editingCell.getBoundingClientRect()
  const prevCellRect = prevCell.getBoundingClientRect()
  const fieldRect = field.getBoundingClientRect()

  // computed style for borders
  const fieldCs = window.getComputedStyle(field)
  const prevCellCs = window.getComputedStyle(prevCell)
  const editingCellCs = window.getComputedStyle(editingCell)

  // Adjacent row.border-b from prev row
  const prevRow = document.querySelector('[role="row"][data-row-index="0"]')
  const nextRow = document.querySelector('[role="row"][data-row-index="2"]')
  const prevRowRect = prevRow?.getBoundingClientRect()
  const nextRowRect = nextRow?.getBoundingClientRect()

  // DEBUG: trace ancestor chain to find offsetParent of Field
  let ancestor = field
  const chain = []
  while (ancestor && ancestor !== document.body) {
    const cs = window.getComputedStyle(ancestor)
    chain.push({
      tag: ancestor.tagName,
      role: ancestor.getAttribute('role'),
      pos: cs.position,
      display: cs.display,
      class: ancestor.className?.slice?.(0, 80),
    })
    ancestor = ancestor.parentElement
    if (chain.length > 8) break
  }

  return {
    fieldOffsetParent: {
      tag: field.offsetParent?.tagName,
      role: field.offsetParent?.getAttribute?.('role'),
      class: field.offsetParent?.className?.slice?.(0, 80),
    },
    fieldFullClass: field.className,
    fieldComputed: {
      position: window.getComputedStyle(field).position,
      top: window.getComputedStyle(field).top,
      left: window.getComputedStyle(field).left,
      right: window.getComputedStyle(field).right,
      bottom: window.getComputedStyle(field).bottom,
      height: window.getComputedStyle(field).height,
      width: window.getComputedStyle(field).width,
    },
    ancestorChain: chain,
    prevCell: {
      right: prevCellRect.right,
      borderRightWidth: prevCellCs.borderRightWidth,
      borderRightColor: prevCellCs.borderRightColor,
    },
    editingCell: {
      left: editingCellRect.left,
      right: editingCellRect.right,
      top: editingCellRect.top,
      bottom: editingCellRect.bottom,
      borderRightWidth: editingCellCs.borderRightWidth,
      paddingLeft: editingCellCs.paddingLeft,
    },
    field: {
      left: fieldRect.left,
      right: fieldRect.right,
      top: fieldRect.top,
      bottom: fieldRect.bottom,
      borderLeftWidth: fieldCs.borderLeftWidth,
      borderLeftColor: fieldCs.borderLeftColor,
      borderRightWidth: fieldCs.borderRightWidth,
      borderTopWidth: fieldCs.borderTopWidth,
      borderBottomWidth: fieldCs.borderBottomWidth,
    },
    prevRowBottom: prevRowRect?.bottom,
    nextRowTop: nextRowRect?.top,
    // Critical analysis: x position of adjacent borders
    leftSeamAnalysis: {
      // prev.border-r paints from [prev.right - 1, prev.right]
      prev_borderR_x_range: `[${prevCellRect.right - 1}, ${prevCellRect.right}]`,
      // Field.border-l paints from [Field.left, Field.left + 1]
      field_borderL_x_range: `[${fieldRect.left}, ${fieldRect.left + 1}]`,
      gap_or_overlap: fieldRect.left - prevCellRect.right,
      // 0 = adjacent (touching), positive = gap, negative = overlap
    },
  }
})

console.log(JSON.stringify(measurement, null, 2))

// Visual screenshot of the editing cell with borders visible
await page.screenshot({
  path: join(OUT, 'v9-editing-cell-seam.png'),
  clip: {
    x: Math.max(0, target.x - 200),
    y: Math.max(0, target.y - 30),
    width: 400,
    height: 80,
  },
})

await browser.close()
server.close()
