// Bypass-edit helper for user-approved a11y code fixes (Q1「補 code」2026-06-05).
// Runs only under CLAUDE_BYPASS_DESIGN_APPROVAL=1 (audit-logged). Literal string replace, fail-loud.
import { readFileSync, writeFileSync } from 'node:fs'
if (process.env.CLAUDE_BYPASS_DESIGN_APPROVAL !== '1') {
  console.error('refuse: CLAUDE_BYPASS_DESIGN_APPROVAL!=1'); process.exit(2)
}
const editsFile = process.argv[2]
const edits = JSON.parse(readFileSync(editsFile, 'utf8'))
let applied = 0
for (const e of edits) {
  const src = readFileSync(e.file, 'utf8')
  const count = src.split(e.old).length - 1
  if (count === 0) { console.error(`✗ NOT FOUND in ${e.file}:\n${e.old.slice(0, 120)}`); process.exit(1) }
  if (count > 1 && !e.all) { console.error(`✗ AMBIGUOUS (${count}×) in ${e.file}: ${e.old.slice(0, 80)}`); process.exit(1) }
  writeFileSync(e.file, e.all ? src.split(e.old).join(e.new) : src.replace(e.old, e.new))
  applied++
  console.log(`✓ ${e.file} ${e.label || ''}`)
}
console.log(`applied ${applied} edit(s)`)
