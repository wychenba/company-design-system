import { readFileSync, writeFileSync } from 'node:fs'
const D = '.claude/logs/deep-audit-2026-06-05'

// ── load Claude workflow result ──
const wf = JSON.parse(readFileSync(`${D}/claude-phaseA-result.json`, 'utf8'))
// find the return value (workflow result is nested)
const rv = wf.result || wf.returnValue || wf.return || wf
const claudeA1b = rv.a1bConfirmed || []
const claudeDim = rv.dimConfirmed || []
const perUnit = rv.perUnit || []
const perDim = rv.perDim || []

// ── load codex consolidated ──
const codexRaw = readFileSync(`${D}/codex-findings-consolidated.txt`, 'utf8').split('\n')
const codexFindings = []
let curBrief = ''
for (const line of codexRaw) {
  const l = line.trim()
  if (l.startsWith('### ')) { curBrief = l.slice(4); continue }
  if (!l || l.startsWith('TOTAL:')) continue
  if (/\|\s*CLEAN/.test(l)) continue
  const parts = l.split('|')
  if (parts.length >= 4 && /P[012]$/.test(l)) {
    // component lines: unit|path:line|claim|reality|lens|P  OR dim lines: dim|path:line|issue|P
    const sev = l.match(/P([012])$/)[0]
    const path = parts[1]
    codexFindings.push({ brief: curBrief, unit: parts[0], path, sev, raw: l })
  }
}

// ── normalize path → basename:line for matching ──
const norm = (p) => {
  if (!p) return ''
  const m = p.match(/([a-z0-9._-]+\.(?:tsx|ts|md|css)):(\d+)/i)
  if (m) return `${m[1]}:${m[2]}`
  const m2 = p.match(/([a-z0-9._-]+\.(?:tsx|ts|md|css))/i)
  return m2 ? m2[1] : p
}
const normFile = (p) => {
  const m = (p || '').match(/([a-z0-9._-]+\.(?:tsx|ts|md|css))/i)
  return m ? m[1] : ''
}

// ── Claude severity/category tally ──
const claudeSev = { P0: 0, P1: 0, P2: 0 }
const claudeCat = {}
for (const f of claudeA1b) {
  if (claudeSev[f.severity] !== undefined) claudeSev[f.severity]++
  claudeCat[f.category] = (claudeCat[f.category] || 0) + 1
}
const codexSev = { P0: 0, P1: 0, P2: 0 }
for (const f of codexFindings) codexSev[f.sev]++

// ── overlap: codex finding whose normalized file:line matches a Claude finding ──
const claudeKeys = new Set(claudeA1b.map((f) => norm(f.fileLine)))
const claudeFileKeys = new Set(claudeA1b.map((f) => normFile(f.fileLine)))
let agreedExact = 0, agreedFile = 0, codexOnly = 0
const codexOnlyList = []
for (const cf of codexFindings) {
  const k = norm(cf.path)
  const fk = normFile(cf.path)
  if (claudeKeys.has(k)) agreedExact++
  else if (claudeFileKeys.has(fk)) agreedFile++
  else { codexOnly++; codexOnlyList.push(cf) }
}

// ── Claude-only (not in codex scope or codex missed): findings in units codex didn't audit ──
const codexFileKeys = new Set(codexFindings.map((f) => normFile(f.path)))
const claudeUnitsCodexMissed = claudeA1b.filter((f) => !codexFileKeys.has(normFile(f.fileLine)))

console.log('═══ CLAUDE Phase A ═══')
console.log(`a1b confirmed: ${claudeA1b.length} | dim confirmed: ${claudeDim.length}`)
console.log(`severity: P0=${claudeSev.P0} P1=${claudeSev.P1} P2=${claudeSev.P2}`)
console.log(`category:`, JSON.stringify(claudeCat))
console.log('units NOT clean:', perUnit.filter((u) => u.confirmed > 0).map((u) => `${u.unit}(${u.confirmed})`).join(', '))
console.log('units clean:', perUnit.filter((u) => u.confirmed === 0).map((u) => u.unit).join(', '))
console.log()
console.log('═══ CODEX Phase B ═══')
console.log(`findings: ${codexFindings.length} | severity: P0=${codexSev.P0} P1=${codexSev.P1} P2=${codexSev.P2}`)
console.log()
console.log('═══ OVERLAP ═══')
console.log(`codex∩claude exact file:line: ${agreedExact}`)
console.log(`codex∩claude same-file: ${agreedFile}`)
console.log(`codex-only (claude didn't flag this line): ${codexOnly}`)
console.log()
console.log('═══ P0 findings (Claude) ═══')
for (const f of claudeA1b.filter((x) => x.severity === 'P0')) console.log(`  [${f.unit}] ${f.fileLine} — ${(f.claim || '').slice(0, 90)}`)

// write merged master list
const master = {
  generated: '2026-06-05',
  claude: { count: claudeA1b.length, dim: claudeDim.length, sev: claudeSev, cat: claudeCat },
  codex: { count: codexFindings.length, sev: codexSev },
  overlap: { agreedExact, agreedFile, codexOnly },
  claudeA1b,
  claudeDim,
  codexFindings,
  codexOnlyList,
}
writeFileSync(`${D}/master-findings.json`, JSON.stringify(master, null, 1))
console.log(`\n→ master-findings.json written (${claudeA1b.length} claude + ${codexFindings.length} codex)`)
