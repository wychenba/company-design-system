---
name: design-system-audit
description: Systematic audit of this design system for world-class quality. Runs 20 audits covering spec hygiene / code correctness / a11y / naming / tokens / patterns / CLAUDE.md consistency / Layout Family compliance / prop value collisions / shadcn alias leakage / home-name-vs-scope fit / spec hardcoded-values, and surfaces actionable fix lists. Has explicit checkpoints where the skill MUST stop and ask user. Invoke via /design-system-audit when asked to audit, re-audit, check quality, or verify design system health.
---

# Design System Audit (20 dimensions, world-class)

Purpose: catch every bug class this project has shipped historically PLUS structural gaps relative to Polaris / Material / Atlassian / Ant / Carbon / Apple HIG. Each audit has a clear rubric tied to CLAUDE.md rules. The skill reports findings and **explicitly stops at checkpoints** for user decisions before large-scope fixes.

## Skill 生態位

本 skill audit **DS 本身**(`src/design-system/` 內部的 spec / cva / SSOT / layout primitives 等)。若要 audit **consumer 層 UI code**(`src/app/` / `src/explorations/` 用 DS 的地方是否正確),走 `/product-ui-audit`。兩 skill scope 正交,不重疊。

```
/design-system-audit    audit DS 本身(本 skill)— Phase 1-4 統籌,Phase 3 chain 各維 skill
/product-ui-audit       audit consumer UI 對 DS 的消費
/prototype              建 exploration(Phase 3.5 強制進階 6 維)
/delivery-handoff       產品 final 後的交付文件包
```

## 對齊 CLAUDE.md `# 稽核 6 維 + 2 模式` — 本 skill 是 6 維的 D1 + D2 home

CLAUDE.md 定義 6 維:D1 設計語言 / D2 程式語言 / D3 效能 / D4 UX / D5 視覺 / D6 原則自檢。本 skill 的 20 audits 覆蓋 **D1 + D2**(spec hygiene / code correctness / SSOT / cva / naming / tokens / patterns)。**D3-D5 由對應 skill 處理**:

| 維度 | 對應 skill |
|------|-----------|
| D1 設計語言 | 本 skill Audits 1-20 |
| D2 程式語言 | 本 skill(cva / types / imports 部分)+ tsc / lint |
| D3 元件效能 | `/performance-audit`(render / memo / bundle) |
| D4 UX 行為 | `/ux-audit`(keyboard / focus / ARIA / animation) |
| D5 視覺品質 | `/visual-audit`(Layer A mechanical + Layer B AI) |
| D6 原則自檢 | 本 skill Phase 4 報告含「提議討論」區(對齊 `# 稽核 vs 執行 分權 canonical`) |

**進階模式 scope=all**(全 DS 健檢 / release cut):本 skill Phase 3 chain `/performance-audit --scope=all` + `/ux-audit --scope=all` + `/visual-audit` 完整 6 維 sweep。

## When to run

- User asks to audit / re-audit / 檢查 / verify design system
- Before major release or version bump
- After large refactor that touched specs, cva defaults, or tokens
- Periodic health check (monthly-ish)
- User mentions "world-class" or quality concerns

## Preconditions

