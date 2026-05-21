// Verify sidebar collapsed avatar alignment in BOTH md and lg density.
import { chromium } from 'playwright'
const b = await chromium.launch()
const c = await b.newContext({ viewport: { width: 1440, height: 900 } })

const probe = async (density) => {
  const p = await c.newPage()
  // Storybook globals can be set via `globals` query param
  const url = `http://localhost:6006/iframe.html?id=design-system-components-appshell-展示--primary-sidebar&viewMode=story&globals=density:${density}`
  await p.goto(url, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1500)
  await p.locator('[data-sidebar="trigger"]').first().click({ force: true })
  await p.waitForTimeout(500)
  const data = await p.evaluate(({ density }) => {
    const r = (el) => el ? { x: Math.round(el.getBoundingClientRect().x), w: Math.round(el.getBoundingClientRect().width), cx: Math.round(el.getBoundingClientRect().x + el.getBoundingClientRect().width / 2) } : null
    const css = (el, ...props) => el ? Object.fromEntries(props.map(p => [p, window.getComputedStyle(el).getPropertyValue(p)])) : null
    const html = document.documentElement
    const h = document.querySelector('[data-sidebar="header"]')
    // Find avatar: raw Avatar (div with width matching --chrome-header-avatar-size 24)
    // or ItemAvatar (wrapped). Use first direct child of header > div that matches 24px width.
    const avatar = h?.querySelector('[data-prefix-type], img, .rounded-md, [role="img"]')
      || Array.from(h?.querySelectorAll('div, span') ?? []).find(el => {
        const r = el.getBoundingClientRect()
        return r.width === 24 && r.height === 24
      })
    const menuBtn = document.querySelector('[data-sidebar="menu-button"]')
    const menuIcon = menuBtn?.querySelector('svg')
    const outer = document.querySelector('[data-state] > div:nth-child(2)')
    return {
      density,
      htmlDensity: html.getAttribute('data-density'),
      loose: window.getComputedStyle(html).getPropertyValue('--layout-space-loose'),
      sidebarWidthIcon: window.getComputedStyle(html).getPropertyValue('--sidebar-width-icon'),
      outerWidth: r(outer)?.w,
      headerPaddingLeft: h ? window.getComputedStyle(h).paddingLeft : null,
      avatar: r(avatar),
      menuIcon: r(menuIcon),
      alignmentOK: r(avatar)?.cx === r(menuIcon)?.cx,
    }
  }, { density })
  await p.close()
  return data
}

const md = await probe('md')
const lg = await probe('lg')
console.log(JSON.stringify({ md, lg }, null, 2))
await b.close()
