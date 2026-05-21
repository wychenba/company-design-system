import { chromium } from 'playwright'
const b = await chromium.launch()
const c = await b.newContext({ viewport: { width: 1440, height: 900 } })
const p = await c.newPage()
await p.goto('http://localhost:6006/iframe.html?id=design-system-components-appshell-展示--primary-sidebar&viewMode=story', { waitUntil: 'networkidle' })
await p.waitForTimeout(600)
const sel = await p.evaluate(() => {
  const btns = [...document.querySelectorAll('[data-sidebar="menu-button"]')]
  return btns.map(b => ({
    text: b.innerText?.slice(0, 30),
    id: b.id,
    tagName: b.tagName,
    hasIcon: !!b.querySelector('svg'),
  }))
})
console.log(JSON.stringify(sel, null, 2))
await b.close()
