// same-row-mixed-allow: header chrome corner buttons(close)跟 row inline actions(trash)不在同 row
// code-quality-allow: file-size — 2026-05-03 M21 retract:filter-value-picker.tsx(187 行 / 1 consumer)inline 回本檔。panel 從 505 → 687 行,進 transition zone 但未過 800 hard cap。等 inline filter UI 接入第 2 consumer 再考慮抽出。
import * as React from 'react'
import { Plus, Trash2, X as XIcon, RotateCcw } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Button } from '@/design-system/components/Button/button'
import { Select, type SelectOption } from '@/design-system/components/Select/select'
import { Combobox } from '@/design-system/components/Combobox/combobox'
import { Input } from '@/design-system/components/Input/input'
import { NumberInput } from '@/design-system/components/NumberInput/number-input'
import { DatePicker, DatePickerRange } from '@/design-system/components/DatePicker/date-picker'
import { SurfaceHeader, SurfaceBody } from '@/design-system/patterns/overlay-surface/overlay-surface'
import { PopoverTitle, PopoverClose } from '@/design-system/components/Popover/popover'
import { ButtonDivider } from '@/design-system/components/Button/button-group'
import type { ColumnType } from './column-types'
import { getColumnId, getColumnLabel, getColumnMeta } from './lib/column-meta'
import {
  OPERATOR_REGISTRY,
  DEFAULT_OPERATOR,
  DATE_RELATIVE_OPTIONS,
  DATE_RELATIVE_GROUPS,
  getOperatorSpec,
  getValueShape,
  type ValueShape,
} from './filter-operators'
import {
  createEmptyFilterTree,
  isFilterTreeActive,
  isFilterTreeEqual,
  evaluateTree,
  dataTableFilterMatch,
  type Conjunction,
  type FilterCondition,
  type FilterGroup,
  type FilterTree,
  type FilterTreeFlat,
  type FilterTreeNested,
} from './filter-tree'

// Re-export public API from filter-tree(consumer 既有 import path 不變)
export {
  createEmptyFilterTree,
  isFilterTreeActive,
  evaluateTree,
  dataTableFilterMatch,
}
export type { Conjunction, FilterCondition, FilterGroup, FilterTree, FilterTreeFlat, FilterTreeNested }

/**
 * DataTableFilterPanel — ClickUp-style 進階篩選 panel
 *
 * 對齊 ClickUp / Airtable / Notion / Coda / Linear advanced-filter 派 —
 * parenthesized boolean expression builder。
 *
 * 兩種 mode 由 consumer 拍板:
 * - `flat`:root 下只能裝 condition,無 group
 * - `nested`:root 下裝 1+ group(灰底框),每個 group 內裝 1+ condition,**剛好 1 層**
 *
 * Source-of-truth:
 * - Operator definitions:`./filter-operators.ts` `OPERATOR_REGISTRY`(SSOT,禁 hardcode op 字串)
 * - Filter state:**FilterTree**(本檔自管;搭配 TanStack `globalFilter` 求值)
 *
 * 詳:`./advanced-filter.draft.md` + `./advanced-filter-operators.draft.md`
 */

// ── Internal — id seed ──────────────────────────────────────────────────

let _idSeed = 0
const newId = () => `f${++_idSeed}-${Date.now().toString(36)}`

// ── Helpers — internal types ────────────────────────────────────────────

interface FilterColumn {
  id: string
  label: string
  type: ColumnType
  options?: Array<{ value: string; label: string }>
  includeTime?: boolean
}

function extractColumns<TData>(columns: ColumnDef<TData, any>[]): FilterColumn[] {
  const out: FilterColumn[] = []
  for (const col of columns) {
    const id = getColumnId(col)
    if (!id || id === '__select__') continue
    const meta = getColumnMeta(col)
    const type: ColumnType | undefined = meta?.type
    if (!type) continue
    if (meta?.filterable === false) continue
    out.push({
      id,
      label: getColumnLabel(col, id),
      type,
      options: meta?.options,
      includeTime: meta?.includeTime,
    })
  }
  return out
}

function getOperatorOptions(type?: ColumnType): SelectOption[] {
  const registry = type && OPERATOR_REGISTRY[type] ? OPERATOR_REGISTRY[type] : OPERATOR_REGISTRY.string
  return registry.map((op) => ({ value: op.op, label: op.label }))
}

