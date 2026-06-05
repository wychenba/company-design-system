#!/usr/bin/env node
// release-preflight.mjs — 單一指令跑 release.yml publish 會 check 的全部 gate,fail-fast。
//
// ROOT CAUSE FIX(2026-06-02):beta.43/45 連續多次 push 失敗,根因全相同 ——
//   「發版前靠手動記得逐道跑 sync / check → 一定會漏」(beta.43 漏 version-sync + ds-canonical;
//    beta.45 又漏 ds-canonical re-sync)。release CI gate 是對的,是本地 preflight 不完整。
//
// 本指令 = ① 先跑 SYNCS(version 5-manifest + ds-canonical → 修 drift,CI 抓不到)
//          ② 跑全部 deterministic gate(1:1 對齊 release.yml「Audit gates」)
//          ③ build + FULL story smoke + dogfood(packaging + runtime gate)
//          ④ 5-manifest version 一致性 verify
//          ⑤ 全過才寫 pass-marker(.claude/logs/release-preflight-pass.json,綁 HEAD sha,
//             per-machine untracked 產物 —— 不入 git / 不入 CI,僅供本機 PreToolUse 比對)
//
// tag-push 機械強制:check_solo_workflow.sh 的 R4 驗 marker.head == 當前 HEAD,否則 BLOCK
//   → 把「靠人記得跑 preflight」變「機械保證」。(無獨立 check_tag_preflight.sh — 用 R4 復用既有 hook)
//
// 用法:npm run release:preflight  (bump 版本後、push tag 前跑;全過再 tag)

import { execSync } from 'node:child_process'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'

let stepNum = 0
function run(label, cmd) {
  stepNum++
  process.stdout.write(`\n▶ [${stepNum}] ${label}\n    $ ${cmd}\n`)
  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() })
  } catch {
    console.error(`\n❌ RELEASE PREFLIGHT FAIL at step ${stepNum}: ${label}`)
    console.error('   修掉上面的錯,re-run `npm run release:preflight`。tag 前必全過。')
    process.exit(1)
  }
}

console.log('═══ Release Preflight — 1:1 release.yml gates,fail-fast ═══')

// ① SYNCS first(修 drift,讓 CI 抓不到)
run('sync version → 5 manifests', 'node scripts/sync-version-to-all-manifests.mjs')
run('sync ds-canonical mirror', 'node scripts/sync-ds-canonical.mjs')

// ② Deterministic audit gates(== release.yml「Audit gates」step + story type-check)
run('tsc -b', 'npx tsc -b')
run('typecheck:stories', 'npm run --silent typecheck:stories')
run('audit-orphan-tokens', 'node scripts/audit-orphan-tokens.mjs --check')
run('categorical-color-invariants', 'node scripts/categorical-color-invariants.mjs')
run('status-color-invariant(progress/step/in-progress → --info)', 'node scripts/status-color-invariant.mjs')
run('layout-space-utility-invariant(裸 px-loose silent-fail)', 'node scripts/layout-space-utility-invariant.mjs')
run('category-classification-invariant(分類三訊號一致)', 'node scripts/category-classification-invariant.mjs')
run('code-quality-audit', 'node scripts/code-quality-audit.mjs --scope=packages/design-system/src/components --check')
run('content-quality', 'node scripts/audit-content-quality.mjs --check')
run('governance-counters', 'node scripts/sync-governance-counters.mjs --check')
run('gen-figma-make-artifacts', 'node scripts/gen-figma-make-artifacts.mjs --check')
run('root barrel internal-exclusion(dim-72)', 'node scripts/gen-design-system-barrel.mjs --check')
run('plugin-structure-validate', 'node scripts/plugin-structure-validate.mjs')
run('story-quality', 'npm run --silent story-quality:check')
run('ds-canonical drift check', 'node scripts/sync-ds-canonical.mjs --check')

// ③ Build + smoke + dogfood(== release.yml publish job + smoke-shard job)
run('build:lib', 'npm run --silent build:lib')
run('build-storybook', 'npm run --silent build-storybook')
// FULL story runtime smoke == release.yml smoke-shard job(被 `needs:` 硬 gate)。這是唯一能攔
// SizeMatrix 那類 {var}-undefined / runtime crash 的 gate;build-storybook 是 compile-time、dogfood
// 只 render 2 個 component,都攔不到。漏此道 = preflight marker 綠但 CI smoke 仍會紅(2026-06-02 audit
// iceberg)。本機不分 shard 串跑全 947(CI 才分 4)。先清 port 殘留 server 避免 bind 衝突 false-fail。
run('clear smoke port 8920', 'lsof -ti:8920 | xargs kill -9 2>/dev/null || true')
run('FULL storybook runtime smoke(947 story)', 'node scripts/storybook-smoke-test.mjs --full')
run('dogfood pre-publish verify', 'node scripts/dogfood-prepublish-verify.mjs')

// ④ 5-manifest version 一致性 verify(== release.yml BLOCKER L199)
process.stdout.write(`\n▶ [${++stepNum}] 5-manifest version 一致性\n`)
const versions = {
  'design-system': JSON.parse(readFileSync('packages/design-system/package.json', 'utf8')).version,
  'storybook-config': JSON.parse(readFileSync('packages/storybook-config/package.json', 'utf8')).version,
  'plugin.json': JSON.parse(readFileSync('.claude-plugin/plugin.json', 'utf8')).version,
}
const mk = JSON.parse(readFileSync('.claude-plugin/marketplace.json', 'utf8'))
versions['marketplace.metadata'] = mk.metadata.version
versions['marketplace.plugins[ds]'] = (mk.plugins.find((p) => p.name === 'design-system') || {}).version
const uniq = [...new Set(Object.values(versions))]
if (uniq.length !== 1) {
  console.error('❌ 5-manifest version 不一致:', JSON.stringify(versions, null, 2))
  console.error('   修:node scripts/sync-version-to-all-manifests.mjs')
  process.exit(1)
}
console.log(`    ✓ 5 manifests 全一致 = ${uniq[0]}`)

// ⑤ pass-marker(綁 HEAD sha)
const head = execSync('git rev-parse HEAD').toString().trim()
mkdirSync('.claude/logs', { recursive: true })
writeFileSync(
  '.claude/logs/release-preflight-pass.json',
  JSON.stringify({ head, version: uniq[0], ts: new Date().toISOString() }, null, 2) + '\n',
)
console.log(`\n✅ RELEASE PREFLIGHT PASS @ ${head.slice(0, 8)}  version=${uniq[0]}`)
console.log('   pass-marker 已寫(綁此 HEAD)→ 現在可安全 tag + push tag。')
console.log('   ⚠️ tag 前若再有 commit,須重跑 preflight(marker 綁 HEAD,變了就 BLOCK)。')
