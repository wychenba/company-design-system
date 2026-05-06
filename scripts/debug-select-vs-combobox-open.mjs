#!/usr/bin/env node
// Empirical test: Combobox vs Select OPEN state border color
import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6062, r))

const browser = await chromium.launch({ headless: true })

const test = async (storyId, label, idx) => {
  const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 })
  await page.goto(`http://localhost:6062/iframe.html?id=${storyId}&viewMode=story`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)

  // Find target trigger
  const target = await page.evaluate((idx) => {
    const triggers = document.querySelectorAll('[role="combobox"]')
    const t = triggers[idx]
    if (!t) return null
    const r = t.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }, idx)
  if (!target) { console.log(`${label}: not found`); await page.close(); return }

  await page.mouse.click(target.x, target.y)
  await page.waitForTimeout(400)
  // move mouse far away
  await page.mouse.move(50, 750)
  await page.waitForTimeout(300)

  const probe = await page.evaluate((idx) => {
    const t = document.querySelectorAll('[role="combobox"]')[idx]
    if (!t) return null
    const cs = window.getComputedStyle(t)
    const input = t.querySelector('input')
    return {
      hasInputInside: !!input,
      inputFocused: input ? document.activeElement === input : false,
      activeEl: document.activeElement?.tagName + ':' + (document.activeElement?.getAttribute('role') ?? ''),
      dataState: t.getAttribute('data-state'),
      borderColor: cs.borderTopColor,
      classFragment: t.className.match(/border-\S+/g)?.slice(-3),
    }
  }, idx)
  console.log(`${label}: ${JSON.stringify(probe)}`)
  await page.close()
}

await test('design-system-components-select-展示--三種模式', 'Select(plain text default)', 0)
await test('design-system-components-select-展示--三種模式', 'Select(tag display)', 1)
await test('design-system-components-combobox-展示--searchable', 'Combobox(searchable trigger inline)', 1)

await browser.close()
server.close()
