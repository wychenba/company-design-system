#!/usr/bin/env node
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/time-picker-debug')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6043, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 2400, height: 800 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:6043/iframe.html?id=design-system-components-datatable-展示--inline-edit&viewMode=story', { waitUntil: 'networkidle' })
await page.waitForSelector('[role="row"][data-row-index]')
await page.waitForTimeout(400)

// Click time cell (last column reminderTime)
const target = await page.evaluate(() => {
  const cells = document.querySelectorAll('[role="row"][data-row-index="0"] [role="cell"]')
  const lastCell = cells[cells.length - 1]
  lastCell.scrollIntoView({ block: 'center', inline: 'center' })
  const r = lastCell.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
})

await page.mouse.click(target.x, target.y)
await page.waitForTimeout(1000)

// Inspect hours and minutes columns
const result = await page.evaluate(() => {
  const popper = document.querySelector('[data-radix-popper-content-wrapper]')
  if (!popper) return { error: 'no popper' }
  const popContent = popper.firstElementChild
  const popRect = popContent?.getBoundingClientRect()
  const wrapper = popContent?.querySelector?.('.flex.flex-col')
  const wrapperRect = wrapper?.getBoundingClientRect()
  const tcRoot = wrapper?.firstElementChild
  const tcRect = tcRoot?.getBoundingClientRect()
  const tcCs = tcRoot ? window.getComputedStyle(tcRoot) : null
  const chain = {
    popContentH: popRect ? Math.round(popRect.height) : null,
    wrapperH: wrapperRect ? Math.round(wrapperRect.height) : null,
    timeColumnsH: tcRect ? Math.round(tcRect.height) : null,
    timeColumnsClass: tcRoot?.className,
    timeColumnsFlexGrow: tcCs?.flexGrow,
    timeColumnsMinHeight: tcCs?.minHeight,
    timeColumnsHeight: tcCs?.height,
  }
  console.log('CHAIN:', JSON.stringify(chain))
  const listboxes = popper.querySelectorAll('[role="listbox"]')
  const out = []
  listboxes.forEach((lb, i) => {
    const sa = lb.closest('[data-radix-scroll-area-root]') || lb.parentElement
    const viewport = sa?.querySelector?.('[data-radix-scroll-area-viewport]') || sa
    const lbRect = lb.getBoundingClientRect()
    const vpRect = viewport?.getBoundingClientRect()
    const buttons = lb.querySelectorAll('button')
    const visibleButtons = []
    buttons.forEach(b => {
      const r = b.getBoundingClientRect()
      if (r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) {
        visibleButtons.push({ text: b.textContent, top: Math.round(r.top), bottom: Math.round(r.bottom) })
      }
    })
    out.push({
      idx: i,
      label: lb.getAttribute('aria-label'),
      lbRect: { x: Math.round(lbRect.x), y: Math.round(lbRect.y), w: Math.round(lbRect.width), h: Math.round(lbRect.height) },
      vpRect: vpRect ? { x: Math.round(vpRect.x), y: Math.round(vpRect.y), w: Math.round(vpRect.width), h: Math.round(vpRect.height), scrollTop: viewport.scrollTop } : null,
      buttonCount: buttons.length,
      visibleButtonsCount: visibleButtons.length,
      first3Visible: visibleButtons.slice(0, 3).map(b => b.text),
      last3Visible: visibleButtons.slice(-3).map(b => b.text),
    })
  })
  return { chain, listboxes: out, popperRect: popper.getBoundingClientRect() }
})

console.log(JSON.stringify(result, null, 2))

await page.screenshot({ path: join(OUT, '01-time-overlay.png'), clip: { x: target.x - 200, y: target.y - 50, width: 400, height: 350 }, scale: 'device' })

await browser.close()
server.close()
