#!/usr/bin/env node
/**
 * Recovery script: rebuild broken Accessibility story exports in anatomy.stories.tsx
 * (caused by 2026-05-18 batch-update-anatomy-a11y-note.mjs v1 bug — multi-line content
 *  embedded as raw string in JSX `{"..."}` literal).
 *
 * Strategy: for each anatomy.stories.tsx, if it has `whitespace-pre-line">{"詳 ...` pattern
 * (or any broken-multiline Accessibility), regex-find the entire
 * `export const Accessibility = {...}` block and rebuild with JSON.stringify.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()

function findAllAnatomyStories() {
  return execSync(`find src/design-system -name "*.anatomy.stories.tsx" -type f`, { encoding: 'utf-8' })
    .trim().split('\n').filter(Boolean)
}

function extractComponentNameFromPath(filePath) {
  const m = filePath.match(/components\/([^/]+)\//)
  return m ? m[1] : null
}

function extractSpecA11y(specPath) {
  try {
    const content = readFileSync(`${ROOT}/${specPath}`, 'utf-8')
    const m = content.match(/##\s+A11y[^\n]*\n([\s\S]*?)(?=\n##\s|\n---|\n```|$)/)
    if (!m) return null
    return m[1].trim().slice(0, 600)
  } catch {
    return null
  }
}

function findSpecPath(compName) {
  const dir = `src/design-system/components/${compName}`
  const kebab = compName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  const main = `${dir}/${kebab}.spec.md`
  if (execSync(`test -f ${main} && echo yes || echo no`, { encoding: 'utf-8' }).trim() === 'yes') return main
  // fallback: any *.spec.md in dir
  const fallback = execSync(`ls ${dir}/*.spec.md 2>/dev/null | head -1 || true`, { encoding: 'utf-8' }).trim()
  return fallback || null
}

let recovered = 0
let skipped = 0
for (const file of findAllAnatomyStories()) {
  const content = readFileSync(`${ROOT}/${file}`, 'utf-8')

  // Detect broken Accessibility export: contains `whitespace-pre-line">{"` followed by content
  // spanning multiple raw lines(unterminated string literal).
  // Heuristic: look for `whitespace-pre-line">{"詳` AND newline chars before closing `"}` on next-100 chars
  const brokenIdx = content.search(/whitespace-pre-line">\{"詳/)
  if (brokenIdx === -1) {
    skipped++
    continue
  }
  // Check if it's broken (raw newline between `{"` and `"}`)
  const after = content.slice(brokenIdx, brokenIdx + 2000)
  const firstClose = after.indexOf('"}')
  const firstNewline = after.indexOf('\n')
  if (firstClose !== -1 && firstClose < firstNewline) {
    // Already properly escaped, no broken multi-line
    skipped++
    continue
  }

  const compName = extractComponentNameFromPath(file)
  const specPath = findSpecPath(compName)
  const specA11y = specPath ? extractSpecA11y(specPath) : null
  if (!specA11y) {
    console.log(`  ⚠️ no spec A11y for ${compName} — leave broken`)
    skipped++
    continue
  }

  const kebab = compName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  const summary = specA11y.replace(/[`*\\]/g, ' ').slice(0, 500)
  const note = `詳 \`${kebab}.spec.md\` 「A11y 預設」段。摘要:\n\n${summary}`
  const noteJsonStr = JSON.stringify(note) // properly escaped string with quotes

  // Rebuild Accessibility export — replace whole block from `export const Accessibility = {` to matching `}` end
  // Use regex to find the block. Block structure (per batch-add-a11y-stub.mjs):
  //   export const Accessibility = {
  //     name: '無障礙',
  //     render: () => (
  //       <div ...>
  //         <h3 ...>無障礙設計</h3>
  //         <p ...>{"..."}</p>
  //       </div>
  //     ),
  //   }
  //
  // Replace the broken <p>{"..."}</p> line with single-line properly-escaped version
  // Match the broken multi-line: from `<p className="whitespace-pre-line">{"詳` to next `</p>`
  const newP = `<p className="whitespace-pre-line">{${noteJsonStr}}</p>`
  const updated = content.replace(
    /<p className="whitespace-pre-line">\{"詳[\s\S]*?<\/p>/,
    newP
  )
  if (updated === content) {
    console.log(`  ⚠️ regex no-match for ${file}`)
    skipped++
    continue
  }
  writeFileSync(`${ROOT}/${file}`, updated, 'utf-8')
  recovered++
}

console.log(`Recovered: ${recovered}`)
console.log(`Skipped: ${skipped}`)
