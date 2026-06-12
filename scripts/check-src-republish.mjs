#!/usr/bin/env node
// check-src-republish.mjs — 機械閘:DS src 改了但版本沒 bump → BLOCK(防 ship stale)
//
// 2026-06-08 補(user 質問「ds push main → template 自動同步」鏈最弱的非機械環節):
//   release.yml 只在 push tag `v*` 觸發 npm publish;plain main push 只 dispatch event 不 republish。
//   所以「DS src(含 stories/components)改了 push main、但 AI 忘記 bump+tag」→ npm 版本 stale →
//   consumer `npm install @beta` 解析到同版本 = no-op → 拿不到新 code。**完全沒有機械閘擋這個**。
//
// 本 gate(CI main-push + release-preflight + release.yml 三處跑):
//   baseline = npm latest published 版本(npm view,primary)/ git tag 排序(fallback);
//   diff `packages/design-system/src/**` between v<baseline> 與 HEAD,**只看 ship-relevant 檔**
//   (排除 *.stories.tsx[不在 files 欄不 ship] / *.spec.md[純文件] / *.test.ts);
//   若 ship-relevant diff 非空 **且** currentVersion === npm latest(沒 bump)→ exit 1(BLOCK)。
//   doc/story-only 改 → 不擋。已 bump → 不擋(會走發版鏈)。
//   網路失敗 / 無 baseline tag → 降級 warn-only exit 0(不讓 registry 抖動擋住正常 push)。
//
// 對齊世界級:changesets `status --since` / Lerna-Nx affected-since-tag 都用「diff vs published baseline」。

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const CHECK = process.argv.includes('--check')
const PKG = 'packages/design-system'
const SRC_GLOB = `${PKG}/src`

const sh = (cmd, opts = {}) => execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts }).trim()
const warn = (msg) => { console.warn(`⚠️  ${msg}`); process.exit(0) }  // 降級:不擋

const currentVersion = JSON.parse(readFileSync(`${PKG}/package.json`, 'utf8')).version

// ── baseline = npm latest(primary)/ git tag 排序(fallback)──
let npmLatest = null
try {
  npmLatest = sh('npm view @qijenchen/design-system version', { timeout: 20000 })
} catch {
  // 網路 / registry 失敗 → fallback git tag
}
let baselineVersion = npmLatest
if (!baselineVersion) {
  try {
    const tags = sh('git tag --list "v*" --sort=-v:refname').split('\n').filter(Boolean)
    // 取第一個 ≠ v<current> 的 tag(current 若已 tag 則取次新;current 未 tag 則取最新已發)
    const baseTag = tags.find((t) => t !== `v${currentVersion}`) || tags[0]
    baselineVersion = baseTag ? baseTag.replace(/^v/, '') : null
  } catch {
    warn('無法取 npm latest 也無 git tag baseline → skip republish gate(降級,不擋)')
  }
}
if (!baselineVersion) warn('無 baseline 版本(首次發版?)→ skip republish gate')

const baselineTag = `v${baselineVersion}`

// 確保 baseline tag 本地存在(CI shallow clone 可能缺)→ 試 fetch,失敗則降級
try {
  sh(`git rev-parse --verify --quiet ${baselineTag}^{commit}`)
} catch {
  try { sh(`git fetch --quiet --depth=1 origin tag ${baselineTag}`) } catch { /* ignore */ }
  try { sh(`git rev-parse --verify --quiet ${baselineTag}^{commit}`) }
  catch { warn(`baseline tag ${baselineTag} 本地不存在(shallow clone?)→ skip republish gate(降級)`) }
}

// ── ship-relevant diff:src 下、排除不 ship / 不影響 runtime 的檔 ──
let changed = []
try {
  changed = sh(`git diff --name-only ${baselineTag} HEAD -- ${SRC_GLOB}`).split('\n').filter(Boolean)
} catch (e) {
  warn(`git diff 失敗(${e.message.split('\n')[0]})→ skip republish gate`)
}
// 白名單反推:files 欄 ship src/**/*.{tsx,ts,css}(+ spec.md 純文件),stories 不在 files 欄。
const isShipRelevant = (f) =>
  /\.(tsx|ts|css)$/.test(f) &&
  !/\.stories\.(tsx|ts)$/.test(f) &&
  !/\.spec\.md$/.test(f) &&
  !/\.spec\.ts$/.test(f) &&
  !/\.test\.ts$/.test(f)
const shipDiff = changed.filter(isShipRelevant)

// ── 判定 ──
if (shipDiff.length === 0) {
  console.log(`✓ republish gate:DS src 無 ship-relevant 改動 vs ${baselineTag}(doc/story-only 或無改)→ 不需 republish`)
  process.exit(0)
}
const bumped = currentVersion !== baselineVersion
if (!bumped) {
  console.error(`\n❌ republish gate BLOCK:DS src 已改但版本沒 bump(still ${currentVersion},npm latest 已是此版)`)
  console.error(`   → 此 push 不會 republish npm → consumer \`npm install @beta\` 拿到 stale code。`)
  console.error(`   ship-relevant 改動(${shipDiff.length}):`)
  shipDiff.slice(0, 20).forEach((f) => console.error(`     - ${f}`))
  console.error(`\n   修:bump packages/design-system/package.json 版本 → 跑 \`npm run release:preflight\` → tag + push tag。`)
  process.exit(1)
}
console.log(`✓ republish gate:DS src 改了且版本已 bump(${baselineVersion} → ${currentVersion})→ 會走發版鏈,OK`)
process.exit(0)
