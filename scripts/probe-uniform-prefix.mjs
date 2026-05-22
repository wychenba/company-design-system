// Probe uniformPrefix story to verify icon centering in mixed prefix slot
import { chromium } from 'playwright'
const b = await chromium.launch()
const c = await b.newContext({ viewport: { width: 1440, height: 900 } })
const p = await c.newPage()
await p.goto('http://localhost:6006/iframe.html?id=design-system-components-sidebar-展示--integration-sidebar&viewMode=story', { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)

// Test BOTH expanded + collapsed states
const probe = (label) => p.evaluate(({ label }) => {
  const r = (el) => el ? { x: Math.round(el.getBoundingClientRect().x), w: Math.round(el.getBoundingClientRect().width), cx: Math.round(el.getBoundingClientRect().x + el.getBoundingClientRect().width / 2) } : null
  const css = (el, ...props) => el ? Object.fromEntries(props.map(p => [p, window.getComputedStyle(el).getPropertyValue(p)])) : null
  const navBtns = Array.from(document.querySelectorAll('[data-sidebar="menu-button"]')).filter(btn => btn.querySelector('[data-prefix-type="icon"]'))
  const avatarBtns = Array.from(document.querySelectorAll('[data-sidebar="menu-button"]')).filter(btn => btn.querySelector('[data-prefix-type="avatar"]'))
  const firstNav = navBtns[0]
  const firstAvBtn = avatarBtns[0]
  return {
    label,
    state: document.querySelector('[data-state]')?.getAttribute('data-state'),
    navIconWrapper: { ...r(firstNav?.querySelector('[data-prefix-type="icon"]')), ...css(firstNav?.querySelector('[data-prefix-type="icon"]'), 'min-width', 'justify-content', 'width', 'padding-left', 'padding-right') },
    navSvg: r(firstNav?.querySelector('svg')),
    navBtn: { ...r(firstNav), ...css(firstNav, 'padding-left', 'padding-right') },
    avatarWrapper: { ...r(firstAvBtn?.querySelector('[data-prefix-type="avatar"]')), ...css(firstAvBtn?.querySelector('[data-prefix-type="avatar"]'), 'min-width', 'justify-content', 'width') },
    avatarBtn: { ...r(firstAvBtn), ...css(firstAvBtn, 'padding-left', 'padding-right') },
  }
}, { label })

const expanded = await probe('EXPANDED')
await p.locator('[data-sidebar="trigger"]').first().click({ force: true })
await p.waitForTimeout(500)
const collapsed = await probe('COLLAPSED')
console.log(JSON.stringify({ expanded, collapsed }, null, 2))
await b.close()
const data_DISABLED = await p.evaluate(() => {
  const r = (el) => el ? { x: Math.round(el.getBoundingClientRect().x), w: Math.round(el.getBoundingClientRect().width), cx: Math.round(el.getBoundingClientRect().x + el.getBoundingClientRect().width / 2) } : null
  const css = (el, ...props) => el ? Object.fromEntries(props.map(p => [p, window.getComputedStyle(el).getPropertyValue(p)])) : null

  // Wrapper that should have --item-prefix-slot set via :has()
  const sidebarWrapper = document.querySelector('.group\\/sidebar-wrapper')

  // First nav menu button (Home / Inbox / Team — has startIcon lucide)
  const navButtons = Array.from(document.querySelectorAll('[data-sidebar="menu-button"]')).filter(btn => btn.querySelector('svg'))
  const firstNav = navButtons[0]
  const firstNavIconWrapper = firstNav?.querySelector('[data-prefix-type="icon"]')
  const firstNavSvg = firstNavIconWrapper?.querySelector('svg')

  // First integration button (GitHub — has ItemAvatar)
  const avatarBtns = Array.from(document.querySelectorAll('[data-sidebar="menu-button"]')).filter(btn => btn.querySelector('[data-prefix-type="avatar"]'))
  const firstAvatar = avatarBtns[0]
  const firstAvatarWrapper = firstAvatar?.querySelector('[data-prefix-type="avatar"]')
  const firstAvatarInner = firstAvatarWrapper?.querySelector('div, span:not([data-prefix-type])')

  return {
    sidebarWrapperHasIconAndAvatar: {
      hasIcon: !!sidebarWrapper?.querySelector('[data-prefix-type="icon"]'),
      hasAvatar: !!sidebarWrapper?.querySelector('[data-prefix-type="avatar"]'),
    },
    itemPrefixSlotVar: sidebarWrapper ? window.getComputedStyle(sidebarWrapper).getPropertyValue('--item-prefix-slot') : null,
    mixedPrefixSlotVar: sidebarWrapper ? window.getComputedStyle(sidebarWrapper).getPropertyValue('--mixed-prefix-slot') : null,
    nav_iconWrapper: firstNavIconWrapper ? { ...r(firstNavIconWrapper), ...css(firstNavIconWrapper, 'min-width', 'justify-content', 'width') } : null,
    nav_svg: r(firstNavSvg),
    avatar_wrapper: firstAvatarWrapper ? { ...r(firstAvatarWrapper), ...css(firstAvatarWrapper, 'min-width', 'justify-content', 'width') } : null,
    avatar_inner: r(firstAvatarInner),
    // 對齊驗證
    iconCenterMatchesAvatarCenter: r(firstNavSvg)?.cx === r(firstAvatarInner)?.cx,
  }
})

console.log(JSON.stringify(data, null, 2))
await b.close()
