#!/usr/bin/env node
/**
 * Replace TODO placeholder in anatomy.stories.tsx Accessibility story
 * with proper spec reference now that spec.md has A11y section
 * (2026-05-18 follow-up to batch-add-a11y-spec-section.mjs).
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const files = execSync('grep -l "TODO.*A11y\\|尚無「## A11y 預設」段" $(find src/design-system/components -name "*.anatomy.stories.tsx")', { encoding: 'utf-8' }).trim().split('\n').filter(Boolean)

function extractComponentName(filePath) {
  const m = filePath.match(/components\/([^/]+)\//)
  return m ? m[1] : null
}

function extractSpecA11y(specPath) {
  try {
    const content = readFileSync(specPath, 'utf-8')
    const m = content.match(/##\s+A11y[^\n]*\n([\s\S]*?)(?=\n##\s|\n---|\n```|$)/)
    if (!m) return null
    return m[1].trim().slice(0, 600)
  } catch {
    return null
  }
}

let updated = 0
let skipped = 0
for (const file of files) {
  const compName = extractComponentName(file)
  if (!compName) { skipped++; continue }

  const tsxKebab = compName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  // Find spec.md(prefer kebab-named main spec)
  const candidatePaths = execSync(`ls src/design-system/components/${compName}/*.spec.md 2>/dev/null || true`, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean)
  const specPath = candidatePaths.find(p => p.endsWith(`/${tsxKebab}.spec.md`)) || candidatePaths[0]
  if (!specPath) { skipped++; continue }

  const specA11y = extractSpecA11y(specPath)
  if (!specA11y) { skipped++; continue }

  const summary = specA11y.replace(/[`*\\]/g, ' ').slice(0, 500)
  const newNoteRaw = `詳 \`${tsxKebab}.spec.md\` 「A11y 預設」段。摘要:\n\n${summary}`
  // JSON-stringify content for embedding into `{"..."}` JSX expression(escape newlines properly)
  const newNoteJsonEscaped = JSON.stringify(newNoteRaw).slice(1, -1) // strip outer quotes

  let content = readFileSync(file, 'utf-8')
  // Replace TODO placeholder with new note(broken-content recovery + first-time replacement both 走 same path)
  // Match either:
  //   (a) original TODO placeholder("[TODO]...尚無...")
  //   (b) prior broken multi-line content from buggy v1(starts with 詳 X.spec.md「A11y...,multi-line through `})
  content = content.replace(
    /\[TODO\][^"`]+尚無「## A11y 預設」段[^"`]+/g,
    newNoteJsonEscaped
  )
  // Recover from buggy v1 unterminated string literal — `<p>{"詳 ...A11y 預設」段。摘要:\n\n...<span literal newlines>...}</p>`
  // Re-find broken Accessibility story and rewrite cleanly
  const brokenMatch = content.match(/<p className="whitespace-pre-line">\{"詳 [^]*?\}<\/p>/)
  if (brokenMatch && !brokenMatch[0].endsWith('"}</p>')) {
    // Replace whole broken <p> with properly-escaped version
    content = content.replace(brokenMatch[0], `<p className="whitespace-pre-line">{"${newNoteJsonEscaped}"}</p>`)
  }
  writeFileSync(file, content, 'utf-8')
  updated++
}

console.log(`Updated: ${updated}`)
console.log(`Skipped: ${skipped}`)
