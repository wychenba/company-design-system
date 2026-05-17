# Codex Round 4 — Ant Design 跨元件 Select All ordering 真實 source code 證據(M31 真辯論)

## User verbatim 2026-05-16(round 4)

> 「先不要管我的意見,怎樣的設計才是最貼近 ant design?你跟 codex 各自仔細查」

User 要求純研究 Ant Design canonical,不問偏好。

## 任務 — 跨 Ant 元件 bulk-select ordering 深查

請用 `npx codex exec` MCP github_fetch_file + grep + 任何 unpkg / jsdelivr / raw.githubusercontent fallback,grep 至少 6 個 Ant 元件 source code(非 docs)找 bulk-select ordering 真實行為,**file:line + 引文**:

### A1. Transfer(Round 3 已查 confirm)

請重 grep 確認:
- `components/transfer/index.tsx`:moveTo / handleSelectAll logic
- `components/transfer/list.tsx`:`onItemSelectAll`
- 引文 `[...prevKeys, ...keys]` or 同等。

### A2. Tree / TreeSelect 全選

- `components/tree/Tree.tsx`:`onCheck` cascade 父→子 / 子→父
- `components/tree-select/index.tsx`:multiple + checkable + 「全選」如何聚 value array?
- Tree 點父勾全部子 → value array 內 ordering = tree traversal order(source)? click order? 

### A3. Cascader multi-select

- `components/cascader/index.tsx`:multiple + showCheckedStrategy(`SHOW_CHILD` / `SHOW_PARENT`)
- Multi value array ordering = path order(source)還是 click order?

### A4. Checkbox.Group / Radio.Group

- `components/checkbox/Group.tsx`:`onChange` value array — selected order = click order 或 source(options array)order?
- 通常 Checkbox Group 不 reorder — confirm via grep。

### A5. Table rowSelection checkAll

- `components/table/hooks/useSelection.tsx`:`onSelectAll` / `selectedRowKeys`
- 全選 row 後 `selectedRowKeys` ordering = data source row order?(這 most likely 是 source order,因 row keys 跟著 data prop)

### A6. Table filter checkAll(Round 3 未 confirm)

- `components/table/hooks/useFilter/FilterDropdown.tsx`:`onCheckAll` setSelectedKeys
- Codex Round 3 search 沒抓到 source line。重試 via GitHub MCP fetch raw / unpkg / jsdelivr。
- 引文 `setFilteredKeysSync(allFilterKeys)` 等。

### A7. Select multi-mode click-by-click(底層 rc-select,Round 2 confirm)

只 spot-check 重 confirm:`rc-select/Select.tsx` `onInternalSelect` 內 `[...mergedValues, val]`。

## Output 表

| Ant 元件 | Bulk-select operation | Ordering pattern | source cite(file:line + 引文)|
|---|---|---|---|

最後 verdict:
- 跨元件 Ant Design 是否有單一 ordering canonical?
- 如多元件不一致,最常見 pattern 是哪個?
- 對應到 PeoplePicker Select All 場景**最貼近**哪一條?

## 限制

- 純 grep + cite。**不 propose fix 也不 judge user 喜好**。
- 失敗 fetch 必明示「無法 verify」(per M22+M26)。
- Layer A 同 parallel grep,Round 4 後 Step 5 比稿。
