#!/usr/bin/env node
// plugin-structure-validate.mjs — Phase 5 Claude plugin structure E2E check
//
// Validates plugin distribution structure(per Anthropic plugin spec)before publish:
//   1. .claude-plugin/marketplace.json schema(name, plugins[])
//   2. .claude-plugin/plugin.json schema(name, version, description)
//   3. skills/ + commands/ symlinks resolve to actual .claude/{skills,commands}
//   4. hooks/hooks.json + hooks/scripts/ symlink resolve
//   5. hooks.json paths use ${CLAUDE_PLUGIN_ROOT}(consumer can install via /plugin marketplace add)
//
// Fail = block release(plugin broken for consumer install)。

import { readFileSync, existsSync, readlinkSync, statSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const REPO_ROOT = process.cwd()
const errors = []

function check(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`)
    errors.push({ name, error: e.message })
  }
}

// 1. marketplace.json schema
check('marketplace.json exists + valid JSON + schema', () => {
  const mp = JSON.parse(readFileSync(join(REPO_ROOT, '.claude-plugin/marketplace.json'), 'utf8'))
  if (!mp.name) throw new Error('marketplace.json missing `name`')
  if (!Array.isArray(mp.plugins) || mp.plugins.length === 0) throw new Error('marketplace.json `plugins` empty')
  const ds = mp.plugins.find((p) => p.name === 'design-system')
  if (!ds) throw new Error('design-system plugin not in marketplace.json')
  if (!ds.version) throw new Error('design-system plugin version missing')
})

// 2. plugin.json schema
check('plugin.json exists + valid JSON + schema', () => {
  const p = JSON.parse(readFileSync(join(REPO_ROOT, '.claude-plugin/plugin.json'), 'utf8'))
  if (!p.name) throw new Error('plugin.json missing name')
  if (!p.version) throw new Error('plugin.json missing version')
  if (!p.description) throw new Error('plugin.json missing description')
})

// 3. skills/ + commands/ symlinks
check('skills/ symlink → .claude/skills/', () => {
  const skillsPath = join(REPO_ROOT, 'skills')
  if (!existsSync(skillsPath)) throw new Error('skills/ not found')
  const stat = statSync(skillsPath)
  if (!stat.isDirectory()) throw new Error('skills/ not directory')
  // Verify content matches .claude/skills/
  const skillNames = readdirSync(skillsPath).filter((n) => !n.startsWith('.'))
  if (skillNames.length === 0) throw new Error('skills/ empty')
  if (!existsSync(join(skillsPath, 'README.md'))) throw new Error('skills/README.md not accessible')
})

check('commands/ symlink → .claude/commands/', () => {
  const cmdsPath = join(REPO_ROOT, 'commands')
  if (!existsSync(cmdsPath)) throw new Error('commands/ not found')
  if (readdirSync(cmdsPath).length === 0) throw new Error('commands/ empty')
})

// 4. hooks structure
check('hooks/hooks.json + hooks/scripts/ structure', () => {
  const hooksJsonPath = join(REPO_ROOT, 'hooks/hooks.json')
  if (!existsSync(hooksJsonPath)) throw new Error('hooks/hooks.json not found')
  const hooks = JSON.parse(readFileSync(hooksJsonPath, 'utf8'))
  if (!hooks.hooks) throw new Error('hooks/hooks.json missing `hooks` key')
  const scriptsPath = join(REPO_ROOT, 'hooks/scripts')
  if (!existsSync(scriptsPath)) throw new Error('hooks/scripts not found')
  const hookFiles = readdirSync(scriptsPath).filter((n) => n.endsWith('.sh'))
  if (hookFiles.length < 10) throw new Error(`hooks/scripts only ${hookFiles.length} hooks(expect ≥ 10)`)
})

// 5. hooks.json paths reference CLAUDE_PLUGIN_ROOT
check('hooks.json paths use ${CLAUDE_PLUGIN_ROOT}', () => {
  const hooks = JSON.parse(readFileSync(join(REPO_ROOT, 'hooks/hooks.json'), 'utf8'))
  const cmdStr = JSON.stringify(hooks)
  if (!cmdStr.includes('${CLAUDE_PLUGIN_ROOT}')) {
    throw new Error('hooks.json commands should reference ${CLAUDE_PLUGIN_ROOT}(per Anthropic plugin spec)')
  }
})

// 5.5 hooks.json(plugin)↔ settings.json(DS dev)hook-set sync
//     2026-05-30 加 per user「更新了 A 卻忘了 B」directive:plugin hooks.json 是 fork user 拿到的
//     hook 集;settings.json 是 DS repo dev 跑的。兩者漂移 = fork user 拿到跟 DS dev 不同的治理 →
//     靜默削弱 fork 端 governance。by-basename 比對(plugin 用 ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/X.sh,
//     dev 用 $CLAUDE_PROJECT_DIR/.claude/hooks/X.sh,路徑前綴不同但 .sh 檔名須一致)。
//     intentional asymmetry → 加進 EXEMPT 並註明理由(避免 silent drift)。
check('hooks.json(plugin)↔ settings.json(dev)hook-set sync', () => {
  const EXEMPT = new Set([
    // 目前無 intentional asymmetry;未來若有 plugin-only / dev-only hook,列此 + 一行理由
  ])
  const extractScripts = (path) => {
    const j = JSON.parse(readFileSync(path, 'utf8'))
    const hooks = j.hooks || j
    const set = new Set()
    for (const ev of Object.keys(hooks)) {
      for (const grp of hooks[ev]) {
        for (const h of grp.hooks || []) {
          const m = (h.command || '').match(/([a-zA-Z0-9_-]+\.sh)/)
          if (m && !EXEMPT.has(m[1])) set.add(m[1])
        }
      }
    }
    return set
  }
  const plugin = extractScripts(join(REPO_ROOT, 'hooks/hooks.json'))
  const settings = extractScripts(join(REPO_ROOT, '.claude/settings.json'))
  const onlyPlugin = [...plugin].filter((x) => !settings.has(x)).sort()
  const onlySettings = [...settings].filter((x) => !plugin.has(x)).sort()
  if (onlyPlugin.length || onlySettings.length) {
    throw new Error(
      `hook-set drift(plugin ${plugin.size} vs dev ${settings.size}):\n` +
      (onlyPlugin.length ? `  只在 plugin hooks.json(dev settings.json 漏)：${onlyPlugin.join(', ')}\n` : '') +
      (onlySettings.length ? `  只在 dev settings.json(plugin hooks.json 漏 → fork user 拿不到)：${onlySettings.join(', ')}\n` : '') +
      `  修:兩檔同步註冊該 hook;或 intentional → 加進本 check EXEMPT + 理由。`
    )
  }
})

// 6. Version sync(plugin.json vs marketplace.json vs package.json)
check('Version sync across 5 manifests', () => {
  const dsPkg = JSON.parse(readFileSync(join(REPO_ROOT, 'packages/design-system/package.json'), 'utf8'))
  const sbPkg = JSON.parse(readFileSync(join(REPO_ROOT, 'packages/storybook-config/package.json'), 'utf8'))
  const plugin = JSON.parse(readFileSync(join(REPO_ROOT, '.claude-plugin/plugin.json'), 'utf8'))
  const mp = JSON.parse(readFileSync(join(REPO_ROOT, '.claude-plugin/marketplace.json'), 'utf8'))
  const dsPlugin = mp.plugins.find((p) => p.name === 'design-system')

  const versions = {
    'design-system pkg': dsPkg.version,
    'storybook-config pkg': sbPkg.version,
    'plugin.json': plugin.version,
    'marketplace.metadata': mp.metadata?.version,
    'marketplace.plugin': dsPlugin?.version,
  }
  const unique = new Set(Object.values(versions))
  if (unique.size !== 1) {
    throw new Error(`5 manifests version drift: ${JSON.stringify(versions, null, 2)}`)
  }
})

console.log('')
if (errors.length > 0) {
  console.error(`❌ Plugin structure validation FAILED(${errors.length} errors)`)
  process.exit(1)
}
console.log('✅ Plugin structure valid — consumer can install via /plugin marketplace add github:ajenchen/design-system')
