#!/usr/bin/env node
/**
 * Probe length=5 visual at cell=140px(user 截圖的真實場景)。
 * Multi story init = 4 selected。Click first option in dropdown to add 5th。
 * Then measure trigger visible avatar + chip + screenshot。
 */
import { chromium } from 'playwright'
import { mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const OUT_DIR = join(__dirname, '..', 'snapshots', 'peoplepicker-length5')
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newContext({ viewport: { width: 1280, height: 800 } }).then(c => c.newPage())

await page.goto('http://localhost:6006/iframe.html?id=design-system-components-peoplepicker-展示--multi&viewMode=story')
await page.waitForLoadState('networkidle')
await page.waitForTimeout(1000)

await page.addStyleTag({ content: `.max-w-xs { max-width: 140px !important; width: 140px !important; }` })
await page.waitForTimeout(500)

async function probe(label) {
  const data = await page.evaluate(() => {
    const trig = document.querySelector('[role="combobox"]')
    if (!trig) return { err: 'no trigger' }
    const tagArea = trig.querySelector('div[class*="flex-1"][class*="min-w-0"]')
    const overflowSpan = tagArea?.querySelector('span.contents')
    const directChildren = overflowSpan ? Array.from(overflowSpan.children) : []
    const overflowWrapper = directChildren[directChildren.length - 1]
    const avatarWrappers = directChildren.slice(0, -1)
    const visibleAvatars = avatarWrappers.filter(w => !w.hidden && w.offsetParent !== null)
    let chipText = null
    if (overflowWrapper && !overflowWrapper.hidden && overflowWrapper.offsetParent !== null) {
      const text = overflowWrapper.textContent?.trim()
      if (text?.match(/^\+\d+$/)) chipText = text
    }
    // Measure overflowWrapper margin to verify -ml-0.5 applied
    let overflowMl = 'n/a'
    if (overflowWrapper) {
      overflowMl = getComputedStyle(overflowWrapper).marginLeft
    }
    return {
      triggerWidth: trig.clientWidth,
      tagAreaWidth: tagArea?.clientWidth,
      visibleAvatarCount: visibleAvatars.length,
      chipText,
      totalCircles: visibleAvatars.length + (chipText ? 1 : 0),
      overflowChipMarginLeft: overflowMl,
    }
  })
  console.log(`  [${label}]`, JSON.stringify(data))
  return data
}

const initState = await probe('init length=4')
await page.screenshot({ path: join(OUT_DIR, '01-length-4.png'), fullPage: false, clip: { x: 0, y: 0, width: 800, height: 200 } })

// Open dropdown + click 5th option (David Wu) to make length=5
await page.locator('[role="combobox"]').first().click()
await page.waitForTimeout(500)
await page.screenshot({ path: join(OUT_DIR, '02-dropdown-open.png'), fullPage: false })

// Click 「全部」footer to selectAll → 6 people。Then test deselect later to vary length。
// 「全部」 footer is last role=option in visible popover.
const allBtn = page.locator('[role="option"]').filter({ hasText: '全部' }).first()
await allBtn.click({ force: true }).catch(() => {})
await page.waitForTimeout(500)
await page.keyboard.press('Escape')
await page.waitForTimeout(500)

const state6 = await probe('after-selectAll length=6')
await page.screenshot({ path: join(OUT_DIR, '03-length-6.png'), fullPage: false, clip: { x: 0, y: 0, width: 800, height: 200 } })

// Now deselect 1 (Fiona) to get length=5
await page.locator('[role="combobox"]').first().click()
await page.waitForTimeout(500)
const fionaIdx = await page.evaluate(() => {
  const opts = Array.from(document.querySelectorAll('[role="option"]'))
  for (let i = 0; i < opts.length; i++) {
    if (opts[i].textContent?.includes('Fiona') && opts[i].getAttribute('aria-selected') === 'true') return i
  }
  return -1
})
console.log(`  Fiona selected idx=${fionaIdx}`)
if (fionaIdx >= 0) {
  await page.locator('[role="option"]').nth(fionaIdx).click({ force: true })
  await page.waitForTimeout(500)
}
await page.keyboard.press('Escape')
await page.waitForTimeout(500)

const state5 = await probe('after-deselect-Fiona length=5')
await page.screenshot({ path: join(OUT_DIR, '02-length-5.png'), fullPage: false, clip: { x: 0, y: 0, width: 800, height: 200 } })

await browser.close()

console.log('\n══ Verdict ══')
const seq = [initState, state6, state5]
const labels = ['length=4 (init)', 'length=6 (selectAll)', 'length=5 (deselect Fiona)']
for (let i = 0; i < seq.length; i++) {
  if (seq[i].err) continue
  const total = i + 4
  console.log(`  ${labels[i]}: visible=${seq[i].visibleAvatarCount} chip=${seq[i].chipText ?? 'none'} totalCircles=${seq[i].totalCircles} overflowML=${seq[i].overflowChipMarginLeft}`)
}
// Smooth transition assertion
let smooth = true
for (let i = 1; i < seq.length; i++) {
  if (seq[i].err || seq[i-1].err) continue
  const delta = Math.abs(seq[i].visibleAvatarCount - seq[i-1].visibleAvatarCount)
  if (delta > 1) { console.log(`  ✗ FAIL: ${labels[i-1]}→${labels[i]} delta=${delta}`); smooth = false }
  else console.log(`  ✓ ${labels[i-1]}→${labels[i]} delta=${delta} (smooth)`)
}
process.exit(smooth ? 0 : 1)
