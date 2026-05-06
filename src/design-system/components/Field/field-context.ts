import * as React from 'react'
import type { FieldMode, FieldVariant } from './field-types'

// ── Types ──
export type { FieldMode, FieldVariant }
export type FieldOrientation = 'vertical' | 'horizontal'
export type FieldSize = 'sm' | 'md' | 'lg'
export type FieldControlLayout = 'inline' | 'block'

// ── Context ──
export interface FieldContextValue {
  id: string
  /** a11y(2026-04-25):FieldLabel 渲染時若元素為 div-based role(combobox/slider
   * 等非 native form control),`<label for>` 無效,需 aria-labelledby 指向 labelId。
   * FieldLabel 自動設 id={labelId},下游 control 可讀此值寫入 aria-labelledby。 */
  labelId: string
  descriptionId: string
  errorId: string
  mode: FieldMode
  /** 視覺外殼透傳(2026-05-05)。default = 含 border+bg;bare = 透明 variant,hover/focus reveal。
   *  child Field control 自動繼承,per-control prop override 可覆寫。詳 field-types.ts。 */
  variant: FieldVariant
  disabled: boolean
  required: boolean
  invalid: boolean
  size: FieldSize
  orientation: FieldOrientation
  controlLayout: FieldControlLayout
  hasFieldWrapper: true
}

export const FieldContext = React.createContext<FieldContextValue | null>(null)

/** 讓 primitive（Checkbox/Switch/Radio/Button/Input 等）讀 Field context */
export function useFieldContext(): FieldContextValue | null {
  return React.useContext(FieldContext)
}
