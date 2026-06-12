# Phase A.0 — 全盤閱讀 preflight checklist(deep-audit-cross-codex)

- **日期**:2026-06-05
- **Mode**(Phase 0 detect):`ds-repo`(`packages/design-system/src` 存在)
- **HEAD**:`c5dd6b5a` / 版本 `0.1.0-beta.55`
- **觸發**:user「全盤照規矩執行」— 前次 run 是 scoped subset(已坦承),本次跑完整 canonical:全 dim NO-SAMPLE + A.1b per-component(含 docblock-vs-code + spec-internal lens)+ Phase B codex 比稿 + cite-battle。

## 1. Deterministic / mechanical 層 = @HEAD PROVEN GREEN

`release:preflight` pass-marker `release-preflight-pass.json` head = `c5dd6b5a`(== 現 HEAD),fail-fast 全過才寫。涵蓋並「鎖死」以下機械 dim,**本次稽核不重跑**(已綠,只在報告引用):

| Preflight gate | 鎖住的 dim |
|---|---|
| `npx tsc -b` | 1(cva drift)型別層 |
| `typecheck:stories` | story `{var}` undefined / prop 型別(SizeMatrix crash 真防線) |
| `audit-orphan-tokens --check` | 48 orphan token |
| `categorical-color-invariants` | 1/5 categorical SSOT + I4 WCAG 對比 |
| `code-quality-audit --check` | 27 clean-code 量化 |
| `audit-content-quality --check` | 2 SSOT dead-link / 20 spec 硬寫值 |
| `sync-governance-counters --check` | 19 home-name-vs-scope / M-rule·hook·dim count drift |
| `gen-figma-make-artifacts --check` | 45 mechanical output |
| `plugin-structure-validate` | 81 preset `.cjs` / 86 manifest |
| `story-quality:check` | 40-44/46 story title·jargon·placeholder·rule-note |
| `sync-ds-canonical --check` | 53 code-to-spec reverse drift / 85 mirror 新鮮度 |
| `build:lib` + `build-storybook` | build 完整性 |
| **FULL storybook smoke(947 story)** | 73/74 runtime render crash(全 story 真開) |
| `dogfood-prepublish-verify` | 84/87/88 packaging 可建性 |

→ **結論**:dim 1,2,4,5,19,20,27,40-48,53,73,74,81,84-88 機械綠燈鎖死。Hook-covered dim(3,16,17,18,21,22,31,32,34-39,52,54,56-72,75,76,78-80,82,83)由 write-time hook + CI 兜底。

## 2. 本次稽核 = 純 judgment 層(機械無法 gate,403-finding 偷懶區)

### A.1b per-component adversarial — NO-SAMPLE,68 單元
- **62 components**:Accordion, Alert, AppShell, AspectRatio, Avatar, Badge, Breadcrumb, BulkActionBar, Button, Calendar, Carousel, Chart, Checkbox, Chip, CircularProgress, Coachmark, Combobox, Command, DataTable, DateGrid, DatePicker, DescriptionList, Dialog, DropdownMenu, Empty, Field, FieldControlGroup, FileItem, FileUpload, FileViewer, HoverCard, Input, LinkInput, Menu, Notice, NumberInput, OverflowIndicator, PeoplePicker, Popover, ProfileCard, ProgressBar, RadioGroup, Rating, ScrollArea, SegmentedControl, Select, SelectionControl, SelectMenu, Separator, Sheet, Sidebar, Skeleton, Slider, Steps, Switch, Tabs, Tag, Textarea, TimePicker, Toast, Tooltip, TreeView
- **6 patterns**:action-bar, element-anatomy, header-canonical, horizontal-overflow, overlay-surface, resize-handle
- 每單元 agent 讀:`{name}.tsx`(+ wrap 的 Radix/cmdk/react-day-picker/sonner/recharts/embla 等 lib source)+ `{name}.spec.md` + `{name}.anatomy.stories.tsx` + `{name}.principles.stories.tsx` + `{name}.stories.tsx`
- 逐句驗 3 lens:(a) spec/anatomy/a11y/principles claim **vs code** 真實(鍵盤 map / ARIA role / focus / prop 存在 / token / 預設 / native-vs-custom)(b) **.tsx docblock/inline 註解 vs 同檔 code**(c) **spec 段落間描述性一致**(Mode 表 typography / padding / gap 跨段不打架)
- 「自上次無 code 改動」≠ 可跳過。

### A.1 cross-cutting judgment dims — DS-wide
14 命名一致 / 15 cross-doc 一致 / 16 layout family 宣告覆蓋 / 17 prop 跨元件認知衝突 / 24 story 重複性 / 25 story 必要性 / 33 元件分類抽象紀律 / 51 theme·density 矩陣 / 72 DS API surface 收斂。

## 3. canonical 來源(全可讀,grounding ✓)
CLAUDE.md(199)/ meta-patterns(87 主 + always-load)/ spec-rules / ui-development / story-rules / self-verify / ssot-index / naming-conventions / ssot-consultation / build-ui-canonicals + 83 個 `*.spec.md`(由各 per-component agent 真讀,non-sample)。

## 4. Phase B codex
local `node_modules/.bin/codex`(codex-cli 0.134.0)+ `~/.codex/auth.json` 在。拆 focused brief(避大 brief 死局)跑相同 adversarial Phase A → cite-battle。

## 完成 gate
本 checklist = A.0 grounding 工件。實際逐 file 深讀在 A.1b/A.1 agent 內 NO-SAMPLE 執行(避免把 83 spec 灌進主 context)。CP-A0 PASS。