function getDefaultOperator(type?: ColumnType): string {
  return (type && DEFAULT_OPERATOR[type]) || DEFAULT_OPERATOR.string
}

const newCondition = (firstCol: FilterColumn | undefined): FilterCondition => ({
  kind: 'cond',
  id: newId(),
  field: firstCol?.id ?? '',
  op: firstCol ? getDefaultOperator(firstCol.type) : '',
  value: '',
})

const newGroup = (firstCol: FilterColumn | undefined): FilterGroup => ({
  kind: 'group',
  id: newId(),
  conjunction: 'or',                                // group 內 default OR(對齊 ref 圖)
  children: [newCondition(firstCol)],
})

// ── Internal — FilterValuePicker(value-picker switcher per ValueShape)──
//
// 2026-05-03 M21 retract:本 helper 原本獨立檔 `filter-value-picker.tsx`,
// claim「未來 inline filter UI 共用」但只 1 consumer(本 panel)= 違 M21
// premature abstraction。inline 回 panel,日後若真有第 2 consumer 再抽。

interface FilterValuePickerColInfo {
  id: string
  label: string
  options?: Array<{ value: string; label: string }>
}

interface FilterValuePickerProps {
  shape: ValueShape | null
  value: unknown
  onChange: (v: unknown) => void
  colInfo?: FilterValuePickerColInfo
  disabled?: boolean
  /** 用 column.label 組「{label} 篩選值」(panel 每 row 不顯式 label,a11y 必填) */
  ariaLabel?: string
}

function FilterValuePicker({
  shape,
  value,
  onChange,
  colInfo,
  disabled,
  ariaLabel,
}: FilterValuePickerProps) {
  if (!shape || disabled) {
    return <Input size="md" value="" onChange={() => {}} placeholder="輸入值…" disabled aria-label={ariaLabel} />
  }

  switch (shape) {
    case 'none':
      return null

    case 'text':
      return (
        <Input
          size="md"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder="輸入值…"
          aria-label={ariaLabel}
        />
      )

    case 'number':
      return (
        <NumberInput
          size="md"
          value={typeof value === 'number' ? value : null}
          onChange={(v) => onChange(v ?? '')}
          placeholder="輸入數字…"
          aria-label={ariaLabel}
        />
      )

    case 'date_single':
      return (
        <DatePicker
          size="md"
          value={typeof value === 'string' ? value : null}
          onChange={(v) => onChange(v ?? '')}
          aria-label={ariaLabel}
        />
      )

    case 'date_range':
      return (
        <DatePickerRange
          size="md"
          value={Array.isArray(value) && value.length === 2
            ? (value as [string | null, string | null])
            : null}
          onChange={(v) => onChange(v)}
          aria-label={ariaLabel}
        />
      )

    case 'date_relative': {
      // 群組分類:Past / Current / Future(對齊 Linear / Notion idiom),走 Select.groups → SelectMenu
      const opts: SelectOption[] = DATE_RELATIVE_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
        group: o.group,
      }))
      return (
        <Select
          size="md"
          options={opts}
          groups={DATE_RELATIVE_GROUPS as unknown as Array<{ key: string; label: string }>}
          value={String(value ?? '')}
          onChange={(v) => onChange(v)}
          placeholder="選擇相對日期"
          aria-label={ariaLabel}
        />
      )
    }

    case 'select_single': {
      const opts: SelectOption[] = (colInfo?.options ?? []).map((o) => ({
        value: o.value,
        label: o.label,
      }))
      return (
        <Select
          size="md"
          options={opts}
          value={String(value ?? '')}
          onChange={(v) => onChange(v)}
          placeholder="選擇值"
          aria-label={ariaLabel}
        />
      )
    }

    case 'select_multi': {
      const opts = (colInfo?.options ?? []).map((o) => ({
        value: o.value,
        label: o.label,
      }))
      const arr = Array.isArray(value) ? (value as string[]) : []
      return (
        <Combobox
          size="md"
          options={opts}
          value={arr}
          onChange={(v) => onChange(v)}
          placeholder="選擇值…"
          aria-label={ariaLabel}
        />
      )
    }

    case 'datetime_single':
      return (
        <DatePicker
          size="md"
          showTime
          value={typeof value === 'string' ? value : null}
          onChange={(v) => onChange(v ?? '')}
          aria-label={ariaLabel}
        />
      )

    case 'datetime_range':
      return (
        <DatePickerRange
          size="md"
          showTime
          value={Array.isArray(value) && value.length === 2
            ? (value as [string | null, string | null])
            : null}
          onChange={(v) => onChange(v)}
          aria-label={ariaLabel}
        />
      )

    // person_* — v1 fallback Input 文字。後續若需 PeoplePicker `pickerMode` variant
    // 再升級。目前 multi-select 用 Combobox 是 Notion / Asana / ClickUp 通行 idiom。
    case 'person_single':
    case 'person_multi':
      return (
        <Input
          size="md"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="(person picker 預留)"
          aria-label={ariaLabel}
        />
      )

    default:
      return null
  }
}

