# Bug Classes This Skill Prevents

Curated from the `# 失敗記憶索引` in CLAUDE.md plus audit runs. Each entry names the bug class, how it originally slipped in, and which audit catches it.

---

## Three-way drift — cva vs spec vs anatomy

**First seen**: SegmentedControl (2026-04-18) — cva `defaultVariants.size = 'md'` but spec.md + tsx docblock + anatomy all wrote `sm ★default`. Three-way disagreement persisted unnoticed.

**Caught by**: Audit 1 (cva defaultVariants drift).

**Recurrence**: Steps anatomy prop table drift (orientation), SegmentedControl anatomy prop table drift (size still `'sm'` in anatomy-only location). Both caught in 2026-04-18 run.

**Why it recurs**: When developer changes `cva()` defaults, the sync checklist across 4 locations (cva + spec prop table + tsx docblock + anatomy prop table + anatomy story H3) is easy to miss. Automation via grep `"★|預設|default"` across a component's folder before committing is the primary guard.

---

## Spec text pollution — visual / implementation details

**First seen**: Multiple specs across the audit — Badge with `16px 高、10px 字`, Chip with `display: flex; gap: 8px;`, NameCard with `bg-muted rounded-md px-3 py-2`, Tabs with `::after bottom: -1px`, Slider with「被 range 圍住的空心洞」物理比喻.

**Caught by**: Audit 2 (Rule A).

**Why it recurs**: When writing specs, authors feel compelled to be "precise" — but precise pixel / class specs belong in `.tsx` (source of truth for values) and `.anatomy.stories.tsx` (visual reference). Spec is for design principles (why / when). Visual metaphors belong in `.principles.stories.tsx` (visualization).

**Rule of thumb**: if removing the sentence from spec would leave the principle intact, the sentence is describing implementation — remove it.

---

## Story placeholders — `Option A / B / C` / variant names as labels

**First seen**: Button principles used `<Button variant="primary">Primary</Button>` as a label, Tag used `分類 A / B / C / D / E`, Steps used `Step 1/2/3/4` without business scenario.

**Caught by**: Audit 4 (Story human-language).

**Why it recurs**: When authoring stories, it's tempting to use variant names or letters because "it demonstrates all the variants." But Storybook's受眾 is any designer / PM / engineer opening it — they should grasp the scenario from the example alone, not from the label.

**Rule of thumb**: every story example must pass the 「人」test (遮標題光看元件懂情境) — if it fails, use a real business scenario (Jira / Stripe / Notion).

---

## SSOT pointer drift — heading renamed, pointer not updated

**First seen**: `opacity.spec.md` pointed to `color.spec.md「Disabled 策略」` but actual heading was「Disabled 狀態 / 兩種 disabled 策略」. Similar issues across 4 pointers (radio-group, item-layout, name-card).

**Caught by**: Audit 6 (SSOT pointer dead-link).

**Why it recurs**: Headings get renamed for clarity. Pointers using 「heading」 format hard-code the old name. Grep-audit across `\.spec\.md「[^」]+」` surfaces these.

**Prevention**: when renaming a spec heading, grep the project for the old heading name first — find reverse references, update them.

---

## Anatomy incomplete — missing sections (no color matrix / no state matrix)

**First seen**: Popover / Sheet / Command / PeoplePicker / NameCard have only 1-3 stories where 5 are required. Live color swatches missing in SegmentedControl / Switch / Tabs / Toast / Steps / Slider / Textarea / Field / TreeView (tokens as text only).

**Caught by**: Audit 5 (Anatomy completeness).

**Why it recurs**: When a component is simple (single variant, single size), authors feel the full 5-section template is overkill. But even simple components benefit from explicit "本元件無 size" / "本元件無 state" statements — the skeleton provides Figma-inspect-parity for designers.

---

## Density dual values in anatomy

**First seen**: Tabs / SegmentedControl / Sidebar anatomy size tables had `md density / lg density` columns showing `28→32px` dual values.

**Caught by**: Audit 5 (Figma-test).

**Why it recurs**: Authors want to be thorough. But CLAUDE.md explicitly forbids — anatomy reflects *current* density (re-rendered on density switch); dual columns are noise. Token name is enough.

