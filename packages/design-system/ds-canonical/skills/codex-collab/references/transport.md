# Codex transport — Cloud vs Local

> SKILL Step 0.5 / 4.5 / 4.6 / 5 dual-track invariants are **transport-agnostic**。本 reference 只說 transport 怎麼選 + 怎麼跑。

## 兩條 transport（不合而為一,環境決定）

| 屬性 | Cloud(`@codex` GitHub mention)| Local(`codex` CLI) |
|---|---|---|
| 執行環境 | 雲端 Claude Code(remote sandbox)| 地端 Claude Code(本機 macOS)|
| 通道 | `mcp__github__add_issue_comment` → `@codex` mention → GitHub webhook → codex sandbox → reply comment | `npx codex exec "<brief>"` 同步 stdout |
| Latency | 15-30 min wait per reply | 1-3 min per reply |
| Dedup risk | YES(短時間連送 → backend dedup,故 3 min interval + 1 in-flight serial)| NO(每次 fresh process)|
| Persistence | PR comment thread 永久保留 | stdout 需手動存 → 寫入 `.claude/memory/codex-brief-queue.jsonl` 加 `transport:"local"` 欄位 |
| Cost | 不收 token(GitHub 那端)| 收 OpenAI API token(本機帳號)|
| Auth | GitHub login(harness 已 set)| `codex login`(user 跑一次,本機 `~/.codex/auth.json`)|
| 適合場景 | (1) PR-attached deep audit(留 trail)(2) cross-session async wait OK(3) 雲端 sandbox 唯一可用 channel | (1) 同 session 快速 round-trip(2) 私下技術討論(不污染 PR 歷史)(3) Step 4.5/4.6 在同 terminal 連跑 |
| 不適合 | 即時討論 / 同 session 多 round | 需要 PR-thread audit trail / 雲端 environment 沒地端 channel |

## Cloud transport（既有 SKILL Step 1-7 完整流程不變）

按 SKILL.md Step 1-7 走。Queue SSOT `.claude/memory/codex-brief-queue.jsonl` schema 加 `transport:"cloud"`(default)。

## Local transport（新增）

### Prerequisites（一次性）
1. `npm install`(已含 `@openai/codex@^0.128.0`)
2. `npx codex login`(interactive,user 親跑;harness sandbox 跑不了 stdin)
3. 確認 `~/.codex/auth.json` 存在

### 流程（沿用 cloud Step 0-7,只換 transport）

**Step 0**：user trigger 同 cloud。
**Step 0.5**：own-version 完整跑(同 cloud 不變)。
**Step 1**：寫 deep brief(同 cloud format 不變)。Brief content 寫 `.claude/tmp/codex-brief-<topic>.md`(暫存,不入 git)。
**Step 2 transport-swap**：
```bash
# 不是 mcp__github__add_issue_comment;改:
node_modules/.bin/codex exec --output-last-message /tmp/codex-reply-<topic>.md \
  "$(cat .claude/tmp/codex-brief-<topic>.md)"
```
- `--output-last-message` 把 codex final reply 存檔(避免 stdout 亂入)
- 同步 block 到 codex 回完
- Reply file 進 Step 3(取代 webhook subscribe)

**Step 3**：Read `/tmp/codex-reply-<topic>.md`,append 進 `.claude/memory/codex-brief-queue.jsonl` `{transport:"local",replyFile:"/tmp/...",repliedAt:...}`。
**Step 4 / 4.5 / 4.6 / 5**：完全同 cloud(self-check / verify / regression / 比稿 — invariant 不分 transport)。
**Step 6 / 7**：implement → optionally PR comment 通知 cloud codex「結論」(若 cloud 也參與過)。

### 警示
- ❌ Local 別跳 Step 0.5(我先 own-version)/ 4.5(verify codex claim)/ 4.6(regression scan)/ 5(比稿)— SKILL invariant 不分 transport,違 = 退化 pass-through
- ❌ Local 不留 audit trail → user 後追溯靠 `.claude/memory/codex-brief-queue.jsonl` + `replyFile`,不可省
- ❌ 不為了 local 速度 truncate brief 或 reply(深度 invariant 同 cloud,不打折)
- ✅ Local 跑完 → reply 摘要存 PR comment(若有對應 PR),保 cross-session discoverability

### 雙 transport 同題場景
- 主 channel 失敗(eg. cloud 3 round followup 仍無 reply)→ fallback local
- 高敏議題(eg. 涉及尚未公開 commit / 私下技術討論)→ default local
- 一般 audit / canonical / cross-component decision → default cloud(留 PR trail)
