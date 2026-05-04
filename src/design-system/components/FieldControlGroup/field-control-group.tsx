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
        // ── 派 B 架構(2026-05-04 重構,inspired by Material OutlinedInput NotchedOutline):
        //   FCG outer 自帶 border + rounded-md + overflow-hidden(group 整體 frame)
        //   Cells 內部 border-0 + rounded-none + bg-transparent(讓 outer frame 主導)
        //   Disabled cell 保留 bg-disabled(state 視覺承載,M24)
        //   Internal divider 用 ::before pseudo(absolute positioned 1px line)
        //   Cell state(hover/focus/error)用 box-shadow inset 取代 border(避免 outer frame 衝突)
        //
        // 為什麼派 B:bg-disabled 在 -ml-px overlap 模式下會 vs edit cell 產生 bg 色差視覺分隔線(派 A 物理限制)。
        //   派 B 由 outer frame 主導 group integrity,cells 不再彼此 border overlap,
        //   disabled bg 不會在邊界產生「darker divider」對比放大效應(verified Material OutlinedInput 適配)。
        // Source:Material OutlinedInput NotchedOutlineRoot(absolute-positioned overlay frame),
        //   github.com/mui/material-ui/blob/v6.0.0/packages/mui-material/src/OutlinedInput/OutlinedInput.js
        className={cn(
          block ? 'flex w-full' : 'inline-flex',
          'items-stretch',
          // outer frame:static border + rounded + overflow-hidden(clip cell corners)
          //   ⚠️ outer 不套 hover/focus state — state 全 cell-level(派 A UX 一致)
          'border border-border rounded-md overflow-hidden bg-surface',
          // cells:lose own border/rounded(let outer frame dominate),保留 own bg
          '[&>*]:!border-0 [&>*]:!rounded-none',
          '[&>*]:relative [&>*]:z-[2]',
          // suppress native browser focus outline(Safari black ring on inner select etc)
          '[&_*]:focus-visible:outline-none',
          // internal divider:::before pseudo on cells[2..]
          "[&>*+*]:before:content-[''] [&>*+*]:before:absolute [&>*+*]:before:left-0 [&>*+*]:before:top-0 [&>*+*]:before:bottom-0 [&>*+*]:before:w-px [&>*+*]:before:bg-border [&>*+*]:before:pointer-events-none [&>*+*]:before:z-[1]",
          // cell-level state visuals via box-shadow inset(派 A UX 對齊):
          //   hover → border-hover ring(該 cell only)
          //   focus-within → ring color(DS focus,2px inset)
          //   error → error ring
          '[&>*:hover]:shadow-[inset_0_0_0_1px_var(--border-hover)] [&>*:hover]:z-[3]',
          '[&>*:focus-within]:shadow-[inset_0_0_0_2px_var(--ring)] [&>*:focus-within]:z-[3]',
          '[&>*[data-error]]:shadow-[inset_0_0_0_1px_var(--error)] [&>*[data-error]]:z-[3]',
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
