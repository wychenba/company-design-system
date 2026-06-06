import { readFileSync, writeFileSync } from 'node:fs'
const D = '.claude/logs/deep-audit-2026-06-05'
const m = JSON.parse(readFileSync(`${D}/master-findings.json`, 'utf8'))

// heuristic fix-type bucket
const A11Y_RX = /role=|role:|aria-|<nav|SheetTitle|tabIndex|tab stop|keyboard|Enter|Space|focus trap|focusable|aria-labelledby|aria-busy|role="region"|role="button"|screen reader|報讀器/i
const SUBSTANTIVE_RX = /API surface|barrel|isInternal|internal:true|export 成 public|public API|abstraction|拆|收緊|naming 漂移|命名慣例|design language|設計語言/i
function bucket(f) {
  const txt = `${f.claim || f.raw || ''} ${f.codeReality || ''} ${f.fileLine || f.path || ''}`
  if (SUBSTANTIVE_RX.test(txt)) return 'SUBSTANTIVE'
  if (A11Y_RX.test(txt)) return 'CODE_A11Y'
  return 'DOC_STALE'
}

const buckets = { DOC_STALE: [], CODE_A11Y: [], SUBSTANTIVE: [] }
for (const f of m.claudeA1b) buckets[bucket(f)].push({ src: 'claude', ...f })
for (const f of m.claudeDim) buckets[bucket(f)].push({ src: 'claude-dim', ...f })
for (const f of m.codexOnlyList) buckets[bucket(f)].push({ src: 'codex-only', ...f })

console.log('═══ FIX-TYPE BUCKETS (heuristic) ═══')
for (const [k, v] of Object.entries(buckets)) console.log(`${k}: ${v.length}`)

console.log('\n═══ P0 (Claude, 8) ═══')
for (const f of m.claudeA1b.filter((x) => x.severity === 'P0')) {
  console.log(`\n[${f.unit}] ${f.fileLine}\n  claim: ${(f.claim || '').slice(0, 130)}\n  reality: ${(f.codeReality || '').slice(0, 170)}`)
}

console.log('\n\n═══ DIM findings (Claude, 14) ═══')
for (const f of m.claudeDim) console.log(`[${f.dim || f.unit || '?'}] ${f.fileLine || ''} — ${(f.claim || f.issue || '').slice(0, 120)}`)

console.log('\n\n═══ CODEX dim-72 API-surface cluster (SUBSTANTIVE) ═══')
for (const f of m.codexFindings.filter((x) => x.unit === '72')) console.log(`  ${f.raw.replace(/^72\|/, '')}`)

console.log('\n═══ CODEX-only non-substantive (need Step 4.5 verify) ═══')
const codexOnlyVerify = m.codexOnlyList.filter((f) => bucket(f) !== 'SUBSTANTIVE')
console.log(`count: ${codexOnlyVerify.length}`)

writeFileSync(`${D}/buckets.json`, JSON.stringify(buckets, null, 1))
console.log('\n→ buckets.json written')
