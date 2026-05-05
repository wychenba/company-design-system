import { chromium } from 'playwright'
import http from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const STATIC = join(__dirname, '..', 'storybook-static')
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const fp = join(STATIC, p); if (!existsSync(fp) || statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' }); res.end(readFileSync(fp))
})
await new Promise(r => server.listen(6030, r))
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:6030/iframe.html?id=design-system-components-datatable-展示--row-auto-height-inline-edit&viewMode=story', { waitUntil: 'networkidle' })
await page.waitForSelector('[role="row"][data-row-index]')
await page.waitForTimeout(400)
const rect = await page.evaluate(() => {
  const cell = document.querySelectorAll('[role="row"][data-row-index="0"] [role="cell"]')[3]
  const r = cell.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
})
await page.mouse.click(rect.x, rect.y)
await page.waitForTimeout(400)
const tree = await page.evaluate(() => {
  const cell = document.querySelectorAll('[role="row"][data-row-index="0"] [role="cell"]')[3]
  const cs = getComputedStyle(cell)
  const children = Array.from(cell.children).map((c, i) => {
    const r = c.getBoundingClientRect()
    const cstyle = getComputedStyle(c)
    return { i, tag: c.tagName, class: c.className.slice(0, 80), h: r.height, cssH: cstyle.height, alignSelf: cstyle.alignSelf, alignItems: cstyle.alignItems, flex: cstyle.flex }
  })
  return { cellH: cell.getBoundingClientRect().height, cellAlignItems: cs.alignItems, children }
})
console.log(JSON.stringify(tree, null, 2))
await browser.close()
server.close()
