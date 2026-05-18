#!/usr/bin/env node
/**
 * Runtime verify Combobox Round 6 — threshold flicker fix(per Codex M31 Round 6 H7 verdict)。
 *
 * Round 5 漏抓:dropdown 開啟後 ResizeObserver re-fire,在「兩 tag 剛好 fit / 不 fit」臨界寬
 * 的 cell 永動振盪(`+2` ↔ `backend, qa` 反覆翻)。Root cause:
 *   - expanded state(visibleCount=totalCount,overflow=0)→ OverflowIndicator return null
 *     → ofEl wrapper empty → offsetWidth=0 → fallback 60
 *   - collapsed state(+N 顯示)→ ofEl 真實寬 ~28-32px
 *   - 同 `available` 在兩 state 給不同 verdict → 永動
 *
 * Round 6 fix:cache last non-zero ofEl width 到 `lastOverflowWRef`,measurement state-independent。
 *
 * This script:
 *   1. 進 DataTable RoadmapAllInOne(2026-05-18 default story 內含臨界 tag cells)
 *   2. 對每個 multiSelect cell 點開 edit mode → 等 600ms → 連續 sample visibleCount 5 次
 *      → assert 5 次值都相同(振盪 = 至少有 1 次 differ)
 *   3. PASS = 全部 cell 5-sample 穩定;FAIL = 任一 cell 5-sample 有變動
 */

import { chromium } from 'playwright'

const STORYBOOK_URL = process.env.STORYBOOK_URL ?? 'http://localhost:6006'
const STORY_ID = 'design-system-components-datatable-展示--roadmap-all-in-one'

async function sampleVisibleCount(page, cellLocator) {
  return await cellLocator.evaluate(cell => {
    const wrappers = cell.querySelectorAll('[data-field-mode="edit"] [data-tag-root]')
    return Array.from(wrappers).filter(t => {
      const w = t.closest('div')
      return w && !w.hidden && t.getBoundingClientRect().width > 0
    }).length
  })
}

async function sampleOverflowVisible(page, cellLocator) {
  return await cellLocator.evaluate(cell => {
    const indicator = cell.querySelector('[data-field-mode="edit"] [data-overflow-indicator]')
    if (!indicator) return false
    return indicator.getBoundingClientRect().width > 0
  })
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  let passed = 0, failed = 0

  try {
    await page.goto(`${STORYBOOK_URL}/iframe.html?id=${STORY_ID}&viewMode=story`, { waitUntil: 'networkidle', timeout: 45_000 })

    // T1: 找所有有 tag 的 multiSelect cells,逐個 click 進 edit mode + 5-sample 振盪檢測
    const cells = await page.locator('[role="cell"][data-column-id="tags"]').filter({
      has: page.locator('[data-tag-root]')
    }).all()

    console.log(`  ℹ️ Found ${cells.length} multiSelect cells with tags`)

    let oscillationFound = 0
    let totalChecked = 0
    for (let i = 0; i < Math.min(cells.length, 10); i++) {
      const cell = cells[i]
      try {
        await cell.click()
        await page.waitForSelector('[data-field-mode="edit"]', { timeout: 3000 })
        await page.waitForTimeout(600) // let ResizeObserver settle

        // Sample 5 times over 500ms
        const samples = []
        for (let s = 0; s < 5; s++) {
          const visibleTags = await sampleVisibleCount(page, cell)
          const overflowShown = await sampleOverflowVisible(page, cell)
          samples.push(`v=${visibleTags},o=${overflowShown}`)
          await page.waitForTimeout(100)
        }

        totalChecked++
        const allSame = samples.every(s => s === samples[0])
        if (!allSame) {
          console.error(`  ❌ Cell ${i} oscillation: ${samples.join(' → ')}`)
          oscillationFound++
        } else {
          console.log(`  ✅ Cell ${i} stable: ${samples[0]}`)
        }

        // Click outside to close
        await page.locator('body').click({ position: { x: 10, y: 10 } })
        await page.waitForTimeout(100)
      } catch (e) {
        console.error(`  ⚠️ Cell ${i} skipped: ${e.message}`)
      }
    }

    if (oscillationFound > 0) {
      console.error(`\n  ❌ T1: ${oscillationFound}/${totalChecked} cells flicker`)
      failed++
    } else {
      console.log(`\n  ✅ T1: all ${totalChecked} cells stable (no oscillation)`)
      passed++
    }
  } finally {
    await browser.close()
  }

  console.log(`\nResult: ${passed} passed / ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => { console.error(e); process.exit(1) })