---

## Internal vs Components misclassification

**First seen**: HoverCard originally under `Components/` (behavior primitive, no default visual) — should be `Internal/`.

**Caught by**: CLAUDE.md has a 3-question test; audits cross-check.

**Why it recurs**: Name bias — HoverCard *sounds* like a public component. Always go by behavior (has default visuals? rendered directly anywhere?) not name.

---

## Field-height family default inconsistency

**First seen**: Chip was listed in the default-md family but is actually fixed single-size (h-field-sm, Material 3 convention). Clean-up in 2026-04-18.

**Caught by**: Audit 1 + Audit 3 scope application.

**Why it recurs**: Authors see "component consumes field-height token" and assume it's in the sm/md/lg family. Single-size consumers (Chip, Breadcrumb?) need separate classification.

---

## Chart of audit → bug class（對齊 current 18-audit numbering in audit-prompts.md）

### Group A — Correctness (P0)
| Audit | Primary bug class | Secondary |
|-------|-------------------|-----------|
| 1. cva defaultVariants 三方漂移 | Three-way default drift | Family classification |
| 2. SSOT dead link | Dead link pointers | Heading drift |
| 3. SSOT reciprocal | Missing reverse pointer | Cross-spec inconsistency |
| 4. Tailwind v4 / tailwind-merge grep | `[--foo]` silent fail | Unregistered utility strip |
| 5. Token 消費紀律 | Hardcoded hex / rgba | Raw pixel values |

### Group B — Spec hygiene (P1)
| Audit | Primary bug class | Secondary |
|-------|-------------------|-----------|
| 6. Spec Rule A 文字品質 | Spec text pollution | Visual description leaks |
| 7. Spec Rule B 邊界案例 | Missing boundary coverage | Scope misapplication |
| 8. 7-維度 對標覆蓋 | Missing DS dimension | Thin spec |

### Group C — Code conformance (P1)
| Audit | Primary bug class | Secondary |
|-------|-------------------|-----------|
| 9. shadcn passthrough 完整度 | Missing forwardRef / displayName | Missing ...props / cva export |
| 10. a11y 基本覆蓋 | Missing aria-label | Non-button onClick |

### Group D — Story layer (P1)
| Audit | Primary bug class | Secondary |
|-------|-------------------|-----------|
| 11. Story 三層齊全 | Missing stories layer | Internal vs Components 誤分 |
| 12. Story 人話範例 | Placeholder / abstract labels | Extreme unrealistic |
| 13. Anatomy Figma-inspect 完整度 | Missing sections / dev-lang | Density dual / no swatches |

### Group E — System-level (P1)
| Audit | Primary bug class | Secondary |
|-------|-------------------|-----------|
| 14. 命名一致性 | Folder/file case mismatch | H1 heading drift |
| 15. CLAUDE.md 自身一致性 | Internal contradictions | Dead internal references |

### Group F — Architecture compliance (P1, session-learned)
| Audit | Primary bug class | Secondary |
|-------|-------------------|-----------|
| 16. Layout Family 宣告 | 元件缺 Family declaration | 系統遊離 |
| 17. Prop value 跨元件認知衝突 | 同 literal 不同語義 | 違反命名三重 test #3 |
| 18. shadcn compat alias 回流 | `npx shadcn add` 遺留 alias | 硬寫 Tailwind shadow |

---

## Meta-Pattern layered index (2026-04-21 rebuild)

After the 2026-04-21 governance rebuild, each historical bug maps to one of the 6 Meta-Patterns in CLAUDE.md `# Meta-Pattern 預警`. The index below is the canonical mapping; specific bug classes are kept below as historical context, but future bugs should be classified into a Meta-Pattern first.

### M1 — 視覺決策前必消費 SSOT