- Working directory is project root (verify `src/design-system/` exists)
- `CLAUDE.md` read fully at start (rules evolve; don't audit from memory)
- Current branch clean OR user acknowledges changes will be reviewed before commit

---

## The 20 audits

Grouped by theme. Each runs as an independent subagent; many can parallelize.

### Group A — Correctness (bug-class guards, P0 priority)

| # | Audit | What it catches |
|---|-------|-----------------|
| 1 | **cva defaultVariants 三方漂移** | `cva()` vs spec prop table vs tsx docblock vs anatomy prop table disagreement on default value |
| 2 | **SSOT dead link** | `xxx.spec.md「HEADING」` pointers that don't resolve to a real heading |
| 3 | **SSOT reciprocal** | A → B pointer exists but B → A reverse pointer missing (CLAUDE.md: reciprocal 必須存在) |
| 4 | **Tailwind v4 / tailwind-merge grep** | `className="[--foo]"` (needs `var()`) / unused Swatch helper / registered group mismatch |
| 5 | **Token 消費紀律** | Hardcoded hex / rgb / px color values in `.tsx` when a semantic token exists |

### Group B — Spec hygiene (world-class DS rubric, P1 priority)

| # | Audit | What it catches |
|---|-------|-----------------|
| 6 | **Spec Rule A 文字品質** | Visual descriptions / pixel leaks / physical metaphors in `.spec.md` (belong in stories) |
| 7 | **Spec Rule B 邊界案例** | Missing disabled/loading/empty/dark mode/density/icon-only coverage (apply scope defaults) |
| 8 | **7-維度 對標覆蓋** | Each spec covers the 7 world-class dimensions: 何時用 / 何時不用 / 近親元件分界 / 常見誤解 / 相關 links / 空值 / 驗證時機 / Loading / a11y 預設 |

### Group C — Code conformance (P1 priority)

| # | Audit | What it catches |
|---|-------|-----------------|
| 9 | **shadcn passthrough 完整度** | Missing `React.forwardRef` / `displayName` / `asChild` / `...props` spread / Radix `data-state` retention |
| 10 | **a11y 基本覆蓋** | icon-only without `aria-label`, interactive elements without ARIA role, missing keyboard handlers |

### Group D — Story layer (designer-facing, P1 priority)

| # | Audit | What it catches |
|---|-------|-----------------|
| 11 | **Story 三層齊全** | Every `Components/` (public) component has all 3: `.stories.tsx` / `.anatomy.stories.tsx` / `.principles.stories.tsx` |
| 12 | **Story 人話範例** | Placeholder / abstract codes / extreme scenarios / variant names as labels |
| 13 | **Anatomy Figma-inspect 完整度** | 5 mandatory sections present / token-first / dev language / no density dual / live swatches |

### Group E — System-level consistency (P1 priority)

| # | Audit | What it catches |
|---|-------|-----------------|
| 14 | **命名一致性** | PascalCase folder / kebab-case file / hook naming / spec chapter 中文 / identifier 英文 / single-file 語言統一 |
| 15 | **CLAUDE.md 自身一致性** | Internal contradictions / duplicated rules / dead internal references / section-heading drift |

### Group F — Architecture compliance (P1 priority, session-learned)

| # | Audit | What it catches |
|---|-------|-----------------|
| 16 | **Layout Family 宣告** | 每個 component spec 第一段必須宣告「Layout Family: 1/2/3/4」或明示「非 family（self-contained / composite）」; 缺漏代表元件遊離於系統 |
| 17 | **Prop value 跨元件認知衝突** | 同字 literal 在不同元件作 prop value 但語義衝突(`text` 是 Button `variant="text"` 文字樣式,若 FileItem `mode="text"` 變成「文字為主呈現」= 雙語義,consumer 混淆)——命名三 test 第 3 條強制檢查 |
| 18 | **shadcn compat alias 回流檢查** | grep `bg-popover / text-popover-foreground / text-muted-foreground / bg-accent / text-accent-foreground / bg-destructive / bg-background` 等在我們的元件 code——這些是 shadcn copy-paste 安全網,我們元件應用 direct token。每次 audit 重新 grep 防 `npx shadcn add X` 新生成的 code 留下 alias |

### Group G — Home governance + spec hygiene (P1 priority)

| # | Audit | What it catches |
|---|-------|-----------------|
| 19 | **Home-name-vs-scope 一致性** | classification folder 名稱若與實際 scope 偏離(item-layout 裝 4-family taxonomy → rename item-anatomy 的學到的教訓);charter README 說的「這裡收 X」與實際內容是否一致 |
| 20 | **Spec 硬寫機械化值檢查** | spec.md 不該有 `5.5px` / 完整 Tailwind class lists / cva object literals — 這些屬 tsx;spec 只記錄「為什麼」的判斷性描述 |

---

## Workflow

### Phase 0 — Setup + Build Baseline

1. Read `CLAUDE.md` completely
2. Run `git status --short` — baseline
3. **Build baseline — if any fail, STOP and report (see Checkpoint 5)**:
   - `npx tsc -b 2>&1 | grep -c "error TS"` — must be `0`
   - `npx vite build 2>&1 | tail -3` — must show `✓ built in`
   - `lsof -i :6006 -t` OR `npm run build-storybook 2>&1 | tail -3` — storybook must build clean
   - `grep -rE '\.stories\.tsx$' src/design-system/components` + syntax-check each via quick `npx tsc --noEmit <file>` sample — catches stories that index but type-fail
4. **If any baseline fails**: do NOT run the 20 dimensions yet. Audit quality assumes the code compiles. Report build status and ask user whether to fix build first OR proceed anyway (audit on broken code has limited value — many dimensions can't run meaningfully)
5. Create TaskList entries for each audit you plan to run

### Phase 1 — Parallel audit execution

Launch all 20 audits as background subagents (single message, multiple `Agent` tool calls with `run_in_background: true`). Use prompts in [references/audit-prompts.md](references/audit-prompts.md).

**Every audit prompt declares three metadata lines at top**:
- **Type**: `Absolute` or `Consistency` (per CLAUDE.md「Consistency Audit 原則」)
- **Canonical source**: where correct behavior is defined
- **Rationale home**: where deviation justification should live (`N/A` for Absolute)

Sub-agents applying a **Consistency** dim **must** search the Rationale home for each apparent deviation before reporting as VIOLATION. A documented rationale paragraph = `deviation ✓` (not a violation). Absolute dims apply strict `actual == canonical` check.

Each audit reports:
- Violations only (skip confirmations); for Consistency dims, also list `deviation ✓` items with rationale location as evidence the framework caught-and-cleared them
- file:line for every finding
- Suggested fix direction
- Count + top offenders

### Phase 2 — Triage + CHECKPOINT 1 (MUST ASK)

Consolidate into priority matrix:

| Priority | Category | Examples |
|---|---|---|
| **P0 (auto-fix OK)** | Three-way drift / dead links / Tailwind v4 grep violations / hardcoded colors | 明確 bug，surgical 修復，無 scope 爭議 |
| **P1 (batch-fix + review)** | Rule A / 人話 / shadcn passthrough holes / a11y missing aria-label / anatomy missing section | 每組一個 commit，改完立刻 review |
| **P2 (MUST ASK)** | Rule B scope / new rule proposals / Internal vs Components reclassification / cross-cutting refactors (helper extraction 41 files) | 需 user 決策 scope |

### ⚠️ Checkpoint 1 — ALWAYS ASK before P2

Present to user:
```
Found: N P0, M P1, K P2.
P0 + P1 I'll auto-fix (grouped commits).
P2 decisions needed:
- [list each P2 finding + proposed options]
Proceed with P0+P1? Then discuss P2?
```

**Do NOT skip this step.** Previous audit runs failed when I mechanically applied fixes to 46 specs without scope discussion.

### Phase 3 — Apply fixes (grouped commits)

For each fix group:
1. Apply fixes surgically (Edit, not Write)
2. Run `npx tsc --noEmit` — must pass
3. Commit with descriptive message listing what changed

Typical commit groups:
- `fix: cva three-way drift — X components`
- `docs: Spec Rule A cleanup — remove visual pollution from N specs`
- `feat: a11y — add aria-label to icon-only buttons (X components)`
- `docs: Anatomy — live color swatches + complete missing sections`
- `docs: CLAUDE.md — resolve internal contradiction in X`

### ⚠️ Checkpoint 2 — ALWAYS ASK when audit reveals a gap in CLAUDE.md

If any audit surfaces a pattern NOT covered by an existing CLAUDE.md rule (e.g., "a11y audit found 7 components missing focus-visible — no explicit rule about focus ring"), STOP:

```
Audit found a pattern not codified in CLAUDE.md:
[describe pattern]
Proposed new rule for CLAUDE.md: [draft]
Approve adding to CLAUDE.md? Or different phrasing?
```

### ⚠️ Checkpoint 3 — ALWAYS ASK when classification is ambiguous

Audits may find:
- Component that's borderline `Internal/` vs `Components/`
- Pattern that could be SSOT-owned by either of two spec files
- Token that could be primitive vs semantic

STOP and present options with rationale — don't decide unilaterally.

### ⚠️ Checkpoint 4 — Cross-cutting refactor（影響 > 10 檔）

When a fix touches 10+ files (e.g., helper extraction across 41 anatomy files, token rename across 71 utility usages), STOP and present execution-strategy options (one commit / N commits / defer). Full template in [references/checkpoints.md](references/checkpoints.md).

### ⚠️ Checkpoint 5 — 環境 / 建置問題

If audit encounters env / build issue (node_modules broken, storybook module-not-found), DO NOT attempt to fix env within audit scope. Report separately. Full template in [references/checkpoints.md](references/checkpoints.md).

### ⚠️ Checkpoint 6 — 發現 spec 與 code 衝突

When audit finds spec.md describes behavior different from tsx actual, STOP — don't silently pick one. Present options + git log context. Full template in [references/checkpoints.md](references/checkpoints.md).

### ⚠️ Checkpoint 7 — HANDLE「先不管」correctly（user directive semantic）

**本 checkpoint 是 Skill 自身 SSOT**（CLAUDE.md 規則分層決定:對話 protocol 屬 skill 層,非設計規則層）:

| User phrasing | Meaning | Action |
|---------------|---------|--------|
| 「先不管」/「這個先跳過」 | **Completely ignore** — not a tech debt | Do NOT add to memory, failure index, or next-audit surface. Act as if topic never existed. |
| 「之後再處理」/「先記下來」 | Park as tech debt | Add to `memory/project_audit_progress.md` 「仍待未來處理」 |
| 「全部做完」/「馬不停蹄」| Execute now | Proceed |

**Never conflate the two**: adding a 「先不管」 item to tech debt violates user's explicit directive (it re-surfaces on next audit, creating noise).

### ⚠️ Naming proposal — RUN 3-test BEFORE Checkpoint 2 approval

Per CLAUDE.md `## 命名必過三重 test`, when proposing ANY new naming (variant / mode / prop value / token):

1. **Existing design language test**: aligned with project's existing naming patterns?
2. **World-class idiom test**: at least 2 world-class DS use this term?
3. **Cross-component cognitive collision test**: does the string literal collide semantically with any existing prop value elsewhere?

**If any test fails → iterate naming, don't propose**. Historical: `text/picture` (Ant Design idiom ✓) failed test 3 (collides with Button `variant="text"`), changed to `compact/rich`.

### Phase 3.5 — 進階 6 維稽核 D3-D5(scope 依稽核模式)

對齊 **CLAUDE.md `# 稽核 6 維 + 2 模式 + 觸發 canonical`**:本 skill 完成 Phase 1-3 後,已覆蓋 D1 設計語言 + D2 程式語言;D3 效能 / D4 UX / D5 視覺 需 chain 專門 skill。**進階模式必跑全 D3-D5**;高效模式可只跑 D5。

**模式判定**:
- **高效(default,Tier 2 daily)**:scope=changed,只跑 D5(visual)
- **進階(Tier 3 periodic)**:scope=all,**D3 + D4 + D5 全跑**
  - Trigger 條件:user 顯式 invoke `/design-system-audit --deep`,OR 本次 Phase 3 commits 動到 `tokens/` / `patterns/element-anatomy/` / `patterns/overlay-surface/`(擴散多元件),OR user 要求「整個 DS 大稽核」「完整 audit」「進階模式」
- **Component focus**:audit 集中在單一元件 → `--scope=component:<Name>`

**Process(進階模式完整 6 維)**:

**Phase 3.5a — D5 視覺品質**
1. Auto 選 scope + run `npm run visual-audit --` with scope flag(Layer A:contrast + geometry + screenshot)
2. Layer A violation 有 → 開新 commit 修,回圈到 Phase 2 triage
3. Layer A 過 → chain `/visual-audit` skill 做 Layer B AI judgement,讀 `snapshots/*.png`

**Phase 3.5b — D3 元件效能(進階模式強制)**
- Chain `/performance-audit` scope 同上
- 檢查:render count / memo gap / bundle impact / useEffect 鏈 / context thrashing
- 高 impact finding → Phase 2 triage;`# 稽核 vs 執行 分權 canonical`:修實作類 auto,改 canonical 類 STOP

**Phase 3.5c — D4 UX 行為(進階模式強制)**
- Chain `/ux-audit` scope 同上
- 檢查:keyboard nav / focus / ARIA / animation / interaction canonical / 三態
- P0(完全 block a11y)必修;P1 Phase 2 triage

**Phase 3.5d — D6 原則自檢(進階模式)**
- 彙整 D1-D5 中所有「提議討論」finding(牴觸 canonical 但非明顯 bug)
- 列入 Phase 4 final report「提議討論區」,**STOP 等 user sign-off**(不自改原則)

**為什麼在 Phase 3 後**:先讓 20 dim code audit 修完,再跑 D3-D5 — 避免 D3-D5 抓到的 finding 其實是 code audit 該抓的(例如 token leak 影響視覺)。

**跳過條件**:
- 本次 audit commits 都是 spec.md 純文字修正(無 tsx / token 改動)→ D3-D5 無變,可跳 Phase 3.5
- 高效模式:只跑 Phase 3.5a(D5),跳 3.5b / 3.5c

### Phase 4 — Final report + memory update

After all commits:
- Update `memory/project_audit_progress.md`:
  - Date + audit coverage (which of the 20)
  - Findings + resolved counts
  - Known remaining gaps (deferred P2)
- Short final report:
  - Commits created
  - Deferred items with reasons
  - Next re-audit trigger

---

## Non-goals

- Don't rewrite specs / stories from scratch (surgical only)
- Don't fix pre-existing env issues (node_modules / storybook module-not-found)
- Don't add new components / features (separate work)
- **Don't skip checkpoints** — user decides P2 and new-rule scope
- Don't collapse audit output into summaries before presenting — user needs file:line details

## Common failure modes (watch for these)

- **Agent hallucinates a fix** → always cross-check file:line before editing
- **Rule B gaps are mostly scope-N/A** → apply CLAUDE.md scope defaults; don't stub 46 specs
- **cva audit false positive** → only report if spec/anatomy make a claim that contradicts code
- **Story audit flags aria-label / cva values** → exclude these from violation criteria
- **a11y audit over-flags** → Radix primitives handle most ARIA; check if Radix base already provides before flagging wrapper
- **Skipping Checkpoint 1** → history shows this leads to mechanical changes with unclear scope; always present triage to user first

## References

- [references/audit-prompts.md](references/audit-prompts.md) — Exact subagent prompts for all 20 audits
- [references/historical-bugs.md](references/historical-bugs.md) — Bug classes indexed by audit
- [references/checkpoints.md](references/checkpoints.md) — Detailed examples of each MUST-ASK scenario
