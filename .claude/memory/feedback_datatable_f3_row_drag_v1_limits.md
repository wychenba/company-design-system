# DataTable F3 Row Drag v1 Limits(2026-05-05)

## v1 已 ship

- API:`enableRowDrag?: boolean` + `onRowReorder?: (sourceId, targetId, 'before' | 'after')`
- Library:@dnd-kit/sortable + @dnd-kit/core
- Synthetic `__drag__` 欄(最左,size 32),`__select__` 之前
- Hover-revealed handle(opacity-0 → group-hover/row:opacity-100)
- Sort × Drag 互斥(sort.length > 0 → handle disabled + Tooltip)
- Top-level only(sub-rows 不在 SortableContext.items)
- Cross-region transform sharing via `SortableRowCtx`(primary region 掛 useSortable,mirror 透過 Context 取 transform)
- Position 計算:active.id vs over.id 視覺位置 → arrayMove 慣例
- Demo:RowDragInteractive story

## v2 待修

1. **Virtualizer × transform**:長 list (> 50 rows) measureElement 跟 transform 互動可能錯位
2. **3-panel mirror sync**:有 pinnedLeft / pinnedRight 時,只 primary region(left 優先 fallback center)的 row 跟動 transform;mirror region 拖動時不跟隨。完整 sync 需 shared row-translation ref + `useSyncExternalStore`
3. **Cross-parent drop**:nested rows 場景目前只能在同 top-level scope 重排;子層 row 不能拖到別的 parent 下

## 防呆

- Hook `check_data_table_row_drag_get_row_id.sh`(post-tool,soft warning):consumer 用 `enableRowDrag` 但 file 內無 `getRowId` → warn(dnd 退化 row.index 會 reorder 後錯位)
- Spec `data-table.spec.md`「L4 Row drag」段含 v1 限制 + 必填 getRowId
- TSX JSDoc 含完整 v1 限制 inline

## 原則

DS 不持有 row order state(同 Notion / Airtable / Linear consumer-managed pattern)— consumer 透過 onRowReorder callback 自管 data array splice + state update。
