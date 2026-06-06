// Batch 3 — dim-72(user Q2): @internal jsDoc on element-anatomy 的 3 個 L3 primitive
// (element-anatomy 是 public pattern,留在 root barrel,故這 3 個 sub-export 需 @internal IDE 訊號)。
import { readFileSync, writeFileSync } from 'node:fs'
if (process.env.CLAUDE_BYPASS_DESIGN_APPROVAL !== '1') { console.error('refuse: bypass not set'); process.exit(2) }
const F = 'packages/design-system/src/patterns/element-anatomy/item-anatomy.tsx'
const edits = [
  {
    old: `export const RowSizeProvider = RowSizeContext.Provider`,
    neo: `/** @internal — L3 row-size primitive;app code 不直接 import,由 MenuItem/Row/Field 等內部消費(inline-action.spec.md)。 */
export const RowSizeProvider = RowSizeContext.Provider`,
  },
  {
    old: `export const ItemInlineActionButton = React.forwardRef<`,
    neo: `/** @internal — L3 inline-action primitive;app code 禁直接 import,經 MenuItem/Row endActions 消費(inline-action.spec.md)。 */
export const ItemInlineActionButton = React.forwardRef<`,
  },
  {
    old: `export const ItemInlineAction = React.forwardRef<`,
    neo: `/** @internal — L3 inline-action primitive;app code 禁直接 import,經 row 元件消費(inline-action.spec.md)。 */
export const ItemInlineAction = React.forwardRef<`,
  },
]
let src = readFileSync(F, 'utf8')
for (const e of edits) {
  const n = src.split(e.old).length - 1
  if (n !== 1) { console.error(`✗ expected 1 match, got ${n}: ${e.old.slice(0, 50)}`); process.exit(1) }
  src = src.replace(e.old, e.neo)
}
writeFileSync(F, src)
console.log(`✓ applied ${edits.length} @internal markers to item-anatomy.tsx`)
