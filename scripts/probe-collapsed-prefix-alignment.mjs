// Probe ALL collapsed sidebar items for prefix center alignment vs rail center.
import { chromium } from 'playwright'
const b = await chromium.launch()
const c = await b.newContext({ viewport: { width: 1440, height: 900 } })

const probeStory = async (storyId, label) => {
  const p = await c.newPage()
  await p.goto(`http://localhost:6006/iframe.html?id=${storyId}&viewMode=story`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  await p.locator('[data-sidebar="trigger"]').first().click({ force: true }).catch(() => {})
  await p.waitForTimeout(500)

  const data = await p.evaluate(({ label }) => {
    const r = (el) => el ? { x: Math.round(el.getBoundingClientRect().x), w: Math.round(el.getBoundingClientRect().width), cx: Math.round(el.getBoundingClientRect().x + el.getBoundingClientRect().width / 2) } : null

    const outer = document.querySelector('[data-state]')
    const sidebarOuter = document.querySelector('[data-state] > div:nth-child(2)')
    const rail = r(sidebarOuter)
    const railCenter = rail ? rail.cx : null

    // Find all menu buttons (icons + avatars + footer)
    const buttons = Array.from(document.querySelectorAll('[data-sidebar="menu-button"]'))
    const results = buttons.slice(0, 10).map((btn, i) => {
      const prefix = btn.querySelector('[data-prefix-type]')
      const prefixType = prefix?.getAttribute('data-prefix-type')
      const innerEl = prefix?.querySelector('svg, div:first-child, span:first-child')
      const text = btn.textContent?.slice(0, 30)
      return {
        idx: i,
        text,
        prefixType,
        prefixRect: r(prefix),
        innerRect: r(innerEl),
        offsetFromRailCenter: r(innerEl) && railCenter !== null ? r(innerEl).cx - railCenter : null,
      }
    })

    return {
      label,
      state: outer?.getAttribute('data-state'),
      railWidth: rail?.w,
      railCenter,
      buttons: results,
    }
  }, { label })
  await p.close()
  return data
}

const A = await probeStory('design-system-components-sidebar-展示--integration-sidebar', 'IntegrationSidebar (uniformPrefix)')
const B = await probeStory('design-system-components-sidebar-展示--icon-collapse', 'IconCollapse (no uniformPrefix, default)')
const C = await probeStory('design-system-components-appshell-展示--primary-sidebar', 'AppShell primary-sidebar')

console.log(JSON.stringify({ A, B, C }, null, 2))
await b.close()
