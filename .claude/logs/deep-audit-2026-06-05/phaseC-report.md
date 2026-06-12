# Deep Audit Cross-Codex 完整報告 — 2026-06-05

**Mode**: ds-repo / **HEAD**: c5dd6b5a (beta.55) / **Branch**: 2026-06-05-deep-audit-cross-codex-fixes

照 skill 完整規矩跑(非 scoped subset):A.0 全讀 preflight → A.1 全 88 dim(機械層 @HEAD 已綠鎖 + 判斷層 agent NO-SAMPLE)→ A.1b per-component 68 單元對抗稽核 → Phase B codex 8 brief 獨立跑相同 Phase A → cite-battle。

## Phase A(Claude 獨立)
- **68 單元 NO-SAMPLE,3,211 條宣稱逐句驗**,12 單元全乾淨。
- **157 confirmed**(find→refute-default verify 兩段)+ 14 dim findings。
- Severity: **P0=8 / P1=80 / P2=68**,category 全 = FALSE_CLAIM(文件對不上 code)。
- 141 agents / 13.8M tokens / 56 min。
- 全乾淨單元:Accordion, AspectRatio, Chip, Dialog, LinkInput, Menu, NumberInput, Popover, Sheet, Switch, Tooltip, resize-handle。

## Phase B(Codex 獨立,8 focused brief 避死局)
- **74 findings**(P1=48 / P2=26,0 P0)。
- CLEAN 判定:Dialog/Popover/HoverCard/DropdownMenu/Checkbox/RadioGroup/Switch/SelectionControl/Input/AspectRatio/TreeView/FileViewer/Alert/Tag/Chip/Command。

## Cite-battle / 收斂
- **codex∩claude exact file:line 同點 = 17;same-file = 24;codex-only = 33。** 兩個獨立 model 在 doc-vs-code drift 上強烈收斂 → finding class 真實非雜訊。
- 我抽驗 5 條 codex finding(Calendar nav / FileUpload docblock / Select native / NumberInput loading / Accordion role)全對得上 → codex 高準確,非 pass-through(Step 4.5 verified)。
- C.0 收斂判準:本輪 material drift 大量(非 0),需執行修復;不是 marginal+假陽性殘渣。

## Triage(fix-type 分桶)
| 桶 | 數量 | 性質 | 預設處置 |
|---|---|---|---|
| **DOC_STALE** | 146(spec.md 58 / stories prose 43 / .tsx docblock 44 / other 1) | 文件騙 code,code 是對的 | 改文件對齊 code = autonomous |
| **CODE / a11y 真缺口** | ~10 真(AppShell P0 / portal density / Calendar nav / Accordion role / RadioGroup mode / Slider Field 繼承) | code 缺 doc 宣稱的行為 | 動 .tsx 行為 = SSOT-UI/UX,STOP propose |
| **SUBSTANTIVE / API surface** | 21(dim-72 13 internal-but-public + Button variant escape / Tag naming / Combobox internal props) | 設計/邊界決策 | STOP propose |

## P0(8,全 verified)
1-2. **AppShell modal a11y(真 bug)**:modal Aside render 裸 `<h2>` 非 `<SheetTitle>` → Radix `aria-labelledby` 指向不存在 id → SR 念「unnamed dialog」+ console.error;違 sheet.spec.md:98。**要改 code**。
3-4. **DropdownMenu RadioItem**:spec/story 說「選中後關閉選單」,但 code `onSelect preventDefault` → 不關閉。**doc stale**(改文件)。
5-6. **OverflowIndicator**:story 說「+N 不可聚焦 passive span」,但 code 設 `tabIndex/role/aria-haspopup/focus-ring`(code 對)。**doc stale**(改 story)。
7-8. **RadioGroup mode jsDoc**:jsDoc 宣稱 readonly/disabled mode,但 code 只處理 display,其餘 fall-through。**doc 或實作**(judgment)。

## dim findings(14)摘要
- dim14 命名:FieldControlGroup spec H1 格式違規 / DataTable `.draft.md` 非法後綴 / ProfileCard `nameCardMeta` vs `ProfileCardMeta`。
- dim15 cross-doc:Notice 引用 stale canonical / Empty spec 漏 disabled prop / FileUpload disabled pointer-events 描述 stale。
- dim25 zombie story:DescriptionList `_RETIRED_HorizontalDivided` / Slider `Disabled_REMOVED` 該改 comment-only。
- dim51 Portal density:DropdownMenu/Tooltip Content 漏 `data-density="md"` / density.spec vs sidebar.spec 矛盾。
- dim72 API surface:Button variant escape-hatch / Combobox 4 internal props public / Tag onDismiss vs onRemove。

## 機械層狀態(@HEAD 已綠,本稽核未動)
release:preflight pass-marker HEAD-bound → tsc / typecheck:stories / categorical-invariants / orphan-tokens / code-quality / content-quality / story-quality / plugin-structure / **947-story full smoke** / dogfood 全綠。

## 產物
- `phaseA-preflight-checklist.md` / `claude-phaseA-result.json` / `codex-B{1..8}-*.txt` / `codex-findings-consolidated.txt` / `master-findings.json` / `buckets.json`
