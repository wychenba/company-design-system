#!/usr/bin/env node
/**
 * inject-basic-auth.mjs — FREE Storybook 密碼保護(所有 Netlify 方案含 free-tier 都支援)。
 *
 * 為什麼需要這支:Netlify Dashboard 的「Password protection / Basic protection」是 **Pro 方案專屬**
 * (官方 docs 證實,$20/mo),free-tier 沒這個開關。真正免費的 access control = HTTP Basic Auth
 * 寫進發佈目錄的 `_headers` 檔(Netlify edge 層擋,瀏覽器原生帳密彈窗)。
 *
 * 為什麼用 build-time 注入而非直接 commit `_headers`:
 *   本 repo 是 public(fork 自 template),`_headers` 裡的帳密是**明文** → commit 進 repo 會外洩。
 *   所以改成 build 時從 Netlify **環境變數**讀帳密、寫進 `storybook-static/_headers`(build 產物,不進版控)。
 *   帳密只存在 Netlify 後台 + edge,不碰 git。
 *
 * 怎麼啟用(fork user,30 秒):
 *   Netlify → Site configuration → Environment variables → Add a variable
 *     Key:  STORYBOOK_BASIC_AUTH
 *     Value: your_user:your_password         (多組帳密用空格分隔:"alice:pw1 bob:pw2")
 *   下次 deploy(push main 或 Trigger deploy)→ 站台自動上密碼。
 *   不設 → no-op,站台維持公開。
 *
 * 進階(要更好體驗才升級):
 *   - Pro Password Protection($20/mo):美化密碼頁、可只擋 deploy preview 放行 production、團隊登入。
 *   - Cloudflare Access(免費 50 user 真 SSO):需自架 Cloudflare proxy 在 Netlify 前面。
 *
 * Build command(netlify.toml)已串:`npm run build-storybook && node scripts/inject-basic-auth.mjs`
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const creds = (process.env.STORYBOOK_BASIC_AUTH || '').trim()
const DIR = 'storybook-static'
const FILE = join(DIR, '_headers')

if (!creds) {
  console.log('[inject-basic-auth] STORYBOOK_BASIC_AUTH 未設 → 站台公開(no-op)。要加密碼:Netlify env var 設 STORYBOOK_BASIC_AUTH="user:pass"')
  process.exit(0)
}
// 格式驗:一或多組 user:pass,空格分隔。禁含換行/冒號歧義。
if (!/^[^:\s]+:[^:\s]+( +[^:\s]+:[^:\s]+)*$/.test(creds)) {
  console.error(`[inject-basic-auth] ✗ STORYBOOK_BASIC_AUTH 格式錯,需 "user:pass"(多組空格分隔 "u1:p1 u2:p2")`)
  process.exit(1)
}
if (!existsSync(DIR)) {
  console.error(`[inject-basic-auth] ✗ ${DIR}/ 不存在 — 請先 build-storybook(本 script 在 build 後跑)`)
  process.exit(1)
}

const authLine = `/*\n  Basic-Auth: ${creds}\n`
let out = authLine
if (existsSync(FILE)) {
  const cur = readFileSync(FILE, 'utf8')
  // 已有 Basic-Auth 就不重複寫;否則 append(保留既有 _headers 規則)
  out = cur.includes('Basic-Auth:') ? cur : cur.replace(/\s*$/, '\n') + authLine
}
writeFileSync(FILE, out)
const n = creds.split(/ +/).length
console.log(`[inject-basic-auth] ✅ ${FILE} 已寫入 Basic-Auth(${n} 組帳密)— 站台已上密碼保護(免費 _headers 方案)`)
