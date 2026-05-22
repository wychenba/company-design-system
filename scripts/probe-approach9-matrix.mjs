// 6-cell verify matrix for Approach 9: sm/md/lg × md/lg density × icon/avatar prefix
import { chromium } from 'playwright'
const b = await chromium.launch()
const c = await b.newContext({ viewport: { width: 1440, height: 900 } })

const probe = async (storyId, label, density) => {
  const p = await c.newPage()
  const url = `http://localhost:6006/iframe.html?id=${storyId}&viewMode=story${density ? `&globals=density:${density}` : ''}`
  await p.goto(url, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  await p.locator('[data-sidebar="trigger"]').first().click({ force: true }).catch(() => {})
  await p.waitForTimeout(500)

  const data = await p.evaluate(({ label }) => {
    const r = (el) => el ? { x: Math.round(el.getBoundingClientRect().x), w: Math.round(el.getBoundingClientRect().width), cx: Math.round(el.getBoundingClientRect().x + el.getBoundingClientRect().width / 2) } : null
    const outer = document.querySelector('[data-state] > div:nth-child(2)')
    const rail = r(outer)
    const railCenter = rail?.cx ?? null

    const buttons = Array.from(document.querySelectorAll('[data-sidebar="menu-button"]'))
    const iconBtn = buttons.find(b => b.querySelector('[data-prefix-type="icon"]'))
    const avatarBtn = buttons.find(b => b.querySelector('[data-prefix-type="avatar"]'))
    const iconEl = iconBtn?.querySelector('[data-prefix-type="icon"] svg')
    const avatarEl = avatarBtn?.querySelector('[data-prefix-type="avatar"] > *')

    return {
      label,
      rail: rail?.w,
      railCenter,
      iconCx: r(iconEl)?.cx,
      iconOffset: r(iconEl) && railCenter !== null ? r(iconEl).cx - railCenter : null,
      avatarCx: r(avatarEl)?.cx,
      avatarOffset: r(avatarEl) && railCenter !== null ? r(avatarEl).cx - railCenter : null,
      cssVarRowIcon: window.getComputedStyle(document.querySelector('.group\\/sidebar-wrapper') || document.body).getPropertyValue('--row-icon-size'),
      cssVarRowAvatar: window.getComputedStyle(document.querySelector('.group\\/sidebar-wrapper') || document.body).getPropertyValue('--row-avatar-size'),
    }
  }, { label })
  await p.close()
  return data
}

// Default size=md sidebar across stories
const md_md = await probe('design-system-components-sidebar-展示--integration-sidebar', 'md row × md density', 'md')
const md_lg = await probe('design-system-components-sidebar-展示--integration-sidebar', 'md row × lg density', 'lg')
const appShell_md = await probe('design-system-components-appshell-展示--primary-sidebar', 'AppShell md×md', 'md')
const appShell_lg = await probe('design-system-components-appshell-展示--primary-sidebar', 'AppShell md×lg', 'lg')

console.log(JSON.stringify({ md_md, md_lg, appShell_md, appShell_lg }, null, 2))
await b.close()