// ── Component Props ─────────────────────────────────────────────────────

export interface DataTableFilterPanelProps<TData> {
  /** flat(無 group)or nested(1-level group)— consumer 拍板 */
  mode: 'flat' | 'nested'
  /** 可被 filter 的 columns */
  columns: ColumnDef<TData, any>[]
  /** 當前 FilterTree(controlled) */
  value: FilterTree
  /** state 變更 callback */
  onChange: (next: FilterTree) => void
  /**
   * 管理員 set-as-default 的 baseline(refresh icon 顯示判定用)。
   * 當 `value` ≠ `defaultValue`(deep equal)→ panel header 顯示 refresh icon,
   * click → reset 回 defaultValue。對齊 sort 邏輯(相同 modified-from-default UX)。
   */
  defaultValue?: FilterTree
  /** Cell ⌄ menu「Filter by this」帶入的 column id(自動 add 一條 condition) */
  prefilledColumnId?: string
  onPrefillConsumed?: () => void
  onClose?: () => void
  className?: string
}

// ── Main Component ──────────────────────────────────────────────────────

// 內部 fn — generic + ref 轉發。export 走 cast(對齊 DataTable 同 pattern)
function DataTableFilterPanelInner<TData>({
  mode,
  columns,
  value,
  onChange,
  defaultValue,
  prefilledColumnId,
  onPrefillConsumed,
  onClose,
  className,
}: DataTableFilterPanelProps<TData>, ref: React.ForwardedRef<HTMLDivElement>): React.ReactElement {
  const filterableColumns = React.useMemo(() => extractColumns(columns), [columns])
  const fieldOptions: SelectOption[] = React.useMemo(
    () => filterableColumns.map((c) => ({ value: c.id, label: c.label })),
    [filterableColumns],
  )
  const firstCol = filterableColumns[0]

  // 2026-05-04 撤回 auto-create effect:user 期待真空 = 只顯 CTA(對齊「Filter records → + Add filter」
  // 世界級 idiom Notion / Airtable / Linear)。若需要預填,consumer 自管 prefilledColumnId 或外面 setValue。

  // Prefill from cell ⌄ menu「Filter by this」
  React.useEffect(() => {
    if (!prefilledColumnId) return
    const colInfo = filterableColumns.find((c) => c.id === prefilledColumnId)
    if (colInfo) {
      const cond: FilterCondition = {
        kind: 'cond',
        id: newId(),
        field: prefilledColumnId,
        op: getDefaultOperator(colInfo.type),
        value: '',
      }
      if (value.mode === 'flat') {
        onChange({ ...value, children: [...value.children, cond] })
      } else {
        // nested mode:add 到第 1 個 group(若無則新建)
        if (value.children.length === 0) {
          onChange({ ...value, children: [{ ...newGroup(colInfo), children: [cond] }] })
        } else {
          const updatedGroups = value.children.map((g, i) =>
            i === 0 ? { ...g, children: [...g.children, cond] } : g
          )
          onChange({ ...value, children: updatedGroups })
        }
      }
    }
    onPrefillConsumed?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledColumnId])

  // ── flat-mode mutators ──
  const flatTree = value.mode === 'flat' ? value : null
  const updateFlatCondition = (id: string, patch: Partial<FilterCondition>) => {
    if (!flatTree) return
    onChange({
      ...flatTree,
      children: flatTree.children.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })
  }
  const removeFlatCondition = (id: string) => {
    if (!flatTree) return
    onChange({ ...flatTree, children: flatTree.children.filter((c) => c.id !== id) })
  }
  const addFlatCondition = () => {
    if (!flatTree) return
    onChange({ ...flatTree, children: [...flatTree.children, newCondition(firstCol)] })
  }
  const setFlatConjunction = (conj: Conjunction) => {
    if (!flatTree) return
    onChange({ ...flatTree, conjunction: conj })
  }

  // ── nested-mode mutators ──
  const nestedTree = value.mode === 'nested' ? value : null
  const updateGroup = (groupId: string, patch: Partial<FilterGroup>) => {
    if (!nestedTree) return
    onChange({
      ...nestedTree,
      children: nestedTree.children.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
    })
  }
  const updateGroupCondition = (groupId: string, condId: string, patch: Partial<FilterCondition>) => {
    if (!nestedTree) return
    onChange({
      ...nestedTree,
      children: nestedTree.children.map((g) =>
        g.id === groupId
          ? { ...g, children: g.children.map((c) => (c.id === condId ? { ...c, ...patch } : c)) }
          : g
      ),
    })
  }
  const removeGroupCondition = (groupId: string, condId: string) => {
    if (!nestedTree) return
    onChange({
      ...nestedTree,
      children: nestedTree.children.map((g) =>
        g.id === groupId ? { ...g, children: g.children.filter((c) => c.id !== condId) } : g
      ),
    })
  }
  const addConditionToGroup = (groupId: string) => {
    if (!nestedTree) return
    onChange({
      ...nestedTree,
      children: nestedTree.children.map((g) =>
        g.id === groupId ? { ...g, children: [...g.children, newCondition(firstCol)] } : g
      ),
    })
  }
  const removeGroup = (groupId: string) => {
    if (!nestedTree) return
    onChange({ ...nestedTree, children: nestedTree.children.filter((g) => g.id !== groupId) })
  }
  const addGroup = () => {
    if (!nestedTree) return
    onChange({ ...nestedTree, children: [...nestedTree.children, newGroup(firstCol)] })
  }
  const setRootConjunction = (conj: Conjunction) => {
    if (!nestedTree) return
    onChange({ ...nestedTree, conjunction: conj })
  }

  return (
    // 寬度策略:desktop 680px;mobile 縮到 viewport 內留 32px 邊(避溢出 popover 切右半)。
    // 對齊 Notion / Airtable 的 advanced filter 在 mobile 走 full-width 邊處理。
    <div ref={ref} className={cn('w-[min(680px,calc(100vw-2rem))]', className)}>
      <SurfaceHeader>
        <PopoverTitle className="flex-1">篩選</PopoverTitle>
        {/* Refresh icon — 只在 value ≠ defaultValue 時顯示(對齊 sort modified-from-default UX)
            含 ButtonDivider 對齊「欄位顯示」+「排序」chrome corner action canonical(2026-05-04) */}
        {defaultValue && !isFilterTreeEqual(value, defaultValue) && (
          <>
            <Button
              variant="text" size="sm" iconOnly startIcon={RotateCcw}
              aria-label="恢復預設"
              onClick={() => onChange(defaultValue)}
            />
            {onClose && <ButtonDivider />}
          </>
        )}
        {onClose && (
          <PopoverClose asChild>
            <Button data-dismiss iconOnly dismiss size="sm" startIcon={XIcon} aria-label="關閉" onClick={onClose} />
          </PopoverClose>
        )}
      </SurfaceHeader>

      {/* Body — flat / nested 條件;空條件 → 直接顯 + 加篩選 CTA(對齊 Notion / Airtable / Linear inline 派,
          無條件時不需要 Empty 元件大區塊,單顆 CTA 引導即可。SurfaceFooter 整層拔除,
          + Add filter / + 加篩選器 inline 緊貼最後一條 row,讓 user 感受到「條件」與「加入」屬同一語境)*/}
      <SurfaceBody className="flex flex-col gap-2">
        {flatTree && flatTree.children.map((cond, idx) => (
          <FilterRow
            key={cond.id}
            index={idx}
            condition={cond}
            conjunction={flatTree.conjunction}
            filterableColumns={filterableColumns}
            fieldOptions={fieldOptions}
            onChangeConjunction={setFlatConjunction}
            onChangeField={(v) => {
              const newCol = filterableColumns.find((c) => c.id === v)
              updateFlatCondition(cond.id, { field: v, op: getDefaultOperator(newCol?.type), value: '' })
            }}
            onChangeOp={(v) => updateFlatCondition(cond.id, { op: v, value: '' })}
            onChangeValue={(v) => updateFlatCondition(cond.id, { value: v })}
            onRemove={() => removeFlatCondition(cond.id)}
          />
        ))}

        {nestedTree && nestedTree.children.map((group, gIdx) => (
          <GroupBlock
            key={group.id}
            index={gIdx}
            group={group}
            rootConjunction={nestedTree.conjunction}
            filterableColumns={filterableColumns}
            fieldOptions={fieldOptions}
            onChangeRootConjunction={setRootConjunction}
            onChangeGroupConjunction={(c) => updateGroup(group.id, { conjunction: c })}
            onChangeCondition={(condId, patch) => updateGroupCondition(group.id, condId, patch)}
            onRemoveCondition={(condId) => removeGroupCondition(group.id, condId)}
            onAddCondition={() => addConditionToGroup(group.id)}
            onRemoveGroup={() => removeGroup(group.id)}
          />
        ))}

        {/* Inline CTA — text variant 輕量視覺(對齊 Q9 + 世界級 5/6 派 inline 共識)
            不放 SurfaceFooter:條件與「加入」屬同一語義群,中間插 footer 切斷敘事。
            Trigger row 外層 self-align-start 不撐滿 panel 寬。*/}
        <div>
          <Button
            variant="text" size="sm" startIcon={Plus}
            onClick={mode === 'flat' ? addFlatCondition : addGroup}
          >
            {mode === 'nested' ? '加入篩選器' : '加篩選'}
          </Button>
        </div>
      </SurfaceBody>
    </div>
  )
}

