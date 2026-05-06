#!/usr/bin/env node
// Verify DragOverlay canonical: drag source row, scroll source out of viewport, ensure
// overlay still renders correctly + no visual breakage.

import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/drag-overlay')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6047, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 700 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:6047/iframe.html?id=design-system-components-datatable-展示--row-drag-with-virtualization&viewMode=story', { waitUntil: 'networkidle' })

await page.waitForSelector('[role="row"][data-row-index]')
await page.waitForTimeout(500)

console.log('=== Test: Drag row 0 then scroll out of viewport ===\n')

// Initial state
const initial = await page.evaluate(() => {
  const rows = document.querySelectorAll('[role="row"][data-row-index]')
  return { mounted: rows.length, first: rows[0]?.getAttribute('data-sortable-row-id') }
})
console.log('Initial mounted:', initial)

// hover row 0 first to reveal drag handle (portal-fixed only when hover signal)
const row0Box = await page.evaluate(() => {
  const r = document.querySelector('[role="row"][data-row-index="0"]')?.getBoundingClientRect()
  return r ? { x: r.x + 100, y: r.y + r.height / 2 } : null
})
if (row0Box) {
  await page.mouse.move(row0Box.x, row0Box.y)
  await page.waitForTimeout(400)
}

// Find drag handle for row 0 (PRD-0001)
const handleBox = await page.evaluate(() => {
  const handle = document.querySelector('button[aria-label*="拖曳"]')
  if (!handle) return null
  const r = handle.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
})

if (handleBox) {
  console.log('Found handle:', handleBox)
  await page.mouse.move(handleBox.x, handleBox.y)
  await page.mouse.down()
  await page.mouse.move(handleBox.x, handleBox.y + 30, { steps: 5 })
  await page.waitForTimeout(300)

  // Now scroll the table body to push source row out of viewport
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'))
    const scroller = all.find(el => el.scrollHeight > el.clientHeight + 100 && getComputedStyle(el).overflowY !== 'visible')
    if (scroller) scroller.scrollTop = 1500
  })
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(OUT, '01-drag-scrolled.png') })

  const dragState = await page.evaluate(() => {
    const allRows = document.querySelectorAll('[role="row"][data-row-index]')
    const sourceRowMounted = !!document.querySelector('[role="row"][data-sortable-row-id="PRD-0001"]')
    // Check DragOverlay portal — it's outside SortableContext, has no data-row-index
    const overlayWrappers = Array.from(document.querySelectorAll('div')).filter(d => {
      return d.style.transform?.includes('translate3d') && !d.hasAttribute('data-row-index')
    })
    const dragOverlayHas = overlayWrappers.some(w => w.querySelector('[role="row"]'))
    return {
      mountedAfterScroll: allRows.length,
      sourceRowMounted,
      firstMountedId: allRows[0]?.getAttribute('data-sortable-row-id'),
      lastMountedId: allRows[allRows.length - 1]?.getAttribute('data-sortable-row-id'),
      dragOverlayHasContent: dragOverlayHas,
    }
  })
  console.log('Mid-drag (scrolled):', dragState)

  await page.mouse.up()
  await page.waitForTimeout(300)
  console.log('Drag complete')
} else {
  console.log('Could not find drag handle even after hover')
}

if (false) {
  console.log('Could not find drag handle. Trying alternative — row body click+drag...')
  // Use first cell of row 0 as drag start point (some tables drag whole row)
  const rowBox = await page.evaluate(() => {
    const row0 = document.querySelector('[role="row"][data-row-index="0"]')
    if (!row0) return null
    const r = row0.getBoundingClientRect()
    return { x: r.x + 30, y: r.y + r.height / 2 }
  })

  // hover row to reveal handle
  await page.mouse.move(rowBox.x, rowBox.y)
  await page.waitForTimeout(300)

  // Re-check for handle
  const handleBox2 = await page.evaluate(() => {
    const handle = document.querySelector('button[aria-label*="拖曳"]') || document.querySelector('[data-drag-handle]')
    if (!handle) return null
    const r = handle.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })
  if (handleBox2) {
    console.log('Found handle after hover:', handleBox2)
    await page.mouse.move(handleBox2.x, handleBox2.y)
    await page.mouse.down()
    await page.mouse.move(handleBox2.x, handleBox2.y + 10)
    await page.waitForTimeout(200)
    // Now we're dragging — scroll table body to push source out of view
    await page.evaluate(() => {
      const scroller = document.querySelector('.overflow-y-auto, [data-radix-scroll-area-viewport]') || document.querySelector('[role="grid"] > div')
      if (scroller) scroller.scrollTop = 1500
    })
    await page.waitForTimeout(300)
    await page.screenshot({ path: join(OUT, '01-drag-scrolled.png') })

    const dragState = await page.evaluate(() => {
      const overlay = document.querySelector('[role="row"][aria-roledescription="draggable"]')
                    || document.querySelector('div[style*="z-index: 999"]')
                    || document.querySelectorAll('[role="row"]')[0]
      const allRows = document.querySelectorAll('[role="row"][data-row-index]')
      const sourceRowMounted = !!document.querySelector('[role="row"][data-sortable-row-id="PRD-0001"]')
      // DragOverlay rendered?
      const dragOverlay = document.querySelector('[role="row"]:not([data-row-index])')
      return {
        mountedAfterScroll: allRows.length,
        sourceRowMounted,
        firstMountedId: allRows[0]?.getAttribute('data-sortable-row-id'),
        lastMountedId: allRows[allRows.length - 1]?.getAttribute('data-sortable-row-id'),
        dragOverlayPresent: !!dragOverlay && dragOverlay !== allRows[0],
      }
    })
    console.log('After scroll during drag:', dragState)

    await page.mouse.up()
  }
}

await browser.close()
server.close()
