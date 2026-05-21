// Visual audit — 2026-05-21 session fixes verification
// 3 issues:
//   1. Sidebar collapse no fly-right-then-left animation(menu item icon x 維持穩定)
//   2. PrimaryHeader leadingRail alignment(toggle center x = sidebar collapsed icon center x)
//   3. DevMode Author CSS 是否含 padding-inline 顯示
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

const OUT = 'snapshots/2026-05-21-session'
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })

const results = []

// ── Issue 1:Sidebar collapse fly-animation probe ──────────────────────────
// 策略:截 5 frame(0ms / 50ms / 100ms / 150ms / 200ms)看 menu item icon x position
// 不該 fly to center then back

async function probeSidebarCollapse() {
  const page = await ctx.newPage()
  // 進 PrimarySidebar story
  await page.goto('http://localhost:6006/iframe.html?id=design-system-components-appshell-展示--primary-sidebar&viewMode=story', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  // Initial expanded state probe — use first SidebarMenuButton(Dashboard)
  const inboxBtn = await page.$('[data-sidebar="menu-button"]')
  if (!inboxBtn) {
    results.push({ id: 'sidebar-collapse', status: 'FAIL', reason: 'SidebarMenuButton not found' })
    return
  }
  const expandedRect = await inboxBtn.evaluate(el => el.getBoundingClientRect())
  const expandedIcon = await page.$('[data-sidebar="menu-button"] svg')
  const expandedIconRect = expandedIcon ? await expandedIcon.evaluate(el => el.getBoundingClientRect()) : null

  // Trigger collapse(click SidebarTrigger)
  await page.click('[data-sidebar="trigger"]')

  // Capture 5 frames during 200ms animation
  const frames = []
  const tStart = Date.now()
  for (const t of [0, 50, 100, 150, 200, 250]) {
    const waitMs = t - (Date.now() - tStart)
    if (waitMs > 0) await page.waitForTimeout(waitMs)
    const buttonRect = await page.$eval('[data-sidebar="menu-button"]', el => el.getBoundingClientRect())
    const iconRect = await page.$('[data-sidebar="menu-button"] svg').then(el => el?.evaluate(e => e.getBoundingClientRect())).catch(() => null)
    frames.push({ t, buttonX: buttonRect.x, buttonW: buttonRect.width, iconX: iconRect?.x, iconW: iconRect?.width, iconCenterX: iconRect ? iconRect.x + iconRect.width / 2 : null })
    if (t === 100) await page.screenshot({ path: `${OUT}/sidebar-collapse-mid.png` })
  }
  await page.screenshot({ path: `${OUT}/sidebar-collapsed-final.png` })

  // Verdict:icon center x 不該大幅 jump(原 bug:expanded center ~24 → 瞬跳 ~136 → 動畫回到 ~24)
  const centerXs = frames.map(f => f.iconCenterX).filter(x => x != null)
  const maxX = Math.max(...centerXs)
  const minX = Math.min(...centerXs)
  const drift = maxX - minX
  const status = drift < 10 ? 'PASS' : 'FAIL'

  results.push({
    id: 'sidebar-collapse-fly-animation',
    status,
    reason: status === 'PASS' ? `icon center x stable(drift ${drift.toFixed(1)}px < 10px threshold)` : `icon flying: x range ${minX.toFixed(1)}-${maxX.toFixed(1)} (drift ${drift.toFixed(1)}px)`,
    expanded: { btnX: expandedRect.x, iconX: expandedIconRect?.x, iconCenterX: expandedIconRect ? expandedIconRect.x + expandedIconRect.width / 2 : null },
    frames,
  })

  await page.close()
}

// ── Issue 2:PrimaryHeader leadingRail alignment probe ──────────────────────
// toggle center x vs sidebar collapsed icon center x 該完美對齊

async function probePrimaryHeaderRailAlignment() {
  const page = await ctx.newPage()
  await page.goto('http://localhost:6006/iframe.html?id=design-system-components-appshell-展示--primary-header&viewMode=story', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/primary-header-expanded.png` })

  // Probe toggle in global header
  const toggleProbe = await page.evaluate(() => {
    const trigger = document.querySelector('[data-sidebar="trigger"]')
    if (!trigger) return null
    const svg = trigger.querySelector('svg')
    const triggerRect = trigger.getBoundingClientRect()
    const svgRect = svg?.getBoundingClientRect()
    return {
      triggerX: triggerRect.x,
      triggerW: triggerRect.width,
      triggerCenterX: triggerRect.x + triggerRect.width / 2,
      iconX: svgRect?.x,
      iconW: svgRect?.width,
      iconCenterX: svgRect ? svgRect.x + svgRect.width / 2 : null,
    }
  })

  // Click trigger to collapse sidebar
  await page.click('[data-sidebar="trigger"]')
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/primary-header-collapsed.png` })

  // Probe sidebar collapsed icon (any menu button)
  const sidebarIconProbe = await page.evaluate(() => {
    const menuBtn = document.querySelector('[data-sidebar="menu-button"]')
    if (!menuBtn) return null
    const svg = menuBtn.querySelector('svg')
    const btnRect = menuBtn.getBoundingClientRect()
    const svgRect = svg?.getBoundingClientRect()
    return {
      btnX: btnRect.x,
      btnW: btnRect.width,
      btnCenterX: btnRect.x + btnRect.width / 2,
      iconX: svgRect?.x,
      iconW: svgRect?.width,
      iconCenterX: svgRect ? svgRect.x + svgRect.width / 2 : null,
    }
  })

  const alignmentDelta = toggleProbe && sidebarIconProbe && toggleProbe.iconCenterX != null && sidebarIconProbe.iconCenterX != null
    ? Math.abs(toggleProbe.iconCenterX - sidebarIconProbe.iconCenterX)
    : null

  const status = alignmentDelta != null && alignmentDelta < 2 ? 'PASS' : 'FAIL'

  results.push({
    id: 'primary-header-leadingRail-alignment',
    status,
    reason: alignmentDelta != null
      ? `toggle icon center x = ${toggleProbe.iconCenterX?.toFixed(1)}, sidebar menu icon center x = ${sidebarIconProbe?.iconCenterX?.toFixed(1)}, delta = ${alignmentDelta.toFixed(1)}px ${status === 'PASS' ? '< 2px ✓' : '≥ 2px ✗'}`
      : 'Probe failed — trigger or menu icon not found',
    toggle: toggleProbe,
    sidebarIcon: sidebarIconProbe,
  })

  await page.close()
}

// ── Issue 3:DevMode padding-inline display ─────────────────────────────────

async function probeDevModePadding() {
  // Skip — requires DevMode panel interaction(addon-specific UI),非 production grade probe
  // Defer to manual inspection on Netlify preview
  results.push({
    id: 'devmode-padding-inline',
    status: 'SKIP',
    reason: 'DevMode panel interaction requires addon-specific UI flow,defer to manual inspection on Netlify preview'
  })
}

await probeSidebarCollapse()
await probePrimaryHeaderRailAlignment()
await probeDevModePadding()

await writeFile(`${OUT}/report.json`, JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))

await browser.close()
