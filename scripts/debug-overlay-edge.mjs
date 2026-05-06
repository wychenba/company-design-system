#!/usr/bin/env node
// Test: open overlays at viewport edge — verify they shrink + scroll, never clip footer/buttons
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/overlay-edge')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6044, r))

const browser = await chromium.launch({ headless: true })

// Use small viewport to force collision
async function probe(label, storyId, cellSelector, expectFooter) {
  // 350px viewport height — less than TimePicker's 216 + cell + popover padding
  const page = await browser.newPage({ viewport: { width: 1400, height: 350 }, deviceScaleFactor: 2 })
  await page.goto(`http://localhost:6044/iframe.html?id=${storyId}&viewMode=story`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[role="row"][data-row-index]')
  await page.waitForTimeout(400)

  // Click cell to open overlay
  const target = await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    el.scrollIntoView({ block: 'center', inline: 'center' })
    const r = el.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }, cellSelector)
  if (!target) { console.log(`  ❌ ${label}: target not found`); await page.close(); return }

  await page.mouse.click(target.x, target.y)
  await page.waitForTimeout(800)

  const result = await page.evaluate((expectFooter) => {
    const popper = document.querySelector('[data-radix-popper-content-wrapper]')
    if (!popper) return { error: 'no popover opened' }
    const popContent = popper.firstElementChild
    const popRect = popContent.getBoundingClientRect()
    const cs = window.getComputedStyle(popContent)

    // Check if footer/last button visible
    const allButtons = popContent.querySelectorAll('button')
    const lastBtn = allButtons[allButtons.length - 1]
    const lastBtnRect = lastBtn?.getBoundingClientRect()
    const lastBtnVisible = lastBtnRect ? (lastBtnRect.bottom <= window.innerHeight && lastBtnRect.top >= 0 && lastBtnRect.bottom <= popRect.bottom + 1) : false

    // Check if any scroll container can actually scroll
    const scrollables = popContent.querySelectorAll('[data-radix-scroll-area-viewport], .overflow-y-auto, .overflow-auto')
    const scrollInfo = []
    scrollables.forEach(s => {
      scrollInfo.push({
        tag: s.tagName,
        clientH: s.clientHeight,
        scrollH: s.scrollHeight,
        scrollable: s.scrollHeight > s.clientHeight,
      })
    })

    return {
      popRect: { x: Math.round(popRect.x), y: Math.round(popRect.y), w: Math.round(popRect.width), h: Math.round(popRect.height), bottom: Math.round(popRect.bottom) },
      viewportH: window.innerHeight,
      maxHeight: cs.maxHeight,
      withinViewport: popRect.bottom <= window.innerHeight && popRect.top >= 0,
      lastBtnText: lastBtn?.textContent?.slice(0, 20),
      lastBtnVisible,
      lastBtnTop: lastBtnRect ? Math.round(lastBtnRect.top) : null,
      lastBtnBottom: lastBtnRect ? Math.round(lastBtnRect.bottom) : null,
      scrollInfo,
    }
  }, expectFooter)

  const status = (result.withinViewport && result.lastBtnVisible) ? '✓' : '⚠️'
  console.log(`${status} ${label}:`, JSON.stringify(result, null, 2))
  await page.screenshot({ path: join(OUT, `${label}.png`), fullPage: true })
  await page.close()
}

// Test on InlineEdit story — click TimePicker cell at row 3 (forced near bottom)
await probe('TimePicker-near-bottom', 'design-system-components-datatable-展示--inline-edit',
  '[role="row"][data-row-index="3"] [role="cell"]:last-child', 'OK button')

// Test Select cell
await probe('Select-near-bottom', 'design-system-components-datatable-展示--inline-edit',
  '[role="row"][data-row-index="3"] [role="cell"]:nth-child(5)', 'last option')

// Test DatePicker cell
await probe('DatePicker-near-bottom', 'design-system-components-datatable-展示--inline-edit',
  '[role="row"][data-row-index="3"] [role="cell"]:nth-last-child(2)', 'last day')

await browser.close()
server.close()
