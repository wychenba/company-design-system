#!/usr/bin/env node
/**
 * Batch-add `## A11y 預設` section to 29 specs missing it.
 * Codified per codex Phase B F4 finding 2026-05-18:30 anatomy stories had TODO placeholder
 * because compile-stories.mjs auto-generates TODO when spec.md lacks A11y section.
 *
 * Strategy:
 *   - Detect Radix base from .tsx import
 *   - Generate component-specific A11y stub citing Radix / cmdk / native
 *   - Insert section before `## 相關` or `## 被引用` heading; append at end if neither
 *
 * Usage: node scripts/batch-add-a11y-spec-section.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()

// 29 components missing A11y section (per audit 2026-05-18)
const COMPONENTS = [
  'Menu', 'Breadcrumb', 'HoverCard', 'Switch', 'Select', 'DropdownMenu',
  'Chip', 'PeoplePicker', 'Field', 'NumberInput', 'Input', 'SegmentedControl',
  'TreeView', 'OverflowIndicator', 'DataTable', 'Sheet', 'Steps', 'Notice',
  'SelectMenu', 'Textarea', 'Button', 'Slider', 'Calendar', 'SelectionControl',
  'LinkInput', 'RadioGroup', 'Checkbox', 'Tabs', 'Tooltip',
]

function findSpecPath(compName) {
  const dir = `src/design-system/components/${compName}`
  if (!existsSync(`${ROOT}/${dir}`)) return null
  const files = execSync(`ls ${dir}/*.spec.md 2>/dev/null || true`, { encoding: 'utf-8' })
    .trim().split('\n').filter(Boolean)
  // Prefer main spec (component-name.spec.md, not form-validation / menu-item / selection-item)
  // pick the one matching kebab-case of compName
  const kebab = compName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  const main = files.find(f => f.endsWith(`/${kebab}.spec.md`))
  return main || files[0] || null
}

function findTsxPath(compName) {
  const dir = `src/design-system/components/${compName}`
  const kebab = compName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  const main = `${dir}/${kebab}.tsx`
  return existsSync(`${ROOT}/${main}`) ? main : null
}

function detectBase(tsxPath) {
  if (!tsxPath) return { type: 'unknown', module: null }
  const content = readFileSync(`${ROOT}/${tsxPath}`, 'utf-8')
  const radix = content.match(/@radix-ui\/react-([a-z-]+)/)?.[1]
  if (radix) return { type: 'radix', module: radix }
  if (content.match(/from\s+['"]cmdk['"]/)) return { type: 'cmdk', module: 'cmdk' }
  if (content.match(/<input\s|<textarea\s|HTMLInputElement|HTMLTextAreaElement/)) return { type: 'native-input', module: null }
  return { type: 'self-built', module: null }
}

const RADIX_DOCS = (mod) => `https://www.radix-ui.com/primitives/docs/components/${mod}#accessibility`

// Per-component A11y section content
function buildA11ySection(compName, base) {
  const lines = ['## A11y 預設', '']

  if (base.type === 'radix') {
    lines.push(`**ARIA / Pattern**:繼承 Radix \`${base.module}\` primitive a11y 預設(role / aria-* / 鍵盤導覽)。詳 [Radix Accessibility docs](${RADIX_DOCS(base.module)})。`, '')

    // Per-component keyboard map
    const keyboards = {
      'HoverCard': ['Tab — 進入 trigger', 'Hover / focus — 開啟 card', 'Esc — 關閉'],
      'Switch': ['Tab — focus', 'Space / Enter — toggle on/off'],
      'DropdownMenu': ['Tab — focus trigger', 'Enter / Space / ↓ — 開啟', '↑/↓ — 導覽 items', 'Enter — 選擇', 'Esc — 關閉'],
      'SegmentedControl': ['Tab — 進入 group(focus 在第一個或選中項)', '←/→ — 切 segment', 'Enter / Space — 選擇'],
      'Chip': ['Tab — 進入 group', '←/→ — 切換', 'Enter / Space — toggle'],
      'TreeView': ['Tab — 進入 tree', '↑/↓ — 導覽 items', '←/→ — collapse/expand', 'Enter — activate'],
      'Sheet': ['Tab — focus trap 在 sheet 內', 'Esc — 關閉', 'Shift+Tab — 反向 focus 循環'],
      'Slider': ['Tab — focus thumb', '←/→ — 微調', 'Home/End — min/max', 'PageUp/Down — 大步階'],
      'RadioGroup': ['Tab — 進入 group', '↑/↓ — 切 option', 'Space — 選擇'],
      'Tabs': ['Tab — 進入 TabList', '←/→ — 切 tab', 'Home/End — 第一 / 最後 tab', 'Enter / Space — activate'],
      'Tooltip': ['Tab — focus trigger 時顯示', 'Esc — 關閉'],
      'Breadcrumb': ['Tab — 逐個 link 導覽', 'Enter — navigate'],
    }
    if (keyboards[compName]) {
      lines.push('**Keyboard 行為**:', '')
      keyboards[compName].forEach(k => lines.push(`- ${k}`))
      lines.push('')
    }

    lines.push(`**Focus**:Radix primitive 自管 focus trap / restoration / visible ring(\`outline: 2px solid var(--ring)\` per design-system focus-visible canonical)。`, '')
  } else if (base.type === 'cmdk') {
    lines.push(`**ARIA / Pattern**:基於 \`cmdk\` library a11y(combobox / listbox / option role + aria-activedescendant)。詳 [cmdk a11y](https://cmdk.paco.me/#accessibility)。`, '')
    lines.push('**Keyboard 行為**:', '')
    if (compName === 'Select' || compName === 'SelectMenu') {
      lines.push('- Tab — focus trigger', '- Enter / Space / ↓ — 開啟 menu', '- ↑/↓ — 導覽 options', '- Enter — 選擇', '- 字母鍵 — type-ahead 過濾(search 模式)', '- Esc — 關閉')
    }
    lines.push('', '**Focus**:menu 開啟時 focus 第一 option / 選中項;關閉時 focus 回 trigger。')
    lines.push('')
  } else if (base.type === 'native-input') {
    lines.push(`**ARIA / Pattern**:native \`<${compName === 'Textarea' ? 'textarea' : 'input'}>\` element 預設 a11y;Field wrapper 補 \`aria-labelledby\` / \`aria-invalid\` / \`aria-describedby\`。`, '')
    lines.push('**Keyboard 行為**:', '')
    if (compName === 'NumberInput') {
      lines.push('- Tab — focus', '- ↑/↓ — 加 / 減 step', '- 字母鍵 — 輸入數字')
    } else {
      lines.push('- Tab — focus', '- 字母鍵 — 輸入', '- Esc — 清空(若 clearable + 有值)')
    }
    lines.push('', '**Focus**:native input focus ring;DS focus-visible ring(\`focus-visible:!border-primary\`)由 Field wrapper 提供。')
    lines.push('')
  } else {
    // self-built — generic stub citing W3C ARIA APG
    lines.push(`**ARIA / Pattern**:對齊 [W3C ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/) 對應 pattern。`, '')
    // Per-component keyboard map for self-built
    const keyboards = {
      'Menu': ['Tab — focus container', '↑/↓ — 導覽 items', 'Enter — activate', 'Esc — 關閉(若在 menu context)'],
      'PeoplePicker': ['Tab — focus trigger', 'Enter / Space — 開啟 picker', '字母鍵 — type-ahead 搜尋', '↑/↓ — 導覽 people', 'Enter — 選擇 / 取消選擇'],
      'Field': ['Tab — focus internal control(Input / Select / DatePicker 等)', 'Esc — 取消 edit mode(若 cell-as-input)'],
      'OverflowIndicator': ['Tab — focus indicator', 'Enter — show overflow menu'],
      'DataTable': ['Tab — 進入 table', '↑/↓/←/→ — cell navigation', 'Enter — 進入 cell edit', 'Esc — 退出 edit', 'Space — toggle row select', 'Shift+click — range select'],
      'Steps': ['Tab — focus step(若 clickable)', 'Enter — navigate to step'],
      'Notice': ['Tab — focus dismiss button(若 dismissible)', 'Esc — dismiss(若 dismissible)'],
      'Button': ['Tab — focus', 'Enter / Space — activate'],
      'Calendar': ['Tab — focus calendar', '↑/↓/←/→ — 切 day', 'PageUp/Down — 切月', 'Shift+PageUp/Down — 切年', 'Enter — 選 date', 'Esc — 取消 / 關閉'],
      'SelectionControl': ['Tab — focus', 'Space — toggle'],
      'LinkInput': ['Tab — focus', 'Enter — confirm URL', 'Esc — 清空'],
    }
    if (keyboards[compName]) {
      lines.push('**Keyboard 行為**:', '')
      keyboards[compName].forEach(k => lines.push(`- ${k}`))
      lines.push('')
    }
    lines.push(`**Focus**:focus-visible ring 對齊 DS canonical(\`outline: 2px solid var(--ring)\`);focus management 由元件 own。`, '')
  }

  lines.push('**驗證**:Storybook a11y addon panel 應 0 critical violation;鍵盤完整可操作(無需滑鼠)。WCAG AA contrast ≥ 4.5:1(text)/ 3:1(UI)。', '')

  return lines.join('\n')
}

function insertA11ySection(specPath, section) {
  const full = `${ROOT}/${specPath}`
  const content = readFileSync(full, 'utf-8')

  // Already has A11y section? skip
  if (/^##\s+A11y/m.test(content)) {
    return { status: 'already-has', specPath }
  }

  // Insert before `## 相關` heading; if not found, before `## 被引用`; if neither, append
  let updated
  if (/\n##\s+相關\b/.test(content)) {
    updated = content.replace(/\n(##\s+相關\b)/, `\n${section}\n$1`)
  } else if (/\n##\s+被引用/.test(content)) {
    updated = content.replace(/\n(##\s+被引用)/, `\n${section}\n$1`)
  } else {
    updated = content.trimEnd() + '\n\n' + section + '\n'
  }

  writeFileSync(full, updated, 'utf-8')
  return { status: 'inserted', specPath }
}

// Main
const results = { inserted: [], 'already-has': [], 'no-spec': [] }
for (const comp of COMPONENTS) {
  const specPath = findSpecPath(comp)
  if (!specPath) {
    results['no-spec'].push(comp)
    continue
  }
  const tsxPath = findTsxPath(comp)
  const base = detectBase(tsxPath)
  const section = buildA11ySection(comp, base)
  const r = insertA11ySection(specPath, section)
  results[r.status].push(`${comp} (base=${base.type}${base.module ? ':' + base.module : ''})`)
}

console.log(`Inserted: ${results.inserted.length}`)
results.inserted.forEach(r => console.log(`  + ${r}`))
console.log(`Already has: ${results['already-has'].length}`)
results['already-has'].forEach(r => console.log(`  = ${r}`))
console.log(`No spec found: ${results['no-spec'].length}`)
results['no-spec'].forEach(r => console.log(`  ? ${r}`))
