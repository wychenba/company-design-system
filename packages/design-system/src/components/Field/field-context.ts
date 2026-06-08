import * as React from 'react'
import type { FieldMode, FieldVariant } from './field-types'

// ── Types ──
export type { FieldMode, FieldVariant }
export type FieldOrientation = 'vertical' | 'horizontal'
export type FieldSize = 'sm' | 'md' | 'lg'
export type FieldControlLayout = 'inline' | 'block'

/**
 * Field surface(2026-05-12 codex Q2 verdict — Stream C 4-issues Cluster B fix):
 * 替代散落的 `variant === 'naked'` 判 cell heuristic,讓 Field family components
 * 顯式 query「我在哪 surface」derive cell-specific padding / alignment / overflow。
 *
 * - `'form'`(default)— Standalone Field control(對齊 Polaris / Material Form idiom)
 * - `'toolbar'`— Toolbar / Action bar inline Field(future,目前無 consumer)
 * - `'table-cell'`— DataTable cell-as-input substrate(取代 variant='naked' cell-detection
 *   heuristic;canonical metrics 由 surface 推導,不再 hardcode in Field consumer)
 */
type FieldSurface = 'form' | 'toolbar' | 'table-cell'

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
  /** 2026-05-12 Stream C Cluster B fix:surface 上下文(form / toolbar / table-cell)
   *  從 host(Field wrapper / DataTable cell registry)propagate 給 child controls。
   *  Optional — 未設視同 `'form'`(backward compat)。 */
  surface?: FieldSurface
}

export const FieldContext = React.createContext<FieldContextValue | null>(null)

/** 讓 primitive（Checkbox/Switch/Radio/Button/Input 等）讀 Field context */
export function useFieldContext(): FieldContextValue | null {
  return React.useContext(FieldContext)
}

/**
 * Surface context — **獨立於 FieldContext** 的 surface signal(2026-05-12 v2 fix)。
 *
 * 原 v1 設計(`FieldSurfaceProvider` 透過 FieldContext.Provider 注入)誤把 stub
 * `hasFieldWrapper: true` 傳給沒有真正 Field wrapper 的場景(例 DataTable cell 內 standalone
 * DatePicker),導致 cells 誤以為有 Field 父 → 視覺 regression(2026-05-12 visual-audit 抓 3
 * stories 超過 baseline budget:DatePicker range-picker / FileViewer open-snapshot /
 * DataTable pinned-columns)。
 *
 * v2 修:**完全分離** FieldSurfaceContext;FieldContext 不被污染;non-FieldWrapper hosts
 * 只能影響 surface signal,不能假冒 Field wrapper 身份。
 */
const FieldSurfaceContext = React.createContext<FieldSurface | null>(null)

/**
 * Helper: 取當前 surface,fall back 'form'。
 *
 * Stream C Cluster B canonical entry point — Field family controls 用此 helper 替代
 * 散落的 `variant === 'naked'` cell heuristic。對齊 codex Q2 verdict「surface context」
 * canonical(替代「inCellContext per-prop」反 pattern)。
 *
 * 優先順序:FieldSurfaceContext(host-provided) → FieldContext.surface(Field-wrapper-provided)
 *           → fallback 'form'。
 */
export function useFieldSurface(): FieldSurface {
  const surfaceCtx = React.useContext(FieldSurfaceContext)
  if (surfaceCtx) return surfaceCtx
  const fieldCtx = React.useContext(FieldContext)
  return fieldCtx?.surface ?? 'form'
}

/**
 * Standalone FieldSurface provider — 給 host(non-Field-wrapper, 如 DataTable cell)
 * **僅**設 surface signal,**不**污染 FieldContext。
 *
 * Usage(per cell-registry.tsx,2026-05-12):
 *   <FieldSurfaceProvider surface="table-cell"><Field control /></FieldSurfaceProvider>
 *
 * 與 FieldContext.Provider 差別:
 *   - FieldContext.Provider — 完整 Field wrapper 用,provides mode/variant/disabled/...
 *   - FieldSurfaceProvider — host **僅**注 surface signal,Field controls 透過
 *     `useFieldSurface()` 讀;`useFieldContext()` 仍 returns null(沒被假冒)。
 */
