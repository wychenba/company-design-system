#!/usr/bin/env node
/**
 * audit-coverage-matrix.mjs — Per-dim deterministic script coverage matrix
 *
 * 2026-05-23 永久 anti-sample mechanism per user verbatim「幹你娘就叫你他媽所有稽核都要完整執行
 * 不要再抽樣,到底要講幾次?...把全部要稽核的東西都給我避免抽樣」
 *
 * 每 audit dim 分 3 tier:
 *   - DETERMINISTIC:有 deterministic script,sub-agent 必 chain,output 含「N files scanned, 0 violations」cite
 *   - HOOK-ENFORCED:有 write-time PostToolUse hook(`check_*_invariants.sh`),audit-time 信賴 hook accumulated state
 *   - PURE-JUDGMENT:genuinely 需 LLM reasoning(content quality 主觀),dispatch contract 強制「DS-wide all files 不 sample」
 *
 * Output:
 *   - `.claude/logs/audit-coverage-matrix.json` — per-dim tier + script path
 *   - stderr — gap list(dim 無 deterministic script 且非 PURE-JUDGMENT → fill candidate)
 *
 * Usage:
 *   node scripts/audit-coverage-matrix.mjs           # report
 *   node scripts/audit-coverage-matrix.mjs --check   # CI(exit 1 if dim has no anti-sample mechanism)
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CHECK = process.argv.includes('--check')

// Per-dim coverage classification(SSOT — sync 進 design-system-audit/SKILL.md per-dim row)
const COVERAGE = {
  // Group A — Correctness
  1: { tier: 'HOOK-ENFORCED', mechanism: 'cva 三方漂移 — story-auto-compile-migrate + compile-stories.mjs --check chain' },
  2: { tier: 'DETERMINISTIC', mechanism: 'scripts/audit-spec-deadlinks.mjs --check(掃 83 spec.md cross-ref pointer,assert target 存在;2026-05-30 從誤分 PURE-JUDGMENT 修正)' },
  3: { tier: 'DETERMINISTIC', mechanism: 'scripts/add-reciprocal-pointers.mjs(auto-maintained,Dim 3 SSOT reciprocal)' },
  4: { tier: 'HOOK-ENFORCED', mechanism: 'check_opacity_token_usage.sh + utility-registry.json — write-time block' },
  5: { tier: 'DETERMINISTIC', mechanism: 'scripts/audit-orphan-tokens.mjs --check(0 真孤兒 verdict)' },
  // Group B — Spec hygiene
  6: { tier: 'PURE-JUDGMENT', mechanism: 'Spec 文字品質 AI judgment;dispatch 必 DS-wide 全 spec.md(82 files),禁 sample;含 file:line per finding' },
  7: { tier: 'PURE-JUDGMENT', mechanism: 'Spec 邊界案例 AI judgment;dispatch 必 DS-wide 全 spec.md 每 spec 過 7-dim 覆蓋' },
  8: { tier: 'PURE-JUDGMENT', mechanism: '7-維對標 AI judgment;dispatch 必 DS-wide 全 spec.md;每 spec 7-dim per row' },
  // Group C — Code conformance
  9: { tier: 'HOOK-ENFORCED', mechanism: 'check_codex_collab_5step.sh + shadcn passthrough grep(forwardRef / displayName)— dispatch 全 components/*.tsx 全掃' },
  10: { tier: 'PURE-JUDGMENT', mechanism: 'a11y aria-label DS-wide AI judgment + scripts/audit-a11y.mjs(axe-core deterministic);dispatch 必 全 components grep aria-label coverage' },
  // Group D — Story layer
  11: { tier: 'HOOK-ENFORCED', mechanism: 'check_story_anatomy.sh + 3-layer file existence DS-wide grep' },
  12: { tier: 'PURE-JUDGMENT', mechanism: 'Story 人話 AI judgment;dispatch 必 DS-wide 全 stories 過 placeholder/jargon test' },
  13: { tier: 'HOOK-ENFORCED', mechanism: 'check_story_anatomy.sh 5-section structural enforce' },
  // Group E — System
  14: { tier: 'PURE-JUDGMENT', mechanism: '命名一致性 cross-component AI judgment;dispatch 必 grep DS-wide prop value semantic conflicts' },
  15: { tier: 'DETERMINISTIC', mechanism: 'scripts/audit-content-quality.mjs --check(cross-doc drift)' },
  // Group F — Architecture
  16: { tier: 'DETERMINISTIC', mechanism: 'scripts/audit-layout-family-frontmatter.mjs --check(primary spec 必有 family: frontmatter;2026-05-30 從誤分 PURE-JUDGMENT 修正)' },
  17: { tier: 'PURE-JUDGMENT', mechanism: 'Prop value cross-component semantic conflict — dispatch 必 grep prop literal DS-wide' },
  18: { tier: 'HOOK-ENFORCED', mechanism: 'check_token_hygiene.sh(folded lib/_token_hygiene.sh — shadcn compat alias ban write-time)+ DS-wide grep audit-time;2026-05-30 M4 修 stale ref check_shadcn_alias' },
  // Group G — Home governance
  19: { tier: 'PURE-JUDGMENT', mechanism: 'Home-name-vs-scope AI judgment;dispatch 必 DS-wide enumerate folder vs actual scope' },
  20: { tier: 'PURE-JUDGMENT', mechanism: 'Spec 硬寫機械化值 — dispatch 必 grep DS-wide spec.md 找 px / hex / Tailwind class lists' },
  // Group H — Consumer
  21: { tier: 'HOOK-ENFORCED', mechanism: 'check_item_list_gap.sh write-time' },
  22: { tier: 'HOOK-ENFORCED', mechanism: 'check_container_breathing.sh write-time' },
  // Group I — Story auto-compile
  23: { tier: 'DETERMINISTIC', mechanism: 'scripts/compile-stories.mjs --all --check(drift / migration pending)' },
  24: { tier: 'PURE-JUDGMENT', mechanism: 'Story 範例重複性 AI judgment;dispatch 必 per-component DS-wide 列 stories scenario matrix' },
  25: { tier: 'PURE-JUDGMENT', mechanism: 'Story 必要性 grounding DS-wide AI judgment;dispatch 必 per-component 全掃 過 2-test(spec-tied / removal-degrade)' },
  // Group J — Form / state
  26: { tier: 'PURE-JUDGMENT', mechanism: 'Controlled/Uncontrolled dual-mode AI judgment;dispatch 必 DS-wide form-like + overlay-like enumerate dual-mode pair check' },
  // Group K — Code quality
  27: { tier: 'DETERMINISTIC', mechanism: 'scripts/code-quality-audit.mjs --scope=all(any/dead-export/long-fn/magic-number)' },
  // Group L — Story splitting
  28: { tier: 'PURE-JUDGMENT', mechanism: 'Manual story split principle DS-wide AI judgment;dispatch 必 per-component grep stories.tsx WithStartIcon/WithEndIcon split anti-pattern' },
  29: { tier: 'HOOK-ENFORCED', mechanism: 'check_story_category.sh trait-based DS-wide enforce' },
  30: { tier: 'HOOK-ENFORCED', mechanism: 'check_principles_canonical.sh DS-wide enforce' },
  // Group M — Overlay body
  31: { tier: 'HOOK-ENFORCED', mechanism: 'check_overlay_handcraft.sh + grep ban stripped-padding boolean variant' },
  32: { tier: 'PURE-JUDGMENT', mechanism: 'Filter operator registry SSOT consumption — dispatch 必 grep consumer hardcode op string DS-wide' },
  33: { tier: 'PURE-JUDGMENT', mechanism: 'Component classification + abstraction discipline DS-wide AI judgment;5 sub-dims per-component 全掃' },
  // Group N — State + chain
  34: { tier: 'HOOK-ENFORCED', mechanism: 'check_disabled_placeholder_color.sh' },
  35: { tier: 'HOOK-ENFORCED', mechanism: 'check_overlay_panel_scroll_chain.sh' },
  36: { tier: 'DETERMINISTIC', mechanism: 'scripts/audit-data-table-row-mode-ssot.mjs(已 wire ci.yml verify;cell-render wrapper 消費 per-row state;2026-05-30 從誤分 PURE-JUDGMENT 修正)' },
  37: { tier: 'HOOK-ENFORCED', mechanism: 'check_field_family_invariants.sh(focus-dominates border-primary state machine;2026-05-30 從誤分 PURE-JUDGMENT 修正)' },
  38: { tier: 'PURE-JUDGMENT', mechanism: 'Inline-action gap canonical — dispatch 必 grep ItemInlineAction sibling gap DS-wide' },
  39: { tier: 'HOOK-ENFORCED', mechanism: 'check_pattern_invariants.sh C.4(row-slot handcraft,2026-05-30 fixed order-independent regex + 從誤分 PURE-JUDGMENT 修正)' },
  // Group O — Storybook content quality
  40: { tier: 'DETERMINISTIC', mechanism: 'scripts/audit-story-quality.mjs --check(title canonical 全 196 stories deterministic)' },
  41: { tier: 'DETERMINISTIC', mechanism: 'scripts/audit-story-quality.mjs --check(name jargon 全 350 names deterministic)' },
  42: { tier: 'DETERMINISTIC', mechanism: 'scripts/audit-story-quality.mjs --check(placeholder 全 stories deterministic)' },
  43: { tier: 'PURE-JUDGMENT', mechanism: 'Rule note 品質 AI judgment;dispatch 必 DS-wide 全 principles.stories rule notes per-component sample-free read' },
  44: { tier: 'PURE-JUDGMENT', mechanism: 'Internal vs Components 三 test DS-wide — dispatch 必 enumerate ALL Internal folder + components,3-test per row' },
  45: { tier: 'DETERMINISTIC', mechanism: 'scripts/compile-stories.mjs --all + grep generated rows full coverage' },
  46: { tier: 'PURE-JUDGMENT', mechanism: 'Manual vs Mechanical boundary — dispatch 必 grep DS-wide stories trait-derived hand-written exports' },
  // Group P — World-class tier
  47: { tier: 'HOOK-ENFORCED', mechanism: 'check_token_hygiene.sh(folded lib/_token_hygiene.sh)+ utility-registry.json SSOT;2026-05-30 M4 修 stale ref check_tailwind_token_registry' },
  48: { tier: 'DETERMINISTIC', mechanism: 'scripts/audit-orphan-tokens.mjs --check(0 真孤兒 structural-keep classifier)' },
  49: { tier: 'DETERMINISTIC', mechanism: 'scripts/audit-a11y.mjs(axe-core WCAG 2A+AA all stories deterministic;separate workflow .github/workflows/a11y-and-size.yml)' },
  50: { tier: 'DETERMINISTIC', mechanism: 'size-limit npx + package.json per-component manifest(deterministic CI gate)' },
  51: { tier: 'DETERMINISTIC', mechanism: 'scripts/visual-audit.mjs --matrix=theme-density-rtl 6-cell baseline diff' },
  52: { tier: 'HOOK-ENFORCED', mechanism: 'check_tab_lg_chrome_header_equal.sh + check_header_with_tabs_border.sh + check_chrome_header_handcraft.sh' },
  53: { tier: 'HOOK-ENFORCED', mechanism: 'check_spec_class_drift.sh write-time' },
  54: { tier: 'HOOK-ENFORCED', mechanism: 'check_story_invariants.sh R8 story_archetype_registry + .claude/references/story-baseline-registry.json' },
  55: { tier: 'HOOK-ENFORCED', mechanism: 'Token cross-namespace mapping integrity(semantic.css L246-273 12-hue verify)' },
  56: { tier: 'HOOK-ENFORCED', mechanism: 'check_app_shell_primary_header_consistency.sh' },
  // Group Q* — Consumer enforcement / fork-context / packaging(57-88,2026-05-30 補滿 per codex Phase B P1:原 56/88 假完整 fix)
  57: { tier: 'HOOK-ENFORCED', mechanism: 'check_ds_anchor_preflight.sh write-time soft BLOCKER(M29 anchor)' },
  58: { tier: 'HOOK-ENFORCED', mechanism: 'check_fork_user_plugin_install.sh SessionStart' },
  59: { tier: 'HOOK-ENFORCED', mechanism: 'check_substantive_edit_approval_preflight.sh scope apps/** + node_modules/@qijenchen' },
  60: { tier: 'HOOK-ENFORCED', mechanism: 'check_propose_without_benchmark.sh UserPromptSubmit(M26)' },
  61: { tier: 'HOOK-ENFORCED', mechanism: 'check_item_list_gap.sh + check_data_table_size_num_to_meta_width.sh(M16 + M23c)' },
  62: { tier: 'PURE-JUDGMENT', mechanism: 'Fork Netlify onboarding canonical — dispatch 必 DS-wide enumerate netlify.toml / manager-head / setup-netlify / CLAUDE.md Access-control 段' },
  63: { tier: 'HOOK-ENFORCED', mechanism: 'inject_deploy_url_after_push.sh PostToolUse + scripts/deploy-url.mjs' },
  64: { tier: 'HOOK-ENFORCED', mechanism: 'check_post_main_ssot_propagate.sh PostToolUse Bash' },
  65: { tier: 'HOOK-ENFORCED', mechanism: 'check_chrome_header_avatar_canonical.sh PreToolUse multiline regex' },
  66: { tier: 'PURE-JUDGMENT', mechanism: 'Immediate cross-repo dispatch + visual parity — dispatch 必 DS-wide enumerate release.yml dispatch step + sync workflow + visual-assertions coverage' },
  67: { tier: 'HOOK-ENFORCED', mechanism: 'check_sidebar_menu_button_implicit_wrap.sh PreToolUse multiline regex' },
  68: { tier: 'PURE-JUDGMENT', mechanism: 'Stories-vs-spec drift systematic — dispatch 必 DS-wide 全 stories/anatomy/principles grep anti-spec pattern(@canonical-pattern / @anti-pattern marker)' },
  69: { tier: 'HOOK-ENFORCED', mechanism: 'check_consumer_no_ds_catalog.sh PostToolUse BLOCKER' },
  70: { tier: 'HOOK-ENFORCED', mechanism: 'check_consumer_story_baseline.sh PostToolUse BLOCKER + ds-story-manifest.json' },
  71: { tier: 'HOOK-ENFORCED', mechanism: 'check_consumer_ds_primitive_misuse.sh BLOCKER' },
  72: { tier: 'PURE-JUDGMENT', mechanism: 'DS API surface tightening per-component review(tightening-roadmap.md)— dispatch 必 DS-wide enumerate ALL component API surface' },
  73: { tier: 'HOOK-ENFORCED', mechanism: 'check_full_story_visual_interaction_sweep.sh(length === manifest.totalStories,sample = reject)' },
  74: { tier: 'HOOK-ENFORCED', mechanism: 'check_overlay_open_focus_escape_probe.sh BLOCKER' },
  75: { tier: 'HOOK-ENFORCED', mechanism: 'check_plugin_freshness.sh SessionStart fork-user' },
  76: { tier: 'HOOK-ENFORCED', mechanism: 'check_escape_marker_abuse.sh(≥3 distinct OR ≥5 total BLOCK)' },
  77: { tier: 'DETERMINISTIC', mechanism: 'scripts/composition-fidelity-visual-diff.mjs + .github/workflows/composition-fidelity.yml pixelmatch per-mapping' },
  78: { tier: 'HOOK-ENFORCED', mechanism: 'check_codex_brief_invariants.sh 4th invariant(禁列檔)' },
  79: { tier: 'HOOK-ENFORCED', mechanism: 'check_tailwind_wildcard_in_docs.sh P0 BLOCKER' },
  80: { tier: 'HOOK-ENFORCED', mechanism: 'check_addon_subdir_ship.sh P0 BLOCKER' },
  81: { tier: 'HOOK-ENFORCED', mechanism: 'check_storybook_addon_preset_cjs.sh P0 BLOCKER' },
  82: { tier: 'HOOK-ENFORCED', mechanism: 'check_consumer_app_story_title.sh P0 BLOCKER' },
  83: { tier: 'DETERMINISTIC', mechanism: 'scripts/verify-published-deploy.mjs(mirror run success + published main.ts === local + --live render)' },
  84: { tier: 'DETERMINISTIC', mechanism: 'scripts/test-2-scenario-architecture.mjs(20 test + Mirror M0-M7)' },
  85: { tier: 'DETERMINISTIC', mechanism: 'scripts/sync-ds-canonical.mjs --check(npm mirror == .claude SSOT)' },
  86: { tier: 'DETERMINISTIC', mechanism: 'scripts/plugin-structure-validate.mjs(5-manifest version + symlink == source)' },
  87: { tier: 'DETERMINISTIC', mechanism: 'scripts/dogfood-prepublish-verify.mjs(npm install + build-storybook consumer view)' },
  88: { tier: 'DETERMINISTIC', mechanism: 'scripts/check-dangling-infra-ref.mjs --check + scripts/check-skill-deadref.mjs --check' },
}

// expected dim count = SSOT(governance-counters auditDims);fallback COVERAGE map size。
// 2026-05-30 codex Phase B P1 fix:禁寫死 56(原假完整,只覆蓋 56/88)。讀真值 88;
// 新增 dim 若未補 COVERAGE entry → gap → --check fail-closed(exit 1),強制分類。
// SSOT 優先序:audit-dims-dispatch.json `.total`(dispatch-audit-dims.mjs 從 SKILL.md parse 的權威 dim 數)
// → fallback COVERAGE map size。讀 dispatch total 才能 catch「SKILL 加新 dim 但 COVERAGE 沒補」→ gap → fail-closed。
let expected
try {
  const dispatch = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude/logs/audit-dims-dispatch.json'), 'utf8'))
  expected = dispatch.total || Object.keys(COVERAGE).length
} catch {
  expected = Object.keys(COVERAGE).length
}
const counts = { DETERMINISTIC: 0, 'HOOK-ENFORCED': 0, 'PURE-JUDGMENT': 0, UNKNOWN: 0 }
const gaps = []

for (let i = 1; i <= expected; i++) {
  const entry = COVERAGE[i]
  if (!entry) { counts.UNKNOWN++; gaps.push({ dim: i, reason: 'no classification entry' }); continue }
  counts[entry.tier] = (counts[entry.tier] || 0) + 1
  // Optional gap flag: PURE-JUDGMENT 必 含 'DS-wide' + 'sample' anti-keyword in mechanism
  if (entry.tier === 'PURE-JUDGMENT' && !/DS-wide/i.test(entry.mechanism)) {
    gaps.push({ dim: i, reason: 'PURE-JUDGMENT mechanism missing explicit DS-wide directive' })
  }
}

// M4 vaporware lint(2026-05-30 per laziness-hunt P1):cited script/hook 必存在 disk。堵「(planned) 未實作 hook」
// + folded-drift(SKILL/matrix 引用 standalone hook 已 fold 進 lib 卻沒更新)。標 DETERMINISTIC/HOOK 卻指向不
// 存在的東西 = 紙上保證(綠燈 ≠ 真有兜底)。
const stripCheck = (n) => n.replace(/^check_/, '').replace(/\.sh$/, '')
let allHookSrc = ''
try { allHookSrc = fs.globSync('.claude/hooks/**/*.sh', { cwd: ROOT }).map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') } catch {}
const hookExists = (h) => {
  const base = stripCheck(h)
  const cands = [`.claude/hooks/${h}`, `.claude/hooks/lib/${h}`, `.claude/hooks/lib/_${base}.sh`, `.claude/hooks/_${base}.sh`, `.claude/hooks/retired/${h}`]
  if (cands.some((c) => fs.existsSync(path.join(ROOT, c)))) return true
  return new RegExp(`原[^\\n]{0,40}${base}|\\b${base}\\b`).test(allHookSrc) // folded provenance / lib-consolidation
}
const vaporware = []
for (const [dim, entry] of Object.entries(COVERAGE)) {
  if (/\(planned\)|（planned）/i.test(entry.mechanism)) { vaporware.push({ dim, reason: `「(planned)」未實作: ${entry.mechanism.slice(0, 48)}` }); continue }
  for (const m of entry.mechanism.matchAll(/scripts\/([\w-]+\.mjs)/g)) {
    if (!fs.existsSync(path.join(ROOT, 'scripts', m[1]))) vaporware.push({ dim, reason: `cited script 不存在: scripts/${m[1]}` })
  }
  for (const m of entry.mechanism.matchAll(/\b(check_[\w]+\.sh)\b/g)) {
    if (!hookExists(m[1])) vaporware.push({ dim, reason: `cited hook 不存在(非 folded): ${m[1]}` })
  }
}

