import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
const D = '.claude/logs/deep-audit-2026-06-05'
const briefs = ['B1-date','B2-select','B3-overlay','B4-controls','B5-field','B6-radix-recent','B7-feedback','B8-crosscut']
let out = []
let all = []
const seen = new Set()
for (const b of briefs) {
  let txt
  try { txt = readFileSync(join(D, `codex-${b}.txt`), 'utf8') } catch { continue }
  out.push(`\n### ${b}`)
  const lines = txt.split('\n')
  for (const raw of lines) {
    const l = raw.replace(/\r$/, '').trim()
    // finding line: starts with Word, has ≥3 pipes, ends with P0/P1/P2, references a real src path
    const isFinding = /\|P[012]$/.test(l) && l.includes('packages/design-system/src/') && (l.match(/\|/g) || []).length >= 3
    // exclude the prompt-echo (contains 『 or the literal "P0/P1/P2")
    const isEcho = l.includes('『') || l.includes('P0/P1/P2') || l.startsWith('輸出') || l.includes('invariant')
    const isClean = /\|\s*CLEAN/.test(l) && l.includes('|')
    const isTotal = /^TOTAL:/.test(l)
    if (isFinding && !isEcho) {
      if (seen.has(l)) continue // dedup: codex streams each finding ~2x
      seen.add(l)
      out.push(l)
      all.push({ brief: b, line: l })
    } else if (isClean && !isEcho && !seen.has(l)) {
      seen.add(l); out.push(l)
    }
  }
}
writeFileSync(join(D, 'codex-findings-consolidated.txt'), out.join('\n'))
// severity tally
const sev = { P0: 0, P1: 0, P2: 0 }
for (const f of all) { const m = f.line.match(/\|P([012])$/); if (m) sev['P' + m[1]]++ }
console.log(`extracted ${all.length} finding lines → codex-findings-consolidated.txt`)
console.log(`severity: P0=${sev.P0} P1=${sev.P1} P2=${sev.P2}`)
