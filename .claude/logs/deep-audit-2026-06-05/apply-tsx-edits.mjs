// Apply workflow-emitted .tsx DOC_STALE edits (doc-to-code alignment). Fail-loud, atomic-per-file.
// user-approved Q1/Q2 + autonomous doc-align. Run: CLAUDE_BYPASS_DESIGN_APPROVAL=1 node apply-tsx-edits.mjs
import { readFileSync, writeFileSync } from 'node:fs'
if (process.env.CLAUDE_BYPASS_DESIGN_APPROVAL !== '1') { console.error('refuse: bypass not set'); process.exit(2) }
const edits = JSON.parse(readFileSync('.claude/logs/deep-audit-2026-06-05/tsx-edits.json', 'utf8'))
// group by file → apply sequentially within file (a later edit's anchor may depend on earlier state)
const byFile = {}
for (const e of edits) (byFile[e.file] ||= []).push(e)
let applied = 0
const failures = []
for (const [file, fileEdits] of Object.entries(byFile)) {
  let src
  try { src = readFileSync(file, 'utf8') } catch { failures.push({ file, reason: 'file not readable' }); continue }
  let working = src
  const pending = []
  for (const e of fileEdits) {
    const n = working.split(e.old).length - 1
    if (n === 1) { working = working.replace(e.old, e.new); pending.push(e) }
    else failures.push({ file, n, finding: (e.finding || '').slice(0, 70), old: e.old.slice(0, 60) })
  }
  if (pending.length) { writeFileSync(file, working); applied += pending.length }
}
console.log(`✓ applied ${applied}/${edits.length} tsx edits`)
if (failures.length) {
  console.log(`\n✗ ${failures.length} edits failed (no/ambiguous match — need manual):`)
  for (const f of failures) console.log(`  [${f.n ?? '?'}×] ${f.file} | ${f.finding || f.reason} | old="${f.old || ''}"`)
}
writeFileSync('.claude/logs/deep-audit-2026-06-05/tsx-apply-failures.json', JSON.stringify(failures, null, 1))