// Generic + ref forward 套 cast 的 idiom — 對齊 DataTable(同檔家)。
// React.forwardRef 對 generic component 會丟掉 type param,改 cast 成 generic-preserving signature。
export const DataTableFilterPanel = React.forwardRef(DataTableFilterPanelInner) as <TData>(
  props: DataTableFilterPanelProps<TData> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement
;(DataTableFilterPanel as { displayName?: string }).displayName = 'DataTableFilterPanel'

// ── ConjunctionLabel ───────────────────────────────────────────────────

const CONJ_OPTIONS: SelectOption[] = [
  { value: 'and', label: 'And' },
  { value: 'or', label: 'Or' },
]

function ConjunctionLabel({
  index, conjunction, onChange,
}: { index: number; conjunction: Conjunction; onChange: (c: Conjunction) => void }) {
  if (index === 0) {
    // 「Where」靜態 label;w-20 對齊 row 2+ 的 Select 寬度
    // px-3 對齊 Field 內部 padding(field-wrapper.tsx px-3 = 12px),Where 文字起點與下方 row Select value 起點對齊(Q13)
    return <div className="w-20 shrink-0 text-body text-fg-muted px-3 self-center">Where</div>
  }
  return (
    // w-20(80px)— 容納「And ⌄」/「Or ⌄」label + chevron 不被截斷
    // minRows={2} — And/Or 只有 2 選項,顯式縮 menu 高度避免 reserve 3 row 空白(Q5)
    <div className="w-20 shrink-0">
      <Select
        size="md"
        options={CONJ_OPTIONS}
        value={conjunction}
        onChange={(v) => onChange(v as Conjunction)}
        minRows={2}
        aria-label="連接詞 — 同 group 共用"
      />
    </div>
  )
}

// ── FilterRow(flat 用 + group 內共用) ──────────────────────────────

function FilterRow({
  index, condition, conjunction, filterableColumns, fieldOptions,
  onChangeConjunction, onChangeField, onChangeOp, onChangeValue, onRemove,
}: {
  index: number
  condition: FilterCondition
  conjunction: Conjunction
  filterableColumns: FilterColumn[]
  fieldOptions: SelectOption[]
  onChangeConjunction: (c: Conjunction) => void
  onChangeField: (v: string) => void
  onChangeOp: (v: string) => void
  onChangeValue: (v: unknown) => void
  onRemove: () => void
}) {
  const colInfo = filterableColumns.find((c) => c.id === condition.field)
  const operatorOptions = getOperatorOptions(colInfo?.type)
  const hasField = !!condition.field
  const opSpec = colInfo ? getOperatorSpec(colInfo.type, condition.op) : null
  const valueShape: ValueShape | null = colInfo && opSpec
    ? getValueShape(opSpec, colInfo.type, colInfo.includeTime)
    : null

  return (
    <div className="flex items-center gap-2">
      <ConjunctionLabel index={index} conjunction={conjunction} onChange={onChangeConjunction} />
      <div className="w-40 shrink-0">
        <Select
          size="md"
          options={fieldOptions}
          value={condition.field}
          onChange={onChangeField}
          placeholder="選擇欄位"
          aria-label="篩選欄位"
        />
      </div>
      <div className="w-32 shrink-0">
        <Select
          size="md"
          options={operatorOptions}
          value={condition.op}
          onChange={onChangeOp}
          disabled={!hasField}
          aria-label="篩選運算子"
        />
      </div>
      <div className="flex-1 min-w-0">
        <FilterValuePicker
          shape={valueShape}
          value={condition.value}
          onChange={onChangeValue}
          colInfo={colInfo}
          disabled={!hasField}
          ariaLabel={colInfo ? `${colInfo.label} 篩選值` : '篩選值'}
        />
      </div>
      {/* Trash 用 text Button(Q4)— filter row 是 form-control row,Field 同高對齊(28 md)。
          Inline Action(16+18 hover bg)只用於 scanning/reading list row,本場景違反 item-anatomy canonical。 */}
      <Button variant="text" size="sm" iconOnly startIcon={Trash2} aria-label="刪除" onClick={onRemove} />
    </div>
  )
}

// ── GroupBlock(nested 用) ────────────────────────────────────────────

function GroupBlock({
  index, group, rootConjunction, filterableColumns, fieldOptions,
  onChangeRootConjunction, onChangeGroupConjunction,
  onChangeCondition, onRemoveCondition, onAddCondition, onRemoveGroup,
}: {
  index: number
  group: FilterGroup
  rootConjunction: Conjunction
  filterableColumns: FilterColumn[]
  fieldOptions: SelectOption[]
  onChangeRootConjunction: (c: Conjunction) => void
  onChangeGroupConjunction: (c: Conjunction) => void
  onChangeCondition: (condId: string, patch: Partial<FilterCondition>) => void
  onRemoveCondition: (condId: string) => void
  onAddCondition: () => void
  onRemoveGroup: () => void
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="pt-2">
        <ConjunctionLabel index={index} conjunction={rootConjunction} onChange={onChangeRootConjunction} />
      </div>
      {/* Group container 灰底 — 用 --color-neutral-1 對齊 token canonical(non-existent --surface-3 改 ✓) */}
      <div className="flex-1 min-w-0 rounded-md bg-[var(--color-neutral-1)] p-2 flex flex-col gap-2">
        {group.children.map((cond, cIdx) => (
          <FilterRow
            key={cond.id}
            index={cIdx}
            condition={cond}
            conjunction={group.conjunction}
            filterableColumns={filterableColumns}
            fieldOptions={fieldOptions}
            onChangeConjunction={onChangeGroupConjunction}
            onChangeField={(v) => {
              const newCol = filterableColumns.find((c) => c.id === v)
              onChangeCondition(cond.id, { field: v, op: getDefaultOperator(newCol?.type), value: '' })
            }}
            onChangeOp={(v) => onChangeCondition(cond.id, { op: v, value: '' })}
            onChangeValue={(v) => onChangeCondition(cond.id, { value: v })}
            onRemove={() => onRemoveCondition(cond.id)}
          />
        ))}
        {/* Q9 — text variant 對齊 inline 派 + 視覺輕量 */}
        <div className="flex items-center justify-between">
          <Button variant="text" size="sm" startIcon={Plus} onClick={onAddCondition}>加入巢狀篩選</Button>
          {group.children.length === 0 && (
            <Button variant="text" size="sm" startIcon={Trash2} danger onClick={onRemoveGroup}>移除空群組</Button>
          )}
        </div>
      </div>
    </div>
  )
}
