# Audit Subagent Prompts (15 audits)

Each prompt is self-contained — designed to paste into an `Agent` call with `run_in_background: true` and `subagent_type: general-purpose`.

All prompts start with:
```
Working directory: /Users/chenqiren/Library/CloudStorage/GoogleDrive-qijenchen@gmail.com/我的雲端硬碟/my-project
```

---

# Group A — Correctness (P0 priority)

## 1. cva defaultVariants 三方漂移

```
Your job: audit cva `defaultVariants` three-way consistency (code vs spec.md vs anatomy story) across ALL variant keys.

For each component in src/design-system/components/ with a `defaultVariants` block:
1. Grep its `cva(...)` — identify every `defaultVariants` key + value
2. Check `.spec.md` prop table / docblock — `★` / `預設` / `default` markers
3. Check `.tsx` top-of-file docblock (JSDoc)
4. Check `.anatomy.stories.tsx` SIZE_SPECS / prop table / default markers

Report ONLY mismatches. Format:
- `ComponentName: cva says X='A', spec.md:N says ★B, anatomy:M says C`

End: `N components checked, M mismatches.` Under 400 words. Don't fix.
```

## 2. SSOT dead link

```
Your job: verify all SSOT pointers in .spec.md / .tsx files resolve to real headings.

Grep patterns to collect:
- `\.spec\.md「[^」]+」`
- `\.spec\.md\s*的「[^」]+」`

For each `xxx.spec.md「HEADING」`:
1. Open xxx.spec.md
2. Verify a `##` or `###` heading matching HEADING exactly exists
3. Report mismatches with `file:line — pointer — actual closest heading`

End: `N pointers checked, M dead, K soft-matches.` Under 300 words. Don't fix.
```

## 3. SSOT reciprocal

```
Your job: verify every cross-spec SSOT pointer has a reciprocal pointer back.

CLAUDE.md rule: "Own 方寫深度 section；被指方寫一行 pointer (reciprocal 必須存在，不可單向)".

For each pointer A → B「section」 found:
1. Open B.spec.md
2. Search for a pointer back to A.spec.md (anywhere, any format)
3. If missing, flag as non-reciprocal

Common patterns of reverse pointer:
- `../A/A.spec.md` in 「相關」section
- Inline `詳見 ../A/A.spec.md` reference

Report: `A.spec.md → B.spec.md:N — B 未指回 A`

Focus on current SSOT anchors (CLAUDE.md `# Spec 規則` lists them):
- tabs ↔ segmented-control
- select ↔ radio-group
- checkbox ↔ switch
- hover-card ↔ tooltip
- item-layout ↔ row primitive consumers (MenuItem / TreeItem / SidebarMenuButton / Steps)
- field-controls ↔ Field family consumers

End: `N pointers checked, M non-reciprocal.` Under 400 words. Don't fix.
```

## 4. Tailwind v4 / tailwind-merge grep

```
Your job: grep for known Tailwind-related bug patterns.

Check 1 — Tailwind v4 任意值缺 `var()` 包覆:
- Grep `className=.*\[--[a-z]` (e.g., `w-[--sidebar-width]`)
- Must be `var(--sidebar-width)` form
- False positive exclusions: `[&[data-...]]` / `[&:hover]` etc (arbitrary variants, not arbitrary values)

Check 2 — tailwind-merge 自訂 utility 未註冊:
- Find custom font-size / text-color utilities used in `className={cn(...)}`
- Cross-reference with `src/lib/utils.ts` tailwind-merge config
- Flag any custom `text-*` / `bg-*` / `border-*` utility not explicitly registered

Check 3 — Unused Swatch / TokenCell helper after past edits:
- If a file has `const Swatch = ...` but no `<Swatch` usage, flag

Report: `file:line — violation type — suggested fix`

