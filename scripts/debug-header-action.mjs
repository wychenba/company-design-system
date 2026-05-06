#!/usr/bin/env node
// Verify header more-action: hidden default, hover reveals + takes layout space
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')
const OUT = join(ROOT, '.claude/snapshots/header-action')
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6048, r))

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 600 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:6048/iframe.html?id=design-system-components-datatable-展示--column-types&viewMode=story', { waitUntil: 'networkidle' })
await page.waitForSelector('[role="columnheader"]')
await page.waitForTimeout(400)

// Inspect first column header BEFORE hover
const before = await page.evaluate(() => {
  const header = document.querySelector('[role="columnheader"]')
  if (!header) return null
  const labelDiv = header.querySelector('.flex-1') || header.firstElementChild
  const moreBtn = header.querySelector('button[aria-label*="欄位選單"]')
  return {
    headerWidth: Math.round(header.getBoundingClientRect().width),
    labelWidth: labelDiv ? Math.round(labelDiv.getBoundingClientRect().width) : null,
    moreBtnVisible: moreBtn ? moreBtn.offsetWidth > 0 : false,
    moreBtnDisplay: moreBtn ? window.getComputedStyle(moreBtn.parentElement).display : null,
  }
})
console.log('Before hover:', before)

await page.screenshot({ path: join(OUT, '01-before-hover.png'), clip: { x: 0, y: 0, width: 800, height: 100 } })

// Hover header
const headerBox = await page.evaluate(() => {
  const r = document.querySelector('[role="columnheader"]').getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
})
await page.mouse.move(headerBox.x, headerBox.y)
await page.waitForTimeout(400)

const afterHover = await page.evaluate(() => {
  const header = document.querySelector('[role="columnheader"]')
  const labelDiv = header.querySelector('.flex-1') || header.firstElementChild
  const moreBtn = header.querySelector('button[aria-label*="欄位選單"]')
  return {
    headerWidth: Math.round(header.getBoundingClientRect().width),
    labelWidth: labelDiv ? Math.round(labelDiv.getBoundingClientRect().width) : null,
    moreBtnVisible: moreBtn ? moreBtn.offsetWidth > 0 : false,
    moreBtnDisplay: moreBtn ? window.getComputedStyle(moreBtn.parentElement).display : null,
  }
})
console.log('After hover:', afterHover)
await page.screenshot({ path: join(OUT, '02-after-hover.png'), clip: { x: 0, y: 0, width: 800, height: 100 } })

// Check expected behavior
const labelGotMoreSpaceWhenIdle = (before.labelWidth ?? 0) > (afterHover.labelWidth ?? 0)
console.log(`\n${labelGotMoreSpaceWhenIdle ? '✅' : '❌'} Idle label width > hover label width: ${before.labelWidth} > ${afterHover.labelWidth} (label gets MORE space when no action shown)`)
console.log(`Idle moreBtn display: ${before.moreBtnDisplay} (expect 'none' or 0-width)`)
console.log(`Hover moreBtn display: ${afterHover.moreBtnDisplay} (expect 'inline-flex')`)

await browser.close()
server.close()
