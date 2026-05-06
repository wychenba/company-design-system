#!/usr/bin/env node
// Measure header column width vs body cell width — reproduce user-reported misalign
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/header-row-align')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6058, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 })

await page.goto('http://localhost:6058/iframe.html?id=design-system-components-datatable-展示--row-auto-height-inline-edit&viewMode=story', { waitUntil: 'networkidle' })
await page.waitForSelector('[role="columnheader"]')
await page.waitForTimeout(400)

const measurement = await page.evaluate(() => {
  const headers = document.querySelectorAll('[role="columnheader"]')
  const firstRowCells = document.querySelectorAll('[role="row"][data-row-index="0"] [role="cell"]')
  const out = []
  for (let i = 0; i < Math.min(headers.length, firstRowCells.length); i++) {
    const h = headers[i].getBoundingClientRect()
    const c = firstRowCells[i].getBoundingClientRect()
    out.push({
      i,
      headerLabel: headers[i].textContent.slice(0, 20),
      headerLeft: Math.round(h.left * 100) / 100,
      headerRight: Math.round(h.right * 100) / 100,
      headerWidth: Math.round(h.width * 100) / 100,
      cellLeft: Math.round(c.left * 100) / 100,
      cellRight: Math.round(c.right * 100) / 100,
      cellWidth: Math.round(c.width * 100) / 100,
      leftDelta: Math.round((h.left - c.left) * 100) / 100,
      rightDelta: Math.round((h.right - c.right) * 100) / 100,
      widthDelta: Math.round((h.width - c.width) * 100) / 100,
    })
  }
  return out
})

console.log(JSON.stringify(measurement, null, 2))

// Visual screenshot for evidence
await page.screenshot({
  path: join(OUT, 'header-row-align.png'),
  clip: { x: 0, y: 0, width: 1100, height: 250 },
})

// Also check resize handle visibility at column boundary
const handleProbe = await page.evaluate(() => {
  const handle = document.querySelector('[role="columnheader"] span.absolute.top-0.bottom-0.right-0')
  if (!handle) return { found: false }
  const r = handle.getBoundingClientRect()
  const cs = window.getComputedStyle(handle)
  return {
    found: true,
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) },
    cursor: cs.cursor,
    pointerEvents: cs.pointerEvents,
    inner: handle.firstElementChild ? {
      class: handle.firstElementChild.className,
      rect: handle.firstElementChild.getBoundingClientRect(),
    } : null,
  }
})
console.log('\nResize handle probe:', JSON.stringify(handleProbe, null, 2))

// Probe wrapping div widths + outer chain
const wrappers = await page.evaluate(() => {
  const centerHeaderInnerWrap = document.querySelector('.w-max.min-w-full')
  const headerRow = centerHeaderInnerWrap?.querySelector('[role="row"]')
  const bodyContainer = document.querySelector('[role="row"][data-row-index="0"]')?.parentElement
  const headerCenterRef = centerHeaderInnerWrap?.parentElement
  const bodyCenterRef = bodyContainer?.parentElement
  const headerRowgroup = headerCenterRef?.parentElement
  const bodyParent = bodyCenterRef?.parentElement
  const outerTable = headerRowgroup?.parentElement
  return {
    centerHeaderRef: headerCenterRef ? { class: headerCenterRef.className?.slice(0, 80), w: headerCenterRef.getBoundingClientRect().width } : null,
    centerHeaderInner: centerHeaderInnerWrap ? { class: centerHeaderInnerWrap.className?.slice(0, 80), w: centerHeaderInnerWrap.getBoundingClientRect().width } : null,
    headerRowgroup: headerRowgroup ? { tag: headerRowgroup.tagName, role: headerRowgroup.getAttribute('role'), class: headerRowgroup.className?.slice(0, 80), w: headerRowgroup.getBoundingClientRect().width } : null,
    centerBodyRef: bodyCenterRef ? { class: bodyCenterRef.className?.slice(0, 80), w: bodyCenterRef.getBoundingClientRect().width } : null,
    bodyParent: bodyParent ? { tag: bodyParent.tagName, class: bodyParent.className?.slice(0, 80), w: bodyParent.getBoundingClientRect().width } : null,
    outerTable: outerTable ? { tag: outerTable.tagName, role: outerTable.getAttribute('role'), class: outerTable.className?.slice(0, 80), w: outerTable.getBoundingClientRect().width } : null,
  }
})
console.log('\nWrapper chain:', JSON.stringify(wrappers, null, 2))

await browser.close()
server.close()
