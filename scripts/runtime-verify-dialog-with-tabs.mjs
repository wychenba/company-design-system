#!/usr/bin/env node
/**
 * Runtime verify Dialog 標頭內含分頁(M32 pixel-quantified)。
 *
 * 2026-05-18 從 runtime-verify-header-canonical-tabs.mjs 改名 + 改 story id
 * (per user「整合進去 dialog」+ header-canonical.stories.tsx 已撤)
 *
 * Verify W1-W4 真實 honored:
 *   W1: 恰好 1 條 border-b(wrapper 0 / TabsList 1px,W1 視覺一條線)
 *   W1-line-full-width: TabsList 延展全 dialog 寬
 *   W2: TabsList 第一個 trigger left = DialogTitle left(都 = DialogContent left + layout-space-loose)
 *   W4: row 1 bottom = row 2 top(flush stack,gap = 0)
 */

import { chromium } from 'playwright'

const STORYBOOK_URL = process.env.STORYBOOK_URL ?? 'http://localhost:6006'
const STORY = 'design-system-components-dialog-展示--with-tabs-in-header'

async function probe(page) {
  return await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return { error: 'no dialog' }
    const title = dialog.querySelector('[id*=":r"][id$=":-title"], h2')
    const headerRoot = title?.closest('div.flex.flex-col, div.flex.items-center')
    const tabList = dialog.querySelector('[role="tablist"]')
    const firstTab = tabList?.querySelector('[role="tab"]')
    if (!title || !tabList || !firstTab) return { error: 'missing parts' }

    const dialogRect = dialog.getBoundingClientRect()
    const titleRect = title.getBoundingClientRect()
    const tabListRect = tabList.getBoundingClientRect()
    const firstTabRect = firstTab.getBoundingClientRect()

    const titleLeftFromDialog = titleRect.left - dialogRect.left
    const firstTabLeftFromDialog = firstTabRect.left - dialogRect.left

    const row1 = headerRoot
    const row2 = tabList.parentElement
    const row1Rect = row1?.getBoundingClientRect()
    const row2Rect = row2?.getBoundingClientRect()
    const flushGap = row2Rect && row1Rect ? row2Rect.top - row1Rect.bottom : null

    const row2Style = row2 ? window.getComputedStyle(row2) : null
    const tabListStyle = window.getComputedStyle(tabList)
    const wrapperBorderPx = parseFloat(row2Style?.borderBottomWidth || '0')
    const tabListBorderPx = parseFloat(tabListStyle.borderBottomWidth || '0')
    const totalBorderCount = (wrapperBorderPx > 0 ? 1 : 0) + (tabListBorderPx > 0 ? 1 : 0)
    const tabListWidth = tabListRect.width
    const dialogContentWidth = dialogRect.width
    const tabListFullDialogWidth = Math.abs(tabListWidth - dialogContentWidth) <= 2

    return {
      titleLeftFromDialog,
      firstTabLeftFromDialog,
      leftAlignDelta: Math.abs(titleLeftFromDialog - firstTabLeftFromDialog),
      flushGap,
      wrapperBorderPx,
      tabListBorderPx,
      totalBorderCount,
      tabListWidth,
      dialogContentWidth,
      tabListFullDialogWidth,
    }
  })
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  let passed = 0, failed = 0

  try {
    await page.goto(`${STORYBOOK_URL}/iframe.html?id=${STORY}&viewMode=story`, { waitUntil: 'networkidle', timeout: 45_000 })
    await page.locator('button:has-text("打開")').first().click()
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
    await page.waitForTimeout(300)

    const result = await probe(page)
    console.log('  Probe:', JSON.stringify(result, null, 2))

    if (result.error) {
      console.error(`  ❌ ${result.error}`)
      failed++
    } else {
      if (result.leftAlignDelta <= 1) {
        console.log(`  ✅ W2: title vs first tab left-align Δ=${result.leftAlignDelta.toFixed(2)}px`)
        passed++
      } else { console.error(`  ❌ W2: Δ=${result.leftAlignDelta}px`); failed++ }

      if (result.flushGap !== null && Math.abs(result.flushGap) <= 1) {
        console.log(`  ✅ W4: flush gap = ${result.flushGap.toFixed(2)}px`)
        passed++
      } else { console.error(`  ❌ W4: gap=${result.flushGap}`); failed++ }

      if (result.totalBorderCount === 1) {
        console.log(`  ✅ W1: 恰好 1 條 border(wrapper=${result.wrapperBorderPx}px / TabsList=${result.tabListBorderPx}px)`)
        passed++
      } else { console.error(`  ❌ W1: ${result.totalBorderCount} 條 border`); failed++ }

      if (result.tabListFullDialogWidth) {
        console.log(`  ✅ W1-line-full-width: TabsList ${result.tabListWidth}px == dialog ${result.dialogContentWidth}px`)
        passed++
      } else { console.error(`  ❌ W1-line-full-width: ${result.tabListWidth} vs ${result.dialogContentWidth}`); failed++ }
    }
  } finally {
    await browser.close()
  }

  console.log(`\nResult: ${passed} passed / ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => { console.error(e); process.exit(1) })