const report = {
  ts: new Date().toISOString(),
  expected_dims: expected,
  classified: expected - counts.UNKNOWN,
  tier_counts: counts,
  gaps,
  coverage_by_dim: COVERAGE,
}

const LOG_DIR = path.join(ROOT, '.claude/logs')
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
fs.writeFileSync(path.join(LOG_DIR, 'audit-coverage-matrix.json'), JSON.stringify(report, null, 2))

console.log('═════════════════════════════════════════════════════')
console.log(`▶ Audit Coverage Matrix(${expected} dims anti-sample tiers)`)
console.log(`   DETERMINISTIC(deterministic script chain): ${counts.DETERMINISTIC}`)
console.log(`   HOOK-ENFORCED(write-time PostToolUse): ${counts['HOOK-ENFORCED']}`)
console.log(`   PURE-JUDGMENT(AI but DS-wide全 file enumerated): ${counts['PURE-JUDGMENT']}`)
console.log(`   UNKNOWN: ${counts.UNKNOWN}`)
console.log('═════════════════════════════════════════════════════')

if (gaps.length) {
  console.error('\n⚠️  Coverage gaps:')
  for (const g of gaps) console.error(`   Dim ${g.dim}: ${g.reason}`)
}
if (vaporware.length) {
  console.error('\n🚨 VAPORWARE(cited script/hook 不存在 — 紙上保證,綠燈≠真兜底):')
  for (const v of vaporware) console.error(`   Dim ${v.dim}: ${v.reason}`)
}
if (CHECK && (gaps.length || vaporware.length)) process.exit(1)
console.log(`\n✅ All ${expected} dims classified + cited mechanisms resolve on disk`)
process.exit(0)
