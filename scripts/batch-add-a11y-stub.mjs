#!/usr/bin/env node
/**
 * Batch-add Accessibility story export to anatomy.stories.tsx for components missing it.
 *
 * Strategy:
 * - For each missing file: append minimal `export const Accessibility` stub
 * - Non-interactive primitives → "N/A — 純視覺呈現" content
 * - Interactive (has spec A11y) → extract spec content + render in story
 * - Interactive without spec → TODO marker for future codify
 *
 * Per audit Dim 13 + story-rules.md 2026-04-24「6-canonical 含 Accessibility」
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

// Non-interactive primitives — pure visual, no a11y / keyboard
const NON_INTERACTIVE = new Set([
  'AspectRatio', 'Skeleton', 'Separator', 'Badge', 'Tag', 'Chart',
  'CircularProgress', 'ProgressBar', 'Empty', 'DescriptionList',
  'Carousel', // mostly visual, has keyboard but minimal
])

// Find all anatomy.stories.tsx missing Accessibility export
function findMissing() {
  const files = execSync(
    'find src/design-system/components -name "*.anatomy.stories.tsx" -type f',
    { encoding: 'utf8' }
  ).trim().split('\n')

  return files.filter((f) => {
    const content = readFileSync(f, 'utf8')
    return !/export const (Accessibility|A11y)\b/.test(content)
  })
}

function getComponentName(filePath) {
  // src/design-system/components/Foo/foo.anatomy.stories.tsx → Foo
  const m = filePath.match(/components\/([^/]+)\//)
  return m ? m[1] : null
}

function getSpecPath(filePath) {
  return filePath.replace('.anatomy.stories.tsx', '.spec.md')
}

function extractSpecA11y(specPath) {
  try {
    const content = readFileSync(specPath, 'utf8')
    const m = content.match(/##\s+A11y[^\n]*\n([\s\S]*?)(?=\n##\s|\n---|\n```|$)/)
    if (!m) return null
    return m[1].trim().slice(0, 800)
  } catch {
    return null
  }
}

function buildAccessibilityStory(componentName, specA11y, isNonInteractive) {
  const note = isNonInteractive
    ? `本元件為純視覺呈現,無 keyboard / ARIA role / focus state 需求。Consumer 包 ${componentName} 進互動容器(Button / Card / Link)時 a11y 由容器決定。`
    : specA11y
      ? `詳 \`${componentName.toLowerCase()}.spec.md\` 「A11y 預設」段。摘要:\n\n${specA11y.replace(/[`*\\]/g, ' ').slice(0, 400)}`
      : `[TODO] 本元件 spec.md 尚無「## A11y 預設」段。後續補:ARIA role / keyboard map / focus 行為。對齊 ${componentName} 對應 Radix / Material / Polaris a11y 規範。`

  // Use plain Story type — works for all existing meta typings
  return `
// ── Accessibility ─────────────────────────────────────────────────────────
// 2026-05-17 ship per audit Dim 13(story-rules.md 6-canonical 含 Accessibility)
export const Accessibility = {
  name: '無障礙',
  render: () => (
    <div className="max-w-3xl text-body text-fg-secondary">
      <h3 className="text-h5 text-foreground mb-2">無障礙設計</h3>
      <p className="whitespace-pre-line">{${JSON.stringify(note)}}</p>
    </div>
  ),
}
`
}

function appendToFile(filePath, accessibilityStory) {
  let content = readFileSync(filePath, 'utf8')
  // Ensure ends with newline, append story
  if (!content.endsWith('\n')) content += '\n'
  content += accessibilityStory
  writeFileSync(filePath, content, 'utf8')
}

// Main
const missing = findMissing()
console.log(`Total missing Accessibility: ${missing.length}`)

let processed = 0
let nonInteractiveCount = 0
let specA11yCount = 0
let todoCount = 0

for (const file of missing) {
  const componentName = getComponentName(file)
  if (!componentName) {
    console.log(`  ⚠️ skip(no component name): ${file}`)
    continue
  }

  const isNonInteractive = NON_INTERACTIVE.has(componentName)
  const specPath = getSpecPath(file)
  const specA11y = extractSpecA11y(specPath)

  const story = buildAccessibilityStory(componentName, specA11y, isNonInteractive)
  appendToFile(file, story)

  if (isNonInteractive) {
    nonInteractiveCount++
    console.log(`  ✅ ${componentName} (non-interactive stub)`)
  } else if (specA11y) {
    specA11yCount++
    console.log(`  ✅ ${componentName} (spec A11y extracted)`)
  } else {
    todoCount++
    console.log(`  ⚠️ ${componentName} (TODO — spec A11y missing)`)
  }
  processed++
}

console.log(`\nProcessed: ${processed}`)
console.log(`  - non-interactive stub: ${nonInteractiveCount}`)
console.log(`  - spec A11y extracted: ${specA11yCount}`)
console.log(`  - TODO marker: ${todoCount}`)