export function FieldSurfaceProvider({
  surface,
  children,
}: {
  surface: FieldSurface
  children: React.ReactNode
}): React.ReactElement {
  return React.createElement(FieldSurfaceContext.Provider, { value: surface }, children)
}

/**
 * 2026-05-13 (c) scroll-defer perf SSOT(per codex DataTable perf brief V3 + user 拍板
 * 「Roadmap still >50ms 進 (c)」):
 * Host(DataTable)在 virtualizer.isScrolling=true 期間 wrap children with `TableScrollProvider`,
 * 重 cell 組件(Avatar HoverCard / PeoplePicker / etc.)讀此 signal 跳過昂貴 subtree(如 HoverCard
 * Portal + useDocumentTheme observer),scroll 結束 unset → 重渲染為完整 affordance。
 *
 * 對齊 codex Profile Plan step 6(Scripting vs Layout 判分):scrolling 期間 cell 渲染壓縮 →
 * 240ms/frame catastrophe → close to 50ms target。世界級對齊:AG Grid `deferRender` for slow
 * React cell components / MUI X DataGrid scroll-defer hover affordance。
 *
 * 不放在 FieldSurfaceContext 內(避免 value object identity drift on scroll → 全 cell 重渲)
 * — 用獨立 Context,value = boolean primitive(stable when unchanged)。
 */
const TableScrollContext = React.createContext<boolean>(false)

export function useTableIsScrolling(): boolean {
  return React.useContext(TableScrollContext)
}

export function TableScrollProvider({
  isScrolling,
  children,
}: {
  isScrolling: boolean
  children: React.ReactNode
}): React.ReactElement {
  return React.createElement(TableScrollContext.Provider, { value: isScrolling }, children)
}

/**
 * Surface size signal — 獨立於 FieldContext + FieldSurfaceContext 的純視覺 size context(2026-06-08)。
 * 讓 host(DataTable cell substrate)把「這片 surface 的 density size」propagate 給 child Field controls,
 * 未來新 cell 漏傳 size prop 也自動繼承 → 字級一致(根治 StringCell/NumberCell 漏傳 size class)。
 *
 * 不放進 FieldSurfaceContext value(避免 string→object identity drift on scroll → 全 cell 重渲,
 * 同 TableScrollContext L119-121 canonical)— 獨立 Context,value = FieldSize primitive(stable when unchanged)。
 * 絕不污染 FieldContext:不碰 hasFieldWrapper/mode/invalid/disabled,useFieldContext() 在 cell 內仍 null。
 */
const FieldSurfaceSizeContext = React.createContext<FieldSize | null>(null)

/**
 * Resolve Field control size — 控件用此 helper 取代散落的 `sizeProp ?? fieldCtx?.size ?? 'md'`。
 * 優先序:prop(caller 顯式)> FieldContext.size(真 <Field> wrapper)> surface-size(host 如 cell)> 'md'。
 * 真 <Field> 永遠勝 host surface(安全序);cell 無 Field wrapper(fieldCtx=null)→ 自動接 surface-size,
 * 漏傳 size 的新 cell 也字級一致。
 */
export function useResolvedFieldSize(sizeProp?: FieldSize | null): FieldSize {
  const fieldCtx = React.useContext(FieldContext)
  const surfaceSize = React.useContext(FieldSurfaceSizeContext)
  return sizeProp ?? fieldCtx?.size ?? surfaceSize ?? 'md'
}

/**
 * Host(non-Field-wrapper,如 DataTable cell)注 surface density size 給 child Field controls。
 * 僅注 size 視覺訊號,不污染 FieldContext。Usage:cell-registry buildCellWithSurface。
 */
export function FieldSurfaceSizeProvider({
  size,
  children,
}: {
  size: FieldSize
  children: React.ReactNode
}): React.ReactElement {
  return React.createElement(FieldSurfaceSizeContext.Provider, { value: size }, children)
}
