#!/usr/bin/env node
/**
 * Story auto-compile Phase 2 — best-effort auto-fill from spec text.
 *
 * For each component:
 *   1. Read spec.md, find variant descriptions(headings / bullet lists / tables)
 *   2. For each variant key in frontmatter, try to extract 1-sentence purpose
 *   3. Replace `TODO: Phase 2 fill` with extracted text(if confident)
 *   4. Same for sizes
 *   5. Leave `world-class: []` as-is(judgment-only lookup)
 *
 * Strategy: regex-based extraction of common patterns:
 *   - `- \`variantKey\` — description`(bullet list)
 *   - `| \`variantKey\` | description |`(table row)
 *   - `**variantKey**: description`(bold markdown)
 *   - H3 `### variantKey`(next paragraph is description)
 *
 * Conservative: if confidence low, leave TODO.
 */

import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const COMPONENTS_DIR = 'src/design-system/components'

function toKebab(name) {
  return name.replace(/[A-Z]/g, (c, i) => (i === 0 ? c.toLowerCase() : `-${c.toLowerCase()}`))
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extract variant/size descriptions from spec body.
 * Returns { [key]: description } for found keys.
 */
function extractDescriptions(specBody, keys) {
  const result = {}
  for (const key of keys) {
    const eKey = escapeRe(key)
    const patterns = [
      // Bullet: `- \`key\` — desc`
      new RegExp(`[-*]\\s*\`${eKey}\`\\s*[—=:-]+\\s*([^\\n\`]{5,150})`, 'm'),
      // Bullet bold: `- **key** — desc`
      new RegExp(`[-*]\\s*\\*\\*${eKey}\\*\\*\\s*[—=:-]+\\s*([^\\n]{5,150})`, 'm'),
      // Table row: `| \`key\` | desc |` or `| \`key\`（預設）| desc |`
      new RegExp(`\\|\\s*\`?${eKey}\`?[^|\\n]*\\|\\s*([^\\n|]{5,150})`, 'm'),
      // H3/H4: `### key` then next paragraph
      new RegExp(`^#{2,4}\\s+\`?${eKey}\`?[^\\n]*\\n+\\s*([^\\n#]{10,300})`, 'm'),
      // cva comment: `key: 'desc',`(inside tsx parsed earlier,but spec has similar format sometimes)
      new RegExp(`${eKey}\\s*[:—]\\s*([^\\n。,]{10,150})`, 'm'),
    ]
    for (const re of patterns) {
      const m = specBody.match(re)
      if (m && m[1]) {
        let desc = m[1]
          .replace(/^\s+|\s+$/g, '')
          .replace(/\*+/g, '')
          .replace(/`/g, '')
          .replace(/\s+/g, ' ')
          .slice(0, 120)
        // Skip empty/useless extractions
        if (desc.length >= 10 && !/^(TODO|待|未定|N\/A)/i.test(desc)) {
          result[key] = desc
          break
        }
      }
    }
  }
  return result
}

function processComponent(componentName) {
  const kebab = toKebab(componentName)
  const tsxPath = path.join(COMPONENTS_DIR, componentName, `${kebab}.tsx`)
  const specPath = path.join(COMPONENTS_DIR, componentName, `${kebab}.spec.md`)

  if (!fs.existsSync(tsxPath) || !fs.existsSync(specPath)) {
    return { component: componentName, skipped: true, reason: 'missing file' }
  }

  const tsx = fs.readFileSync(tsxPath, 'utf-8')
  const spec = fs.readFileSync(specPath, 'utf-8')

  // Parse spec frontmatter to find variants/sizes
  const fmMatch = spec.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fmMatch) return { component: componentName, skipped: true, reason: 'no frontmatter' }

  let fm
  try {
    fm = yaml.load(fmMatch[1])
  } catch {
    return { component: componentName, skipped: true, reason: 'yaml parse error' }
  }
  if (!fm) return { component: componentName, skipped: true, reason: 'empty frontmatter' }

  const variantKeys = Object.keys(fm.variants || {})
  const sizeKeys = Object.keys(fm.sizes || {})
  const specBody = spec.slice(fmMatch[0].length)

  const variantDescs = extractDescriptions(specBody, variantKeys)
  // Sizes often don't have prose descriptions;use DS convention defaults
  const SIZE_DEFAULTS = {
    xs: 'row-embedded inline(e.g. FileItem rich action / DataTable row action)',
    sm: 'form field-height 28 / compact chrome / dialog / panel context',
    md: 'default general UI',
    lg: 'touch / prominent CTA / stakeholder-facing surface',
  }
  const sizeDescs = { ...extractDescriptions(specBody, sizeKeys) }
  for (const key of sizeKeys) {
    if (sizeDescs[key]) continue
    if (SIZE_DEFAULTS[key]) sizeDescs[key] = SIZE_DEFAULTS[key]
  }

  const filled = { variants: 0, sizes: 0 }

  // Update spec frontmatter
  let newFmYaml = fmMatch[1]
  for (const key of variantKeys) {
    const desc = variantDescs[key]
    if (!desc) continue
    // Replace `when: "TODO: Phase 2 fill"` → `when: "desc"` within the variants key block
    // Naive: find `{key}:\n    when: "TODO..."`
    const replaceRe = new RegExp(
      `(\\s+${escapeRe(key)}:\\s*\\n\\s+when:\\s*)"TODO:[^"]*"`,
      'm',
    )
    if (replaceRe.test(newFmYaml)) {
      newFmYaml = newFmYaml.replace(replaceRe, `$1"${desc.replace(/"/g, '\\"')}"`)
      filled.variants++
    }
  }
  for (const key of sizeKeys) {
    const desc = sizeDescs[key]
    if (!desc) continue
    // Format A: multi-line `  key:\n    when: "TODO..."`
    const replaceReA = new RegExp(
      `(\\s+${escapeRe(key)}:\\s*\\n\\s+when:\\s*)"TODO:[^"]*"`,
      'm',
    )
    // Format B: inline `  key: { when: "TODO..." }`
    const replaceReB = new RegExp(
      `(\\s+${escapeRe(key)}:\\s*\\{[^}]*when:\\s*)"TODO:[^"]*"`,
      'm',
    )
    if (replaceReA.test(newFmYaml)) {
      newFmYaml = newFmYaml.replace(replaceReA, `$1"${desc.replace(/"/g, '\\"')}"`)
      filled.sizes++
    } else if (replaceReB.test(newFmYaml)) {
      newFmYaml = newFmYaml.replace(replaceReB, `$1"${desc.replace(/"/g, '\\"')}"`)
      filled.sizes++
    }
  }

  // Also handle format A for variants(was only handling inline before)
  for (const key of variantKeys) {
    const desc = variantDescs[key]
    if (!desc) continue
    const replaceReA = new RegExp(
      `(\\s+${escapeRe(key)}:\\s*\\n\\s+when:\\s*)"TODO:[^"]*"`,
      'm',
    )
    if (replaceReA.test(newFmYaml)) {
      newFmYaml = newFmYaml.replace(replaceReA, `$1"${desc.replace(/"/g, '\\"')}"`)
      filled.variants++
    }
  }

  // Update tsx componentMeta purpose
  let newTsx = tsx
  for (const key of variantKeys) {
    const desc = variantDescs[key]
    if (!desc) continue
    const replaceRe = new RegExp(
      `(\\s+${escapeRe(key)}:\\s*\\{\\s*purpose:\\s*)'TODO:[^']*'`,
      'm',
    )
    if (replaceRe.test(newTsx)) {
      newTsx = newTsx.replace(replaceRe, `$1'${desc.replace(/'/g, "\\'")}'`)
    }
  }

  if (newFmYaml !== fmMatch[1]) {
    const newSpec = '---\n' + newFmYaml + '\n---\n' + specBody
    fs.writeFileSync(specPath, newSpec)
  }
  if (newTsx !== tsx) fs.writeFileSync(tsxPath, newTsx)

  return {
    component: componentName,
    ok: true,
    filled,
    variantKeys: variantKeys.length,
    sizeKeys: sizeKeys.length,
  }
}

const targets = fs
  .readdirSync(COMPONENTS_DIR)
  .filter((d) => fs.statSync(path.join(COMPONENTS_DIR, d)).isDirectory())

const results = targets.map(processComponent)
const ok = results.filter((r) => r.ok)
const skipped = results.filter((r) => r.skipped)

const totalVariants = ok.reduce((s, r) => s + r.variantKeys, 0)
const filledVariants = ok.reduce((s, r) => s + r.filled.variants, 0)
const totalSizes = ok.reduce((s, r) => s + r.sizeKeys, 0)
const filledSizes = ok.reduce((s, r) => s + r.filled.sizes, 0)

console.log(`\n✅ Phase 2 auto-fill attempted on ${ok.length} components`)
console.log(`   variants: ${filledVariants} / ${totalVariants} filled`)
console.log(`   sizes: ${filledSizes} / ${totalSizes} filled`)
console.log(`   (remainder = spec doesn't describe the variant/size directly;leave TODO for manual review)`)

if (ok.length <= 30) {
  console.log('\nPer-component results:')
  for (const r of ok) {
    if (r.filled.variants + r.filled.sizes > 0) {
      console.log(`  ${r.component}: variants ${r.filled.variants}/${r.variantKeys},sizes ${r.filled.sizes}/${r.sizeKeys}`)
    }
  }
}

if (skipped.length) {
  console.log(`\n⚠️  Skipped:`)
  for (const s of skipped) console.log(`  ${s.component}: ${s.reason}`)
}
