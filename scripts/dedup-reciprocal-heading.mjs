#!/usr/bin/env node
/**
 * dedup-reciprocal-heading.mjs — Cleanup duplicate「## 被引用」headings(codex M31 P2 finding 2026-05-27)
 *
 * Root: add-reciprocal-pointers.mjs only regenerates files with NEW inbound,既有 dup
 * never get cleaned. This script: scan ALL *.spec.md, if duplicate「## 被引用」heading
 * exists, keep ONLY THE LAST occurrence(latest auto-maintain run output)+ remove
 * earlier dups. Idempotent.
 *
 * Usage: node scripts/dedup-reciprocal-heading.mjs [--check]
 */
import fs from 'node:fs'
import { execSync } from 'node:child_process'

const CHECK_MODE = process.argv.includes('--check')
const HEADER = '## 被引用(auto-maintained,Dim 3 reciprocal audit)'

const files = execSync('grep -rl "## 被引用.auto-maintained.Dim 3 reciprocal audit" packages/design-system/src --include="*.spec.md" 2>/dev/null', { encoding: 'utf-8' })
  .split('\n')
  .filter(Boolean)

const fixed = []
let driftCount = 0

for (const f of files) {
  const content = fs.readFileSync(f, 'utf-8')
  const lines = content.split('\n')
  const headerIndices = []
  lines.forEach((l, i) => {
    if (l.trim() === HEADER) headerIndices.push(i)
  })

  if (headerIndices.length <= 1) continue  // no dup
  driftCount++

  if (CHECK_MODE) {
    console.log(`DRIFT: ${f} has ${headerIndices.length} occurrences at lines: ${headerIndices.map((i) => i + 1).join(', ')}`)
    continue
  }

  // Keep LAST section, remove all prior dups (incl their content up to before last header)
  const lastHeaderIdx = headerIndices[headerIndices.length - 1]
  // Remove from first header index to lastHeaderIdx - 1
  const firstHeaderIdx = headerIndices[0]
  const newLines = [
    ...lines.slice(0, firstHeaderIdx),
    ...lines.slice(lastHeaderIdx),
  ]
  // Clean trailing/leading blank lines around removed gap
  const newContent = newLines.join('\n').replace(/\n{3,}/g, '\n\n')
  fs.writeFileSync(f, newContent)
  fixed.push(f)
}

if (CHECK_MODE) {
  if (driftCount > 0) {
    console.error(`❌ ${driftCount} files have duplicate「${HEADER}」headings.`)
    console.error(`   Run: node scripts/dedup-reciprocal-heading.mjs`)
    process.exit(1)
  }
  console.log('✓ No duplicate reciprocal headings detected')
  process.exit(0)
}

console.log(`✓ Fixed ${fixed.length} files with duplicate「${HEADER}」headings:`)
fixed.forEach((f) => console.log(`   - ${f}`))
