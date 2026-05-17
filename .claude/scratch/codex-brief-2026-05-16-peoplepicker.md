# Codex brief — PeoplePicker 多選 visible count drift + placeholder ellipsis root cause(dual-track M31 Step 1-4)

## User verbatim(2026-05-15 → 2026-05-16)

> 「圖一 placeholder 還是沒有 ellipsis,已經修了一百次了,你應該跟 codex 一起討論辯論出 root cause,然後你要自己有辦法可以重現這個問題,並知道這個問題長怎樣,這樣你在做完之後才能自動驗證,請你驗證倒好才交差」

> 「圖二:Reviewers 4 人選 → trigger 「2 avatars + +2」 (visible=2);圖三:Reviewers 3 人選 → trigger 「1 avatar + +2」 (visible=1)。同 180px width 不同 length 不同 visible — 跟 user 一開始抓的問題一模一樣」

> 「我認為針對那兩個你他媽修了一百年還修不好的問題,你要想辦法可以自己重現並判斷怎樣是正確怎樣是錯的,然後自己列出 test case,自己自動驗證到好,請善用截圖功能,但要確保你有基於 ssot 等設計原則在想解法,不要改到整個設計都偏移,然後請 codex 也做一樣的事情去找 root cause,你們一起討論辯論」

## Layer A(Claude)已完成 grep + read source 證據

### Bug A:多選 stack visible count drift(圖二+圖三)

**Layer A 假設 root cause**:`combobox.tsx:642-648` Combobox.forwardRef body 用 `_ref` 把 ref 丟掉,沒 forward 給 NativeCombobox / CustomCombobox。PeoplePicker stack mode 透過 `mergedStackRef` 接 trigger DOM 失敗 → stackContainerRef.current 永遠 null → `useLayoutEffect` early return at `if (!root) return` → `stackVisibleCount` 永遠 undefined → `visibleCountOverride={undefined}` → Combobox 走原 internal `useOverflowCount`(60px chip fallback bug + offsetWidth measurement drift,即 user 抓的原 Bug 3 根因)。

**證據**:
- `combobox.tsx:642-648`:
  ```ts
  const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
    (props, _ref) => {
      const isMobile = useIsTouchDevice()
      if (isMobile) return <NativeCombobox {...props} />
      return <CustomCombobox {...props} />
    }
  )
  ```
- `people-picker.tsx:343-344`:
  ```ts
  const root = stackContainerRef.current
  if (!root) return  // ← 永遠 hit,因為 ref 從未 attach
  ```
- `f99552e` commit message claim「querySelector self-exclusion」是 false root cause — 那行 `root.matches(...)` 在 `if (!root) return` 之後永不執行。

### Bug B:單選 placeholder「Alice Wonderland」無 ellipsis dots(圖一)

**Layer A 假設 root cause**:`select.tsx:210` overlay span 把 `inline-flex items-center truncate` 套同一 element。`text-overflow: ellipsis` 規則:inline-flex 容器內的文字變 anonymous flex item,ellipsis 不從容器繼承到 anonymous item → ellipsis 不 fire。

**證據**:
- `select.tsx:208-216`:
  ```jsx
  <span
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 inline-flex items-center truncate text-fg-muted"
  >
    {selectedLabel}
  </span>
  ```
- DS-wide grep `truncate + flex|inline-flex`(30 個 match)— **只有 select.tsx:210 把 truncate 跟 inline-flex 套在同一 element**。29 個其他用 outer flex + inner `<span class="truncate flex-1 min-w-0">` 拆分鏈。
- `person-display.tsx:142-150` 兩週前留有同 bug 修正註解:
  > 「2026-05-14 I1 fix:outer `inline-flex` → `flex w-full` 完成 truncate 寬度約束鏈。原 inline-flex content-width parent constrain 不到 name span」

  + 結構:
  ```jsx
  <span className="flex items-start gap-2 min-w-0 w-full">
    <ItemPrefix>...</ItemPrefix>
    <span className="truncate flex-1 min-w-0">{person.name}</span>
  </span>
  ```

## SSOT 對齊原則(必遵守)

1. **mindset #2**「優先消費既有」+ M23「DS internal canonical 優先」+ M29「動視覺前必 grep spec.md owner」
2. PeoplePicker spec.md §C row 1「length=1 視覺 = 跟單人 closed 一致」+ §E「PersonDisplay 共享 renderer」
3. Single picker wrapper SSOT `select.tsx:229`:`flex-1 min-w-0 inline-flex items-center + nakedCellRowModeAlign`
4. **禁**:自創 wrapper / 自創 flex 結構 / 改 PersonDisplay layout / 改 OverflowTagList API contract / 改 Combobox public API

## Codex 任務(per M31 5-step Step 2-4)

### Step 2 — Codex 獨立 verify

請**不**信 Layer A 假設;獨立 grep 證據:
1. `combobox.tsx` 看 Combobox forwardRef body — `_ref` 是否真 drop ref?還是 NativeCombobox / CustomCombobox 內部接 ref 我沒看到?
2. `select.tsx:210` truncate + inline-flex — 你的 CSS spec 知識:`text-overflow:ellipsis` 在 inline-flex 容器內,text 變 anonymous flex item 時,ellipsis 是否真不 fire?如有 evidence(W3C spec / browser behavior table)請 cite source。
3. `npx tsc -b` 在你 sandbox 跑 clean 嗎?

### Step 3 — Codex 視覺稽核

如能跑 storybook screenshot,請開:
- `http://localhost:6006/iframe.html?id=design-system-components-peoplepicker-展示--multi&viewMode=story` 
- 設 trigger 寬 180px,測 length∈{1,2,3,4} visible count
- 確認 ellipsis fire / 不 fire(scrollWidth > clientWidth 判定)

無 sandbox screenshot → 跳過,但要明示「Layer C visual 未跑」。

### Step 4 — Codex propose

3-column cite battle 格式:
| Root cause hypothesis | spec.md / source path:line / 引文 | Reasoning |
|---|---|---|

如同意 Layer A — 補充「為何之前 ship 多次沒抓出 ref-drop pattern」+「除 Combobox 還有沒有 ref-drop 漏接」。
如不同意 — propose alternative + cite source 反駁。

## Step 5 — Synthesize(Layer A 整合,不你做)

Layer A 收到你 propose 後合「完美完整版本」,**不**pass-through。

## 限制 + 禁忌

- 禁改 PersonDisplay / OverflowTagList / Combobox public API contract
- 禁開新 branch / push / PR(per memory `feedback_solo_dev_workflow.md` M28)
- 禁省 cite battle 直接寫 verdict
- 若 sandbox 跑不了 playwright,明示「Layer C visual missing,Layer A 必跑 reproduce 補」
- 完整 cite source(file:line / spec.md heading / W3C URL)

## Output

請以 markdown 格式回:
1. **Step 2 verify 結果**:agree / disagree Layer A 兩 hypothesis,各附證據
2. **Step 3 visual** 跑了沒,跑了結果
3. **Step 4 propose**:3-column 表 + fix direction(僅 propose,不 ship)
4. **DS-wide ref-drop iceberg**:`forwardRef.*_ref` pattern 有沒有其他 component 也漏接?
