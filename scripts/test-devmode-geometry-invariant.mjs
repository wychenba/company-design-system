#!/usr/bin/env node
/**
 * test-devmode-geometry-invariant — Storybook addon Top 3 #1(2026-05-12 codex Q1)
 *
 * 跨 DPR matrix(1 / 1.25 / 2)assertion:**overlay outline rect ≈ target rect within 1 CSS px**。
 * 對齊 Chrome DevTools cross-platform regression coverage canonical(Material X DataGrid visual
 * regression / AG Grid playwright pixel snapshot)。
 *
 * 跑法:
 *   1. `npm run build-storybook`(若未 build)
 *   2. `node scripts/test-devmode-geometry-invariant.mjs`
 *
 * Exit:0 = all DPR pass within 1 px;1 = any DPR fail。
 */

import { chromium } from 'playwright'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const STATIC = join(ROOT, 'storybook-static')

if (!existsSync(STATIC)) {
  console.error('[geometry-invariant] storybook-static missing — run `npm run build-storybook` first')
  process.exit(2)
}

// Target story:取一個簡單已知 Button 元件 — addon hover/pin 時 overlay 必對齊。
const STORY_ID = 'design-system-components-button-展示--variants'
const TARGET_SELECTOR = 'button'  // 取 iframe 內第一個 button

const DPRS = [1, 1.25, 2]
const TOLERANCE_PX = 1  // codex verdict canonical

let totalFail = 0
const results = []

for (const dpr of DPRS) {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ deviceScaleFactor: dpr, viewport: { width: 1280, height: 720 } })
  const page = await ctx.newPage()

  const url = `file://${STATIC}/iframe.html?id=${STORY_ID}&viewMode=story`
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(300)  // allow addon side-effect + overlay install

  // 2026-05-13 R7 v2(per codex V3 critical fixes):
  //   v1 bugs:
  //   (a) addon listen `mouseover` 不是 `mouseenter` → dispatch 錯 event type 不 trigger handler
  //   (b) default mode='off' → test 必先 toggle 到 'live' mode 才會 paint overlay
  //   (c) silent pass on no overlay → 改 hard fail(否則 matrix can pass without exercising overlay)
  //   (d) diagnostic 量 overlay root 不是 outline child → 已在 geometry-diagnostic.ts v2 fix
  //
  // v2 Mechanism:
  //   1. Toggle live mode via addon channel:`window.__STORYBOOK_ADDONS_CHANNEL__.emit('storybook/ds-devmode/toggle', 'live')`
  //   2. dispatchEvent `mouseover`(對齊 preview.ts:250 listener)
  //   3. Wait 200ms allow rAF + emit + drawOverlay
  await page.evaluate((selector) => {
    // Toggle live mode — Storybook addon channel pattern
    // (channel global available in iframe via __STORYBOOK_ADDONS_CHANNEL__ if Storybook 7+)
    const ch = window.__STORYBOOK_ADDONS_CHANNEL__
    if (ch?.emit) ch.emit('storybook/ds-devmode/toggle', 'live')

    const el = document.querySelector(selector)
    if (!el) return
    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    // codex V3 fix:dispatch `mouseover`(addon listener)+ bubbles required for document-level capture
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: centerX, clientY: centerY }))
  }, TARGET_SELECTOR)
  await page.waitForTimeout(250)  // allow rAF + addon emit + drawOverlay paint cycle

  const diagnostic = await page.evaluate((selector) => {
    if (!window.__ds_devmode_diagnostic) return { error: 'addon diagnostic not installed' }
    return window.__ds_devmode_diagnostic(selector)
  }, TARGET_SELECTOR)

  results.push({ dpr, diagnostic })

  // Assert:html/body 無異常 transform / zoom(should be 'none' / 'normal')
  let fail = 0
  if (diagnostic && !diagnostic.error) {
    const htmlTransform = diagnostic.documentElement?.transform
    const bodyTransform = diagnostic.body?.transform
    if (htmlTransform && htmlTransform !== 'none') {
      console.warn(`[DPR ${dpr}] html.transform = "${htmlTransform}" (expected "none")`)
      fail++
    }
    if (bodyTransform && bodyTransform !== 'none') {
      console.warn(`[DPR ${dpr}] body.transform = "${bodyTransform}" (expected "none")`)
      fail++
    }
    // R7 補完:assert overlay rect ≈ target rect within TOLERANCE_PX(1 CSS px)。
    // 對齊 Material X DataGrid visual regression test + AG Grid playwright pixel snapshot canonical。
    if (diagnostic.deltaTopLeft) {
      const d = diagnostic.deltaTopLeft
      if (d.top > TOLERANCE_PX || d.left > TOLERANCE_PX || d.width > TOLERANCE_PX || d.height > TOLERANCE_PX) {
        console.warn(`[DPR ${dpr}] overlay alignment FAIL: top=${d.top}px left=${d.left}px width=${d.width}px height=${d.height}px (tolerance ${TOLERANCE_PX}px)`)
        fail++
      } else {
        console.log(`[DPR ${dpr}] overlay alignment OK: delta(top=${d.top}, left=${d.left}, w=${d.width}, h=${d.height}) ≤ ${TOLERANCE_PX}px`)
      }
    } else if (diagnostic.overlayRoot == null) {
      // 2026-05-13 codex V3 fix:overlay 沒 paint = R7 test 整個 invariant 沒 exercise → FAIL
      // (前 v1 silent warn → matrix can pass without verifying overlay geometry)
      console.error(`[DPR ${dpr}] overlay not painted after live-mode toggle + mouseover dispatch — R7 invariant NOT exercised`)
      fail++
    }
  } else {
    console.error(`[DPR ${dpr}] diagnostic error:`, diagnostic?.error ?? diagnostic)
    fail++
  }

  totalFail += fail
  await browser.close()
}

console.log('\n=== Geometry Diagnostic Matrix ===')
for (const r of results) {
  if (r.diagnostic?.error) {
    console.log(`DPR ${r.dpr}: ERROR ${r.diagnostic.error}`)
  } else {
    const d = r.diagnostic
    console.log(`DPR ${r.dpr}: innerW=${d.innerWidth} clientW=${d.clientWidth} scrollbarGutter=${d.scrollbarGutterWidth} htmlTransform="${d.documentElement.transform}" bodyTransform="${d.body.transform}"`)
  }
}

if (totalFail > 0) {
  console.error(`\n[geometry-invariant] FAIL: ${totalFail} anomalies across ${DPRS.length} DPRs`)
  process.exit(1)
}
console.log('\n[geometry-invariant] PASS: all DPR clean, no html/body transform anomaly')
process.exit(0)
