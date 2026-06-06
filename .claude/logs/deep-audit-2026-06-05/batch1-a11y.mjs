// Batch 1 — user-approved (Q1「補 code」2026-06-05) clear a11y/density fixes.
// Run: CLAUDE_BYPASS_DESIGN_APPROVAL=1 node batch1-a11y.mjs
import { readFileSync, writeFileSync } from 'node:fs'
if (process.env.CLAUDE_BYPASS_DESIGN_APPROVAL !== '1') { console.error('refuse: bypass not set'); process.exit(2) }
const R = 'packages/design-system/src/components'
const edits = [
  // ── Calendar: navAriaLabel prop (interface) ──
  {
    f: `${R}/Calendar/calendar.tsx`,
    old: `  prevAriaLabel?: string
  nextAriaLabel?: string
  viewToggleAriaLabel?: string`,
    neo: `  prevAriaLabel?: string
  nextAriaLabel?: string
  /** 月份導覽 <nav> landmark 的 aria-label。Override for i18n. */
  navAriaLabel?: string
  viewToggleAriaLabel?: string`,
    label: 'Calendar navAriaLabel interface',
  },
  // ── Calendar: navAriaLabel default ──
  {
    f: `${R}/Calendar/calendar.tsx`,
    old: `  nextAriaLabel = '下個月', // i18n-allow: DS default; consumer override via nextAriaLabel prop
  viewToggleAriaLabel`,
    neo: `  nextAriaLabel = '下個月', // i18n-allow: DS default; consumer override via nextAriaLabel prop
  navAriaLabel = '行事曆月份導覽', // i18n-allow: DS default; consumer override via navAriaLabel prop
  viewToggleAriaLabel`,
    label: 'Calendar navAriaLabel default',
  },
  // ── DropdownMenu Content: data-density="md" (Portal-escape lock, per density.spec.md:107) ──
  {
    f: `${R}/DropdownMenu/dropdown-menu.tsx`,
    old: `      align={align}
      onCloseAutoFocus={(e) => e.preventDefault()}`,
    neo: `      align={align}
      data-density="md"
      onCloseAutoFocus={(e) => e.preventDefault()}`,
    label: 'DropdownMenu Content data-density',
  },
  // ── Tooltip Content: data-density="md" (Portal-escape lock, per density.spec.md:108) ──
  {
    f: `${R}/Tooltip/tooltip.tsx`,
    old: `      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(
        "z-50 overflow-hidden`,
    neo: `      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      data-density="md"
      className={cn(
        "z-50 overflow-hidden`,
    label: 'Tooltip Content data-density',
  },
]
for (const e of edits) {
  const src = readFileSync(e.f, 'utf8')
  const n = src.split(e.old).length - 1
  if (n !== 1) { console.error(`✗ ${e.label}: expected 1 match, got ${n}`); process.exit(1) }
  writeFileSync(e.f, src.replace(e.old, e.neo))
  console.log(`✓ ${e.label}`)
}
console.log(`applied ${edits.length} edits`)
