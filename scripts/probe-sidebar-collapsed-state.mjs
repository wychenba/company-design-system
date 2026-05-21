import { chromium } from 'playwright'
const b = await chromium.launch()
const c = await b.newContext({ viewport: { width: 1440, height: 900 } })
const p = await c.newPage()
await p.goto('http://localhost:6006/iframe.html?id=design-system-components-appshell-展示--primary-sidebar&viewMode=story', { waitUntil: 'networkidle' })
await p.waitForTimeout(800)

// Click trigger to collapse
await p.click('[data-sidebar="trigger"]')
await p.waitForTimeout(400)

const probe = await p.evaluate(() => {
  // Sidebar outer fixed div
  const sidebar = document.querySelector('[data-state="collapsed"]')
  // SidebarInner
  const inner = document.querySelector('[data-sidebar="sidebar"]')
  // Header (WorkspaceBrand container)
  const header = document.querySelector('[data-sidebar="header"]')
  // First menu button icon
  const menuBtn = document.querySelector('[data-sidebar="menu-button"]')
  const menuIcon = menuBtn?.querySelector('svg')
  // Menu label
  const menuLabel = menuBtn?.querySelector('[data-sidebar="menu-label"]')
  // Logo avatar in header
  const headerAvatar = header?.querySelector('[data-prefix-type], [aria-label]')

  const r = (el) => el ? {
    x: el.getBoundingClientRect().x,
    w: el.getBoundingClientRect().width,
    cx: el.getBoundingClientRect().x + el.getBoundingClientRect().width / 2,
    display: window.getComputedStyle(el).display,
  } : null

  return {
    sidebar: r(sidebar),
    inner: r(inner),
    header: r(header),
    headerAvatar: r(headerAvatar),
    menuBtn: r(menuBtn),
    menuIcon: r(menuIcon),
    menuLabel: r(menuLabel),
    menuLabelText: menuLabel?.textContent?.slice(0, 30),
    menuLabelOpacity: menuLabel ? window.getComputedStyle(menuLabel).opacity : null,
    sidebarWidthIconCssVar: window.getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width-icon'),
  }
})

console.log(JSON.stringify(probe, null, 2))
await p.screenshot({ path: 'snapshots/2026-05-21-session/sidebar-collapsed-with-header.png', fullPage: false })
await b.close()
