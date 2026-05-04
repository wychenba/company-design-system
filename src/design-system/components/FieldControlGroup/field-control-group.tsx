// ── 消費的 SSOT ──
// - patterns/element-anatomy/element-anatomy.spec.md(Field 家族邊界)
// - components/Field/field-wrapper.tsx(field-height token via h-field-{sm,md,lg})
// - components/Field/field-context.ts(useFieldContext / size cascade)
// - tokens/uiSize/uiSize.spec.md(--field-height-{sm,md,lg})
// - 世界級對照:Ant Space.Compact compact-item.ts(verified github.com/ant-design/ant-design/blob/master/components/style/compact-item.ts)
//   Bootstrap input-group.scss(verified github.com/twbs/bootstrap/blob/v5.3.3/scss/forms/_input-group.scss)
//
import * as React from 'react'
import { cn } from '@/lib/utils'
import type { FieldSize } from '@/design-system/components/Field/field-context'

/**
 * FieldControlGroup — 多個 Field controls 視覺接合成一個 input frame
 *
 * **Naming rationale**(2026-05-04):
 * - Taxonomic 一致:FieldGroup(多 Field 堆疊)/ FieldControlGroup(多 control 接合)— scope 區分
 * - Idiom 一致:ButtonGroup(多 Button 接合)同 pattern,只是 X = field control
 * - 不撞 RadioGroup/CheckboxGroup(那是 1-question 多 options semantic group)
 *
 * **Behavior canonical**(verified Ant compact-item.ts L21-58):
 * - 子 controls 保留自身 border + radius;不 strip
 * - 鄰接子用負 margin 重疊 border(Bootstrap 也用此手法 但用 z-index 確保 focus 在最上層)
 * - first child 只留左 radii / last child 只留右 radii / middle 全 0 radii
 * - z-index:default 2 / hover|focus|focus-within 3 / disabled 0
 * - Container `display: inline-flex`(Ant default)/ `block` prop → `display: flex; width: 100%`
 *
 * **Size cascade**(對齊 Field family):
 * - `size` prop default = md;cascade 到 children via implicit context inheritance(children 自管 size 或繼承 useFieldContext)
 * - Mode A:整個 FieldControlGroup 包進 Field 當 control slot,size 自動從 Field context 來
 * - Mode B:standalone 用,size 由 prop 控制
 *
 * **Width 配置**(Ant Space.Compact W-A canonical):
 * - 子 controls 自管 width(`className="w-[140px]"` / `style={{width:120}}` / `flex-1` etc.)
 * - FieldControlGroup 不另開 Cell wrapper(避免 indirection,符合 Ant idiom)
 *
 * **使用範例**:
 * ```tsx
 * // Filter row: 2 fixed select + 1 flex value
 * <FieldControlGroup>
 *   <Select className="w-[140px]" options={fields} />
 *   <Select className="w-[120px]" options={ops} />
 *   <Input className="flex-1" placeholder="輸入值..." />
 * </FieldControlGroup>
 *
 * // Phone: country code + number
 * <Field>
 *   <FieldLabel>電話</FieldLabel>
 *   <FieldControlGroup>
 *     <Select className="w-[80px]" options={codes} />
 *     <Input className="flex-1" />
 *   </FieldControlGroup>
 * </Field>
 *
 * // Search + button
 * <FieldControlGroup>
 *   <Input className="flex-1" />
 *   <Button variant="primary">搜尋</Button>
 * </FieldControlGroup>
 * ```
 */

export interface FieldControlGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Children size cascade(Mode B);Mode A 從 Field context 來 */
  size?: FieldSize
  /** Block 模式:width 100% 撐滿 parent(對齊 Ant Space.Compact `block` prop) */
  block?: boolean
}

const FieldControlGroup = React.forwardRef<HTMLDivElement, FieldControlGroupProps>(
  ({ size: _size = 'md', block = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        // ── Ant compact-item 機制(verified):
        //   [&>*]:relative — 子套 relative 才能 z-index 生效
        //   [&>*]:z-[2] — default z 2(Ant 同值)
        //   [&>*+*]:-ml-px — 鄰接子 margin-left -1px 重疊 border
        //   hover/focus/focus-within → z-3(active border 在最上層,Bootstrap 用 z-5,Ant 用 z-3 我們對齊 Ant)
        //   first/middle/last radii:對齊 Ant compactItemBorderRadius L67-92
        // ── Children 自管 width(W-A,Ant idiom);Group 自身僅控制 border/radius/z-index 接合機制
        className={cn(
          block ? 'flex w-full' : 'inline-flex',
          'items-stretch',
          // z-index baseline + active layer
          '[&>*]:relative [&>*]:z-[2]',
          '[&>*:hover]:z-[3] [&>*:focus]:z-[3] [&>*:focus-within]:z-[3]',
          '[&>*[disabled]]:z-0 [&>*:has([disabled])]:z-0',
          // border overlap
          '[&>*+*]:-ml-px',
          // border radius — 中間 0,首/尾保留外側 radii
          '[&>*:not(:first-child):not(:last-child)]:rounded-none',
          '[&>*:first-child:not(:last-child)]:rounded-r-none',
          '[&>*:last-child:not(:first-child)]:rounded-l-none',
          // K12 fix(2026-05-04 v3 — 完美 divider canonical):FCG 內 disabled cell 同時 override bg+border:
          //   1. `bg-transparent` 取代 global `bg-disabled` — disabled cell 內部 bg 跟 edit cell 一致(白底),
          //      避免 cell 邊界 bg 色差自動產生「視覺分隔線」(灰白交界即使 border 透明也 visible)
          //   2. `border-border` 強制保留 group integrity — divider 跟 edit-edit divider 視覺完全一致
          //   disabled state 改靠 `cursor-not-allowed` + 灰文字(M24 fg-disabled)+ readonly 行為呈現,不靠 bg
          //   FCG 本身已是 framing,內部 cells 不需 bg 區分 disabled state
          //   World-class 對照:Linear / Notion / Airtable filter row partial-disabled / Ant Space.Compact 共識
          '[&>*[data-field-mode="disabled"]]:bg-transparent',
          '[&>*[data-field-mode="disabled"]]:border-border',
          className,
        )}
        data-field-control-group=""
        {...props}
      >
        {children}
      </div>
    )
  },
)
FieldControlGroup.displayName = 'FieldControlGroup'

export { FieldControlGroup }
