#!/usr/bin/env node
// sync-version-to-all-manifests.mjs — Phase 5 sync DS package version to plugin + marketplace
//
// changesets/cli `changeset version` 只 bump packages/* package.json。但本 repo 還有 3 處 version
// 需同步:
//   - .claude-plugin/plugin.json
//   - .claude-plugin/marketplace.json metadata.version + plugins[design-system].version
//
// 此 script 跑在 `npm run changeset:version` 之後,讀 packages/design-system/package.json 新 version
// → 同步寫進 plugin 3 處。release.yml version-sync BLOCKER 步驟才不會擋 publish。

import { readFileSync, writeFileSync } from 'node:fs'

const dsPkg = JSON.parse(readFileSync('packages/design-system/package.json', 'utf8'))
const newVersion = dsPkg.version
console.log(`📦 DS version: ${newVersion}`)

// plugin.json
const pluginPath = '.claude-plugin/plugin.json'
const plugin = JSON.parse(readFileSync(pluginPath, 'utf8'))
if (plugin.version !== newVersion) {
  plugin.version = newVersion
  writeFileSync(pluginPath, JSON.stringify(plugin, null, 2) + '\n')
  console.log(`✓ ${pluginPath} → ${newVersion}`)
} else {
  console.log(`✓ ${pluginPath} already ${newVersion}`)
}

// marketplace.json — 2 places: metadata.version + plugins[design-system].version
const mpPath = '.claude-plugin/marketplace.json'
const mp = JSON.parse(readFileSync(mpPath, 'utf8'))
let mpChanged = false
if (mp.metadata?.version !== newVersion) {
  mp.metadata.version = newVersion
  mpChanged = true
}
const dsPlugin = mp.plugins?.find((p) => p.name === 'design-system')
if (dsPlugin && dsPlugin.version !== newVersion) {
  dsPlugin.version = newVersion
  mpChanged = true
}
if (mpChanged) {
  writeFileSync(mpPath, JSON.stringify(mp, null, 2) + '\n')
  console.log(`✓ ${mpPath} → ${newVersion}(metadata + plugins[design-system])`)
} else {
  console.log(`✓ ${mpPath} already ${newVersion}`)
}

// storybook-config(2026-05-26 fix:plugin-structure-validate 5-manifest check 含 storybook-config,
// 漏 sync 會 BLOCKER release。version 跟 DS 同步,monorepo 共版本 canonical)
const sbConfigPath = 'packages/storybook-config/package.json'
const sbConfig = JSON.parse(readFileSync(sbConfigPath, 'utf8'))
if (sbConfig.version !== newVersion) {
  sbConfig.version = newVersion
  writeFileSync(sbConfigPath, JSON.stringify(sbConfig, null, 2) + '\n')
  console.log(`✓ ${sbConfigPath} → ${newVersion}`)
} else {
  console.log(`✓ ${sbConfigPath} already ${newVersion}`)
}

// template/ds-product-template consumer dep sync(2026-06-08 fix — 根治「為何落後 28 版」)
// 原 in-monorepo template 的 DS dep 釘死 ^beta.32:不在 5-manifest sync 範圍、無 preflight gate、無 hook 守
//   → 三道網全漏 → 無人 bump → DS 到 beta.60 它還停 beta.32。下游靠 mirror 重寫 + semver 容錯掩蓋,
//   但 source 字串本身違反 SSOT(且 DS 一旦 bump 0.2.0,caret 容錯失效 → 本地 dogfood 裝到 stale)。
// 此處跟著 DS version 改寫 root template 的 DS + storybook-config consumer dep,讓
//   「ds push main → template 版本自動 SSOT」機械成立(release-preflight.mjs 第一步即跑本 script)。
// 注:apps/template/package.json 的 DS dep 是 `*`(workspace wildcard,由 mirror transform 處理),不在此動。
const tmplPkgPath = 'template/ds-product-template/package.json'
const tmplPkg = JSON.parse(readFileSync(tmplPkgPath, 'utf8'))
const tmplRange = `^${newVersion}`
let tmplChanged = false
for (const dep of ['@qijenchen/design-system', '@qijenchen/storybook-config']) {
  if (tmplPkg.dependencies?.[dep] && tmplPkg.dependencies[dep] !== tmplRange) {
    tmplPkg.dependencies[dep] = tmplRange
    tmplChanged = true
  }
}
if (tmplChanged) {
  writeFileSync(tmplPkgPath, JSON.stringify(tmplPkg, null, 2) + '\n')
  console.log(`✓ ${tmplPkgPath} → ${tmplRange}(DS + storybook-config consumer dep)`)
} else {
  console.log(`✓ ${tmplPkgPath} already ${tmplRange}`)
}

console.log('')
console.log('Done. Commit + tag + push to trigger release.yml.')
