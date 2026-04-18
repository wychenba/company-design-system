---
name: design-system-audit
description: Systematic audit of this design system for world-class quality. Runs 15 audits covering spec hygiene / code correctness / a11y / naming / tokens / patterns / CLAUDE.md consistency, and surfaces actionable fix lists. Has explicit checkpoints where the skill MUST stop and ask user. Invoke via /design-system-audit when asked to audit, re-audit, check quality, or verify design system health.
---

# Design System Audit (15 dimensions, world-class)

Purpose: catch every bug class this project has shipped historically PLUS structural gaps relative to Polaris / Material / Atlassian / Ant / Carbon / Apple HIG. Each audit has a clear rubric tied to CLAUDE.md rules. The skill reports findings and **explicitly stops at checkpoints** for user decisions before large-scope fixes.

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

## The 15 audits

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

---

## Workflow

### Phase 0 — Setup

1. Read `CLAUDE.md` completely
2. Run `git status --short` — baseline
3. Create TaskList entries for each audit you plan to run

### Phase 1 — Parallel audit execution

Launch all 15 audits as background subagents (single message, multiple `Agent` tool calls with `run_in_background: true`). Use prompts in [references/audit-prompts.md](references/audit-prompts.md).

Each audit reports:
- Violations only (skip confirmations)
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

### Phase 4 — Final report + memory update

After all commits:
- Update `memory/project_audit_progress.md`:
  - Date + audit coverage (which of the 15)
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

- [references/audit-prompts.md](references/audit-prompts.md) — Exact subagent prompts for all 15 audits
- [references/historical-bugs.md](references/historical-bugs.md) — Bug classes indexed by audit
- [references/checkpoints.md](references/checkpoints.md) — Detailed examples of each MUST-ASK scenario