End: `N .tsx files checked, M violations.` Under 400 words. Don't fix.
```

## 5. Token 消費紀律

```
Your job: grep src/design-system/components/*.tsx for hardcoded color values, pixel values, or magic numbers that should use tokens.

Flag:
- Hex colors: `#[0-9a-fA-F]{3,8}` (except within SVG / storybook-only files)
- rgb/rgba literals: `rgb\(|rgba\(`
- Pixel values in className like `w-[48px]`, `h-[32px]` when a token exists (e.g., `--field-height-md` is 32px)
- Inline style with raw color: `style={{ color: '#...', backgroundColor: 'rgba(...)' }}`

Don't flag:
- Opacity values (0.45, 0.6 etc)
- Generic `w-full` / `h-auto` / Tailwind-native sizes
- Story/anatomy files (those are visualization)
- SVG stroke/fill (these may need raw values for currentColor tricks)

Report: `file:line — hardcoded value — likely token replacement`

End: `N component .tsx files checked, M violations.` Under 500 words. Don't fix.
```

---

# Group B — Spec hygiene (P1 priority)

## 6. Spec Rule A 文字品質

```
Your job: audit all .spec.md under src/design-system/ against Rule A in CLAUDE.md `# Spec 規則`.

Rule A — no visual-form / implementation pollution. Flag:
- Visual: 「窄長形」/ 「圓圓的」/ 「凸起」/ 「扁平」/ 「跳動」/ 「崩潰」/ 「看不出 X 邊界」/「看起來像 Y」
- Implementation leak: raw pixel values in running text (`5.5px`, `21px`), Tailwind class lists (`bg-muted rounded-md px-3`), CSS literal (`display: flex; gap: 8px;`), pseudo-element selectors (`::after`, `bottom: -1px`)
- Physical metaphors: 「空心洞」「浮在上面的異物」(ok in stories, NOT spec)

Don't flag:
- Token names (`--field-height-md`, `var(--primary)`)
- cva variant string literals
- SSOT pointers referencing class names

Report: `file:line — 違規句 — 替換方向`
End: `N specs checked, V violations, top offenders: [list]` Under 500 words. Don't fix.
```

## 7. Spec Rule B 邊界案例

```
Your job: audit all .spec.md against Rule B in CLAUDE.md `# Spec 規則` → 邊界案例覆蓋 (apply Scope 預設).

For each spec check:
- disabled / loading / empty
- dark mode (flag only if custom palette beyond semantic tokens)
- density (flag only if not using field-height/layout-space tokens)
- icon-only (flag only if component supports icon-only)

Scope defaults (do NOT flag if):
- Field-family component delegating to field-controls.spec.md
- Pure wrappers (Separator/Skeleton/Spinner) claiming "無互動狀態"
- Dark mode handled by semantic token

Report GENUINE gaps only: `ComponentName — missing: X / Y` + why not N/A

End: `N specs checked, M genuine gaps, L scope-N/A accepted.` Under 500 words. Don't fix.
```

## 8. 7-維度 對標覆蓋

```
Your job: for each .spec.md, verify coverage of the 7 world-class DS dimensions (CLAUDE.md `# Spec 規則` → 對標世界級 DS).

The 7 dimensions:
1. 何時用 / 何時不用 (when to use / not use)
2. 與近親元件的分界 (vs neighboring components — SSOT)
3. 常見誤解 / 禁止事項 (common misuses)
4. 相關元件 links (related)
5. 空值呈現 (empty state)
6. 驗證時機 (validation timing — for form-related)
7. Loading / 無障礙預設 (loading / a11y defaults)

For each spec, list which dimensions are missing that should be present (apply judgment — pure layout primitives may skip 6/7, behavior primitives may skip 5).

Report: `ComponentName — covered: [list] | missing: [list]`

Include: analysis of 3 specs as exemplars (Button / SegmentedControl / Badge should hit all 7 if applicable).

End: `N specs checked, average dimensions covered: X/7. Specs needing most attention: [top 5]`. Under 600 words. Don't fix.
```

---

# Group C — Code conformance (P1 priority)

## 9. shadcn passthrough 完整度

```
Your job: check every component .tsx in src/design-system/components/ for shadcn structural completeness.

Each component's main exported component must have:
1. `React.forwardRef<...>` (ref forwarded to DOM)
2. `displayName` set
3. `...props` spread to DOM
4. cva() managing variants (if has variants)
5. Radix data-state / data-disabled / data-orientation preserved (if wraps Radix)
6. `asChild` support OR documented reason not to (if wraps Radix Slot-compatible primitive)

Flag components missing any of these. Report per component:
- `ComponentName — missing: forwardRef / displayName / ...props / asChild / radix data-attribute`

Exclude:
- Internal-only helpers (SelectionItem, anatomy-utils)
- Simple function components that aren't the main export

Report: `N components checked, M with holes.` Under 500 words. Don't fix.
```

## 10. a11y 基本覆蓋

```
Your job: audit src/design-system/components/ for a11y basics.

Check each .tsx and its .stories/.anatomy/.principles:
1. icon-only interactive elements (Button iconOnly / IconButton) — must have `aria-label`
2. Interactive elements (onClick / onKeyDown) — must have keyboard handler or role
3. Form controls — must be properly labeled (Field / FieldLabel or aria-labelledby)
4. Role semantics — does button use <button>? Does listbox use role="listbox"?

DON'T flag:
- Radix primitives (they manage ARIA internally — Checkbox / Radio / Dialog etc.)
- Skeleton / Spinner (aria-hidden is common pattern)
- Decorative icons without interactive parent

Report: `file:line — missing: aria-label / role / keyboard`

End: `N files checked, M a11y gaps, top offenders: [list]`. Under 500 words. Don't fix.
```

---

# Group D — Story layer (P1 priority)

## 11. Story 三層齊全

```
Your job: verify every public Components/ folder has all 3 stories:
- {name}.stories.tsx (showcase)
- {name}.anatomy.stories.tsx (spec)
- {name}.principles.stories.tsx (usage principles)

For Internal/ folder, only .stories.tsx + .anatomy.stories.tsx required (principles optional).

Scan src/design-system/components/ — for each component folder:
1. List files
2. Classify: public (Components/) or internal based on Storybook title in .stories.tsx
3. Report missing layer per classification

Report: `ComponentName (classification) — missing: [stories type]`

End: `N component folders checked, M missing layers.` Under 400 words. Don't fix.
```

## 12. Story 人話範例

```
Your job: audit all .stories.tsx + .principles.stories.tsx for placeholder / abstract text per CLAUDE.md `# Story` → 範例選擇原則 → 明確禁止.

Flag:
- Placeholder: `Option A/B/C`, `Lorem ipsum`, `foo/bar`, `Item 1/2/3`
- Abstract 代號: `按鈕一 / 按鈕二`, `Variant X`, `Rule A/B`
- Extreme unrealistic: single Button with destructive 3-line text, 50-item filter, 5-level dialog
- Visual symbols: `│─ 業務 ─│`, ASCII art
- spec 代號: `符合 Rule 3.2`
- Variant names as visible labels (e.g., literal `<Button>Primary</Button>`)

DON'T flag:
- aria-label / placeholder= / cva value literals
- Badge/status where the label IS real content

Report: `file:line — violating text — real scenario suggestion`
End: `N files checked, V violations.` Under 600 words. Don't fix.
```

## 13. Anatomy Figma-inspect 完整度

```
Your job: audit .anatomy.stories.tsx per CLAUDE.md `# Story` → 設計規格 Story 標準.

Each must have 5 sections:
1. 元件總覽 (Anatomy + Variant 一覽 + Props table)
2. 元件檢閱器 (controls + blueprint + Inspect panel)
3. 色彩對照表 (Variant × State + live swatches via `style={{backgroundColor:'var(--token)'}}`)
4. 尺寸對照表 (Size token table + Visual matrix)
5. 狀態行為 (interaction transitions + disabled for all variants)

Flag per file:
- Missing sections
- Density dual values (`md density / lg density` columns) — CLAUDE.md forbids
- `rest` instead of `default` — dev language violation
- Token name shown without live swatch
- Raw pixels when token exists
- Content mismatch (principles in anatomy, showcase in anatomy)

Report: `ComponentName (path) — missing: [sections] | issues: [brief list with line numbers]`
End: `N checked, I incomplete, F Figma-test fails. Top 5 worst: [list]`. Under 700 words. Don't fix.
```

---

# Group E — System-level (P1 priority)

## 14. 命名一致性

```
Your job: audit the codebase against CLAUDE.md `# 命名與語言一致性` (Meta 規則).

Checks:
1. Component folder = PascalCase (e.g., `DatePicker/`)
2. Component file = kebab-case (e.g., `date-picker.tsx`)
3. Pattern folder + file = kebab-case (e.g., `item-layout/item-layout.spec.md`)
4. Hook file = kebab-case (e.g., `use-is-mobile.ts`)
5. Token folder: single word lowercase / multi camelCase (`color/` / `uiSize/`)
6. Spec H1 = `# {元件名} 設計原則` pattern
7. Storybook title = `Design System/{Components|Internal|Patterns|Tokens}/{Name}/{子頁中文}`
8. Suffix 統一: `.spec.md` / `.stories.tsx` / `.anatomy.stories.tsx` / `.principles.stories.tsx` — no custom suffixes
9. Single-file comment language consistency (中 file → 中 comments, 英 file → 英 comments)

Report: `path — violation — suggested correction`

End: `N files checked, M violations across C categories.` Under 600 words. Don't fix.
```

## 15. CLAUDE.md 自身一致性

```
Your job: audit CLAUDE.md for internal consistency.

Checks:
1. No duplicated rules (e.g., same rule stated in 2 sections)
2. No contradictions (e.g., section X says "always do A" + section Y says "never do A")
3. Internal section references resolve: `# Story`, `# Spec 規則` etc. actually exist
4. Rule coverage: every item in 「失敗記憶索引」 has an anchor section
5. Pointer format: `# Section` or `# A → ## B` not mixed
6. Task navigation table entries all resolve to real sections
7. Mindset rules referenced in other sections exist

Report: `line N — issue — suggestion`

End: `Total issues found: M. Categories: [breakdown]`. Under 500 words. Don't fix.
```

---

## Running all 15 in parallel

Single message with 15 `Agent` tool calls, each with `run_in_background: true`. Expected wall time: 3-5 minutes for all to complete (they process in parallel server-side).

After all return:
- Consolidate findings per file with line numbers
- Build priority matrix (P0 / P1 / P2)
- Present Checkpoint 1 triage to user
- DO NOT auto-fix P2 without approval
