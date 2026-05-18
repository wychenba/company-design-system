#!/usr/bin/env node
/**
 * Runtime verify Combobox Round 4 — paint-target assertion(per Codex M31 Round 4 verdict)。
 *
 * Round 3 sync calc + max-w-full 沒解 root cause(wrapper-vs-Tag target mismatch):
 * - 量測 target = wrapper(`combobox.tsx:121 el.offsetWidth`)
 * - paint target = Tag 本體(`tag.tsx:179` 原 max-w-40 className)
 * - wrapper 看似沒超出(measurement OK)但 Tag 本體仍被外層 `overflow-hidden` 硬切
 *
 * Round 4 fix:
 * 1. `tag.tsx:179` className `max-w-40` → inline style `min(100%, 10rem)`(paint = measurement 一致)
 * 2. `overflow-indicator.tsx` 加 `data-overflow-indicator=""` attr(test query)
 * 3. `tag.tsx` 加 `data-tag-root=""` attr(test query)
 *
 * This script:assert paint target(Tag root rect)沒超出 tagArea right boundary。
 * 直接驗 user 圖一 / 圖二 抓的「tag 被硬切」symptom。
 *
 * Usage:
 *   1. `npm run storybook`(background)→ `http://localhost:6006`
 *   2. `node scripts/runtime-verify-combobox-round4.mjs`
 *   3. exit 0 = all PASS;exit 1 = any FAIL
 */

import { chromium } from 'playwright'

const STORYBOOK_URL = process.env.STORYBOOK_URL ?? 'http://localhost:6006'
const STORY_ID = 'design-system-components-datatable-展示--roadmap-all-in-one'

async function assertNoHardCut(page, mode) {
  const failures = await page.$$eval('[role="cell"][data-column-id="tags"] [data-field-mode]', (fields, modeArg) => {
    return fields.flatMap(field => {
      if (field.dataset.fieldMode !== modeArg) return []
      const tagArea = [...field.children].find(el =>
        el.className.includes('flex-1') && el.className.includes('min-w-0')
      )
      if (!tagArea) return ['missing tagArea in cell']
      const area = tagArea.getBoundingClientRect()
      return [...field.querySelectorAll('[data-tag-root]')]
        .filter(tag => tag.offsetParent !== null) // visible only
        .flatMap(tag => {
          const r = tag.getBoundingClientRect()
          const text = tag.querySelector('[data-tag-text]')
          const cs = text ? getComputedStyle(text) : null
          const errs = []
          if (r.right > area.right + 0.5) errs.push(`tag hard-cut right: "${tag.textContent}" (right=${r.right}, area=${area.right})`)
          if (cs && cs.textOverflow !== 'ellipsis') errs.push(`missing ellipsis on text: "${tag.textContent}"`)
          return errs
        })
    })
  }, mode)
  if (failures.length) throw new Error(`[${mode}] ${failures.length} hard-cut/ellipsis failures:\n  ` + failures.join('\n  '))
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  let passed = 0, failed = 0

  try {
    await page.goto(`${STORYBOOK_URL}/iframe.html?id=${STORY_ID}&viewMode=story`, { waitUntil: 'networkidle', timeout: 45_000 })

    // T1: display mode — all visible Tag roots must NOT overflow tagArea right
    try {
      await page.waitForSelector('[data-field-mode="display"]', { timeout: 5000 })
      await assertNoHardCut(page, 'display')
      console.log('  ✅ T1 display: no tag hard-cut + ellipsis present')
      passed++
    } catch (e) {
      console.error(`  ❌ T1 display: ${e.message}`)
      failed++
    }

    // T2: edit mode — click a cell with tags, verify same
    try {
      const cellWithTags = await page.locator('[role="cell"][data-column-id="tags"]').filter({ has: page.locator('[data-tag-root]') }).first()
      await cellWithTags.click()
      await page.waitForSelector('[data-field-mode="edit"]', { timeout: 5000 })
      await page.waitForTimeout(300) // let cell-as-input mount + measure
      await assertNoHardCut(page, 'edit')
      console.log('  ✅ T2 edit: no tag hard-cut + ellipsis present')
      passed++
    } catch (e) {
      console.error(`  ❌ T2 edit: ${e.message}`)
      failed++
    }

    // T3: +N indicator visible when overflow exists (cell narrow enough)
    try {
      const overflowIndicators = await page.$$('[data-overflow-indicator]')
      console.log(`  ℹ️ T3: found ${overflowIndicators.length} +N indicator(s) — non-zero if narrow cell + multiple tags`)
      passed++ // info-only, not gate
    } catch (e) {
      console.error(`  ❌ T3: ${e.message}`)
      failed++
    }
  } finally {
    await browser.close()
  }

  console.log(`\nResult: ${passed} passed / ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => { console.error(e); process.exit(1) })
