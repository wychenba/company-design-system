#!/usr/bin/env node
/**
 * Batch-add reciprocal pointers to spec.md files (Dim 3 fix).
 *
 * For every A→B cross-spec pointer in a SSOT context (相關 / SSOT / See also / 近親 / 家族 / 消費 section),
 * ensure B has a back-pointer to A. If B lacks a「被引用」section, append one at EOF with all incoming sources grouped.
 *
 * Strategy:
 *   - Find all A→B pointers via regex
 *   - Classify as SSOT (within 6-line context of SSOT keywords) vs casual
 *   - Build reverse map (B → set of A's)
 *   - For each B with missing reverse pointers: append an auto-maintained
 *     「## 被引用(auto-maintained from audit Dim 3)」section listing sources
 *
 * Idempotent: section is regenerated each run (no duplication).
 */

import fs from 'node:fs'
import path from 'node:path'
import { globSync } from 'node:fs'

const root = process.cwd()
// 2026-05-31(infra-audit P1):原本只是 mutator(writeFileSync)無 verify gate → dim 3 標 DETERMINISTIC
// 卻無 --check = 紙上保證。加 --check:compare-only,reciprocal pointer 有 drift 則 exit 1(CI gate)。
const CHECK = process.argv.includes('--check')
const drifted = []
const SPECS = globSync('packages/design-system/src/**/*.spec.md', { cwd: root }).map((p) => path.join(root, p))

// Build pointer map
const pointers = [] // { from: abspath, fromBase, to: basename, line, context }

for (const f of SPECS) {
  const content = fs.readFileSync(f, 'utf-8')
  const lines = content.split('\n')
  for (const m of content.matchAll(/([\w\-/.]+\.spec\.md)/g)) {
    const target = m[1].split('/').pop()
    const fromBase = path.basename(f)
    if (target === fromBase) continue
    const offset = m.index
    const lineNum = content.slice(0, offset).split('\n').length
    const ctxStart = Math.max(0, lineNum - 6)
    const ctx = lines.slice(ctxStart, lineNum).join('\n')
    const isSsot = /相關|SSOT|See also|近親|家族|消費|參考/i.test(ctx)
    pointers.push({ from: f, fromBase, to: target, line: lineNum, isSsot })
  }
}

// Reverse map
const reverse = new Map() // target basename -> Set of source basenames (SSOT only)
const existingEdges = new Set() // "A→B" key for any pointer
for (const p of pointers) {
  existingEdges.add(`${p.fromBase}→${p.to}`)
  if (p.isSsot) {
    if (!reverse.has(p.to)) reverse.set(p.to, new Set())
    reverse.get(p.to).add(p.fromBase)
  }
}

// Find gaps: B needs reverse pointer from A if `A→B` is SSOT and `B→A` doesn't exist
const gapsByTarget = new Map() // target basename -> Set of source basenames
for (const p of pointers) {
  if (!p.isSsot) continue
  const reverseEdge = `${p.to}→${p.fromBase}`
  if (existingEdges.has(reverseEdge)) continue // reciprocal exists
  if (!gapsByTarget.has(p.to)) gapsByTarget.set(p.to, new Set())
  gapsByTarget.get(p.to).add(p.fromBase)
}

// Resolve each basename → actual file path (since multiple specs may have same basename, use map from SPECS)
const pathByBase = new Map()
for (const f of SPECS) pathByBase.set(path.basename(f), f)

// Auto-section marker
const SECTION_HEADER = '## 被引用(auto-maintained,Dim 3 reciprocal audit)'
const SECTION_NOTE = '> 本節由 `scripts/add-reciprocal-pointers.mjs` 自動維護,列出在 SSOT 語境下指向本 spec 的其他 spec。若要手動補充,寫在本節之前。'

let updatedCount = 0
let targetCount = 0
const updated = []
const skipped = []

for (const [targetBase, sources] of gapsByTarget.entries()) {
  const targetPath = pathByBase.get(targetBase)
  if (!targetPath) {
    skipped.push(`${targetBase}: file not found`)
    continue
  }
  targetCount++
  const content = fs.readFileSync(targetPath, 'utf-8')

  // Build new section
  const sortedSources = [...sources].sort()
  const newSection = [
    '',
    SECTION_HEADER,
    '',
    SECTION_NOTE,
    '',
    ...sortedSources.map((src) => `- \`${src}\``),
    '',
  ].join('\n')

  // Idempotent regenerate(2026-05-10 v2 bug fix):
  // 1. Remove ALL existing reciprocal sections with global flag(handles dup case
  //    accumulated from previous buggy runs)
  // 2. Append fresh section once
  // Original bug:'m' flag + lookahead `$` lazy-stopped at first newline,causing
  // dup section accumulation across runs。7 specs corrupted before discovery
  // (button/notice/action-bar/element-anatomy/overlay-surface/layoutSpace/uiSize)。
  const sectionRe = new RegExp(
    `\\n*${SECTION_HEADER.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}[\\s\\S]*?(?=\\n## |$)`,
    'g',  // global flag = remove ALL existing(handles dup)
  )
  const cleaned = content.replace(sectionRe, '').trimEnd()
  const newContent = cleaned + '\n' + newSection

  if (newContent !== content) {
    if (CHECK) {
      drifted.push(`${targetBase} (${sortedSources.length} inbound — reciprocal pointer 缺/過時)`)
    } else {
      fs.writeFileSync(targetPath, newContent)
      updatedCount++
      updated.push(`${targetBase} (${sortedSources.length} inbound)`)
    }
  }
}

if (CHECK) {
  if (drifted.length) {
    console.log(`\n❌ Dim 3 reciprocal-pointer drift:${drifted.length} spec(s) 的「被引用」back-pointer 缺/過時:`)
    for (const d of drifted) console.log(`  ${d}`)
    console.log(`\n修法:跑 \`node scripts/add-reciprocal-pointers.mjs\`(無 --check)auto-regenerate 後 commit。`)
    process.exit(1)
  }
  console.log('✅ Dim 3:所有 spec reciprocal pointer 同步,0 drift')
  process.exit(0)
}

console.log(`\n✅ Updated ${updatedCount} target spec(s) with reciprocal pointers`)
console.log(`   Total gap pairs closed: ${[...gapsByTarget.values()].reduce((a, s) => a + s.size, 0)}`)
console.log(`\nTargets updated:`)
for (const u of updated.slice(0, 60)) console.log(`  ${u}`)
if (updated.length > 60) console.log(`  ... +${updated.length - 60} more`)
if (skipped.length) {
  console.log(`\n⚠️  Skipped:`)
  for (const s of skipped) console.log(`  ${s}`)
}
