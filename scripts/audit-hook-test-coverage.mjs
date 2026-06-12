#!/usr/bin/env node
// task#5 prevention — BLOCKER hook 必有 test 覆蓋（2026-05-30）。
//
// 為何存在：laziness-hunt 抓到 ~22 個 hook 無對應 test_<name>.sh。含 BLOCKER 邏輯（exit 2 / deny /
// permissionDecision）的 hook 若 regex 太窄（M34/M7 broad-vs-narrow gap）或太寬（false-positive），
// 無 test 就沒人攔得到 → 靜默 regression。正是 user「全盤給我抓出來改正避免」要堵的偷懶逃生門。
//
// 規則：任何含 BLOCKER 邏輯的 hook（grep `exit 2` / `"deny"` / `permissionDecision.*deny` /
//   `"block"`）必有 `.claude/hooks/tests/test_<name>.sh`。
//
// **Scope note（2026-05-30 honest）**：本 gate 只驗「test 檔存在」= 可靠機械 fact。原想加「test 含
//   positive+negative fixture（M34 broad-vs-narrow 對稱）」但 hook test style 多樣（run_hook / 參數化
//   expect_block / expect_pass_silent 各家），regex 偵測 pos+neg 會 false-positive → 反成 fake-green
//   check。test 品質（pos+neg 對稱）改靠 CI「Hook test suite」實跑 + reviewer 人工審,不機械化攔。
//
// 豁免（明寫,非靠記憶）：純 helper / injector / dispatcher（無 BLOCKER）列 EXEMPT。
//
// Usage:
//   node scripts/audit-hook-test-coverage.mjs           # 印 debt 報告
//   node scripts/audit-hook-test-coverage.mjs --check    # CI gate（BLOCKER hook 缺 test exit 1）

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

const ROOT = process.cwd()
const HOOKS_DIR = join(ROOT, '.claude/hooks')
const TESTS_DIR = join(HOOKS_DIR, 'tests')
const CHECK = process.argv.includes('--check')

// 純 helper / injector / dispatcher（無 BLOCKER 決策）— 明寫豁免清單
const EXEMPT = new Set([
  '_log-fire', '_log_fire',
  'chrome_header_dispatcher',      // dispatcher,委派給子 hook
  'inject_deploy_url_after_push',  // PostToolUse inject context,無 block
  'check_post_main_ssot_propagate',// inject 提議 bump,無 block
  'check_plugin_freshness',        // SessionStart 提醒,無 block
])

function hasBlockerLogic(content) {
  return /\bexit 2\b/.test(content) ||
    /"deny"|'deny'/.test(content) ||
    /permissionDecision/.test(content) ||
    /"block"|'block'/.test(content) ||
    /BLOCKER/.test(content)
}

const debt = []      // BLOCKER hook 無 test
let blockerHooks = 0
let covered = 0

for (const f of readdirSync(HOOKS_DIR)) {
  if (!f.endsWith('.sh')) continue
  const name = basename(f, '.sh')
  if (EXEMPT.has(name)) continue
  const content = readFileSync(join(HOOKS_DIR, f), 'utf8')
  if (!hasBlockerLogic(content)) continue
  blockerHooks++
  const testPath = join(TESTS_DIR, `test_${name}.sh`)
  if (!existsSync(testPath)) debt.push(name)
  else covered++
}

console.log(`[hook-test-coverage] ${blockerHooks} BLOCKER hooks,${covered} 有 test,${debt.length} 缺 test`)

if (!debt.length) {
  console.log('✅ 所有 BLOCKER hook 都有 test 檔')
  process.exit(0)
}

console.log(`\n❌ ${debt.length} 個含 BLOCKER 邏輯的 hook 無 test_<name>.sh：`)
for (const n of debt) console.log(`  - ${n}`)
console.log(`\n修法:每個 BLOCKER hook 補 .claude/hooks/tests/test_<name>.sh（positive should-fire + negative should-NOT-fire）;純 helper 加進本 script EXEMPT。`)
if (CHECK) process.exit(1)
process.exit(0)
