#!/usr/bin/env node
// check-field-size-resolve.mjs — 機械防複發:Field 家族控件必經 useResolvedFieldSize 解析 size
//
// 2026-06-08(user:「應該要避免以後遇到類似情境又犯同樣的錯」):
//   B 組 bug = Combobox/DatePicker/TimePicker/PeoplePicker 用 `size = 'md'` 預設、**不讀 fieldCtx?.size**
//   → `<Field size>` 不 cascade + DataTable cell surface-size 不繼承(漏傳 size 字級不一致)。
//   根治後全 9 控件改用 `useResolvedFieldSize(sizeProp)`(prop > fieldCtx.size > surface-size > md)。
//
// 本 gate 防未來新增 Field 控件又犯同錯:任何 import fieldWrapperStyles/bareInputStyles 的「Field 控件」
//   (= 吃 Field size→font/height 視覺契約者)**必 import + 用 useResolvedFieldSize**;否則它的 size 不會
//   隨 <Field size> / cell surface 流動 → fail。對齊 mechanical = primary defense(feedback_ai_ground_truth_unreliable)。
//
// Run:ci.yml + release-preflight(deterministic source grep,無 build 依賴)。

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const COMPONENTS = join(__dirname, '..', 'packages/design-system/src/components')

// 遞迴蒐集 production .tsx(排除 stories / Field 內部基建本身)
function walk(dir) {
  const out = []
  for (const e of readdirSync(dir)) {
    const fp = join(dir, e)
    if (statSync(fp).isDirectory()) out.push(...walk(fp))
    else if (e.endsWith('.tsx') && !e.includes('.stories.') && !e.endsWith('.test.tsx')) out.push(fp)
  }
  return out
}

const FIELD_STYLE_IMPORT = /(fieldWrapperStyles|bareInputStyles)/
const violations = []
let checked = 0

const scattered = []  // Check 2:散落直讀 fieldCtx.size(該走 SSOT)

for (const f of walk(COMPONENTS)) {
  if (f.includes('/Field/')) continue  // field-wrapper.tsx / field-context 等基建本身豁免(useResolvedFieldSize 內部本就讀 fieldCtx.size)
  const s = readFileSync(f, 'utf8')
  const rel = f.replace(/.*packages\/design-system\/src\//, 'src/')

  // ── Check 1:Field 控件(import field-wrapper size→font/height 契約者)必用 useResolvedFieldSize ──
  if (/from '@\/design-system\/components\/Field\/field-wrapper'/.test(s) && FIELD_STYLE_IMPORT.test(s)) {
    checked++
    if (!/useResolvedFieldSize/.test(s)) violations.push(rel)
  }

  // ── Check 2:任何控件「散落直讀 fieldCtx.size」(SegmentedControl/Rating/Button class)= 該走 useResolvedFieldSize SSOT ──
  // 逐行掃,剝掉行內 // 註解後仍含 fieldCtx(?.| .)size → 散落讀取(M17 違反)。
  for (const rawLine of s.split('\n')) {
    const codeOnly = rawLine.replace(/\/\/.*$/, '')  // 去行尾註解
    if (/fieldCtx\??\.size/.test(codeOnly)) { scattered.push(`${rel}: ${rawLine.trim().slice(0, 80)}`); break }
  }
}

if (violations.length || scattered.length) {
  if (violations.length) {
    console.error(`❌ Field 控件未用 useResolvedFieldSize 解析 size(size 不會隨 <Field size>/cell surface 流動):`)
    violations.forEach((v) => console.error(`   - ${v}`))
  }
  if (scattered.length) {
    console.error(`❌ 散落直讀 fieldCtx.size(應走 useResolvedFieldSize SSOT,prop > fieldCtx.size > surface-size > fallback):`)
    scattered.forEach((v) => console.error(`   - ${v}`))
  }
  console.error(`\n   修:改 \`const size = useResolvedFieldSize(sizeProp[, fallback])\`(取代 size 預設 / 散落 fieldCtx?.size)。`)
  console.error(`   SSOT:components/Field/field-context.ts useResolvedFieldSize<T>(generic + 自訂 fallback,Rating 'xs' / SegmentedControl 'md')。`)
  process.exit(1)
}
console.log(`✓ Field size-resolve gate:${checked} 個 Field 控件全經 useResolvedFieldSize + 0 散落 fieldCtx.size(SSOT 統一)`)