- **FileViewer 初版**(2026-04-20 / AR26-38):dismiss 用 Button 不用 ItemInlineAction / header 硬寫 h-14 不用 `--chrome-header-height` / toolbar 按鈕 gap 沒對齊 `action-bar.spec.md` / Sheet 表單 gap 沒用 `--layout-space-tight`
- **Input `variant="bare"`**(2026-04-20):FileViewer ZoomInput 發明新 variant 未先 grep 既有 Input variant 值;事後 codify 進 Input spec 但 discovery pattern 有誤(不該先發明)
- **Row 硬刻 `<div><Icon/><span/><Button/></div>`**(反覆發生):應用 MenuItem + slot components
- **Loading overlay 手刻 `<div absolute inset-0 flex center>`**(反覆發生):應用 `<Empty icon={<CircularProgress/>}/>` 或 Input `loading` prop

### M2 — 消費 3rd-party lib 必驗 rendered DOM

- **react-day-picker v9 `data-range-*` 不存在**(2026-04-21 / AR43):DateGrid 用 `[&[data-range-middle]]:bg-...` 靜默失效,正解走 classNames prop
- **react-zoom-pan-pinch fit-to-page 算錯**(2026-04-21 / AR 本輪):formula 混淆 `object-contain` 的 pre-scale 和 transform scale,導致 fit 反而縮小;正解移除 object-contain 用 natural size + onLoad 計算 fit scale
- **wheel step 10% 太粗**(2026-04-21 / AR 本輪):預設 0.1 非世界級(Figma ~3%、Preview ~5%),調到 0.03 + smoothStep 0.005
- **DateGrid today `[&>button]:relative` 破壞 absolute**(2026-04-21):button 已 `absolute inset-0.5` 是 positioning context,重加 relative 覆蓋掉 absolute → sizing 破壞

### M3 — Portal 逃逸 subtree context

- **FileViewer DropdownMenu dark subtree 變亮**(2026-04-20 / AR26):Portal 到 document body,不繼承 FileViewer `data-theme="dark"` subtree,需顯式 forward + 強制 `bg-surface-raised` 等 dark token class

### M4 — Group 元件必隔離 fieldCtx

- **Checkbox in CheckboxGroup 所有 label 抑制**(2026-04-21 / AR34):fieldCtx 在 CheckboxGroup 內傳染到每個 item,每個 Checkbox 以為自己在 Field 裡唯一 → label 被抑制;正解建 `CheckboxGroupContext` 隔離,`shouldSuppressLabel = insideField && !insideGroup`
- **Checkbox 共用 fieldCtx.id 點擊只 toggle 第一個**(2026-04-21 / AR34):同上 root cause,所有 item 的 `<label htmlFor={fieldCtx.id}>` 指向同一 id;正解 `insideGroup ? generatedId : fieldCtx?.id ?? generatedId`

### M5 — State 疊加必 spec 聲明

- **DateGrid today + selected bar 色隱形**(2026-04-21):today bar 用 `bg-primary` 藍色,selected cell bg 也是藍色 → bar 隱形;正解 `[&[data-selected=true]>button]:after:bg-on-emphasis` 在 selected 時切白
- **DateGrid today bar 過於貼近 button 邊**(2026-04-21):`bottom-[2px]` 離 button 底太近,視覺「黏邊」;正解 `bottom-[5px]` 貼近數字行底

### M6 — Stakeholder gate 強制進階稽核

- **FileViewer 初版多 round 反覆修 AR26-38**(2026-04-20):初版出給人看前沒跑進階稽核 / 沒截圖全 state 驗證 → 後續 user 發現 8+ 項問題分多輪修;若 merge 前過了 `/component-quality-gate` Phase 4.5 進階模式 + `/visual-audit` Layer A + Layer B,多數問題應當場攔下

### 獨立技術陷阱(非 meta-pattern,保留 anchor)

- cva `defaultVariants.size` 三方漂移(SegmentedControl) → `/story-writing` Phase 4 + hook `check_cva_default_sync.sh`
- Row 硬寫 `py-2` 產生 gap(TreeView in SidebarGroup) → item-anatomy spec
- asChild pattern consumer 自查 avatar size → item-anatomy spec
- HoverCard 誤放 Components/(純行為 primitive 應 Internal/) → `# Story` 判斷 test
- Chip 誤列 field-height family(Material 3 固定 sm) → `tokens/uiSize/uiSize.spec.md`
