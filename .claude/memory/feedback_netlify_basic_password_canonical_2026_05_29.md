---
name: Netlify Basic Password canonical + Claude Code 直連是雲端主路徑(2026-05-29)
description: Netlify Identity deprecated;fork-template default access = Basic Password;Claude Code 直連 fork repo 是 user 工作流(不是 Codespaces)
type: feedback
originSessionId: 41fa83c2-f951-431e-911e-ed3ceb185903
---
# Netlify Basic Password + 雲端主路徑真相(2026-05-29 user 兩 turn 抓出)

## Rule 1 — Netlify access control = Basic Password

**Fork-template default Netlify access control = Basic Password Protection**(free-tier 唯一可用)。**禁** 推薦 Identity(已 deprecated)/ Team protection(鎖 Pro $19/mo)。`npm run setup:netlify` 自動跑 CLI install + login + site 建 + 連 repo,**最後印 dashboard URL + 教 user 點 2 radio button + 輸 password**(無法 CLI 自動 — Netlify CLI 沒提供 password protection API,2026-05-29 verified)。

**Why**:Netlify 2024 公告 Identity service deprecated;新帳號可能根本看不到 Identity menu。Visitor access UI 在 free-tier 只有「Basic protection」可選,「Team protection」+「Non-production deploys only」都鎖 Pro plan。Identity-based invite-only **真實不可用**。User 2026-05-29 screenshot 抓出實際 UI 跟我講的對不上。

## Rule 2 — 雲端主路徑 = Claude Code 直連 sandbox(不是 Codespaces)

**User 工作流 verbatim 2026-05-29**:「我們的工作流程就是用 claude code 直接連去 repo 進行各種增刪改,然後要可以部署出來讓人驗證,驗證完成之後再推去 main」

**真實雲端路徑**:Claude Code(claude.ai/code OR 桌面 OR VS Code ext)直接連 user 的 GitHub fork repo;Claude 把 repo clone 進 ephemeral sandbox,governance hooks + skills + npm + git ops 全在 sandbox 內跑。寫完 commit / push 回 GitHub。**這是 user 實際工作流;不需 Codespaces 也不需本地 IDE**。

**Codespaces 是 fallback option**(給不用 Claude Code 直連的 user):`template/ds-product-template/.devcontainer/` 已 ship,Path 2 OK 但不是 user 主路徑。

**Setup script 必 npx fallback**(2026-05-29 verified):`npm install -g netlify-cli` 在 sandbox / Codespaces non-root / 鎖權限 Mac 打 EACCES → try/catch + `npx -y netlify-cli` fallback 才是 robust。

## Rule 3 — Codex exec mode 大 brief 死局

**Anti-pattern**:DISCUSS-ONLY 大型 6-軸 brief + xhigh / medium reasoning effort = 模型 plan turn 燒掉 budget 沒輸出 verdict。**Success pattern**(2026-05-29 r5/r6 verified):`--dangerously-bypass-approvals-and-sandbox`(per `feedback_codex_visual_audit_dangerously_bypass.md`)+ `model_reasoning_effort=low` + **拆 N 個小 focused brief 並行**(每 axis 25k tokens 真完成)。

## Rule 4 — 兩個 repo 都全雲端可操作 = clone-on-demand,禁把「當下沒 checkout」當能力邊界

**User directive(2026-05-29 verbatim)**:「這兩個 repo 也都要能夠支援全雲端操作」。指 `design-system`(SSOT 主庫)**和** `ds-product-template`(consumer)兩個都要能全雲端 edit + deploy。

**機制真相**:`gh` token(`ajenchen`,scope `repo`+`workflow`)→ 任一 repo 都 `git clone` 進當前環境(cloud sandbox OR 本機 `/tmp`)edit/commit/push。**部署不需手動挑目標**——各 repo 自帶 `netlify.toml` + workflows,push 到對的 remote 就觸發各自 CI 部署到對的地方(`design-system`:build:lib+storybook → Pages + npm publish;`ds-product-template`:build-storybook + apps/_template deploy.yml + 自己 Netlify preview)。「同時操作兩個」= 兩個各自 clone 並排,各推各的 remote。

**Anti-pattern(2026-05-29 我犯)**:user 問「能操作 ds-product-template?」我答「只能遠端 / 本地不能 / 它沒被 clone」——把 GoogleDrive 工作目錄的 filesystem snapshot 誤當成 capability boundary。**真相**:同 session 早已 clone `/tmp/ds-product-template`(commit c9cb03d)操作過。

**Rule**:被問能否操作某個 ecosystem repo(`design-system` / `ds-product-template` / fork)→ 預設 **YES, clone-on-demand**,不答「不能 / 只能遠端」。需要本地跑 skill/audit/codex → 先 clone 再跑。deep-audit-cross-codex 對 consumer 該換 `product-ui-audit` checklist(是「選對 checklist」非「不能操作」)。

## How to apply

- 被問「能操作 X repo 嗎」→ 答 clone-on-demand YES + 各 repo 自帶部署設定,禁把當下沒 checkout 講成不能
- 寫 fork-template setup script / README / CLAUDE.md → default Basic Password,Identity 撤回不再 mention 為 option(只在「為何不用 Identity」段 explain why)
- 推 user 雲端路徑首推 Claude Code 直連 sandbox(Path 1),Codespaces 是 Path 2 fallback
- Setup script 用 `${netlifyCmd}` 變數 + try/catch global-install,fallback npx-y 保證所有環境 work
- Codex collab 寫 brief:拆 single-axis focused brief + low reasoning + bypass flag,禁 6-軸 mega brief

## 錨例

- 2026-05-29 user screenshot Netlify Dashboard Visitor access page 顯示 Password Protection 為唯一可用,Team protection 鎖 + Non-production deploys only 鎖
- 我之前(2026-05-26)寫 setup-netlify-access.mjs 用 `netlify api provisionSiteIdentity` — Identity API 在新 site 不穩定 / 不可用
- 2026-05-29 turn 1:我推 Codespaces 為「the cloud-only path」,user 抓「我們工作流是 Claude Code 直連,不需 Codespaces」
- 2026-05-29 turn 4:codex r1-r4 用大 brief + xhigh reasoning 全失敗,r5/r6 小 focused brief + low + bypass flag 成功 25k tokens
- 2026-05-29(Rule 4)：user 問能否操作 ds-product-template,我答「只能遠端/本地不能」→ user 抓「我之前說過兩個 repo 都要全雲端操作」+ `/tmp/ds-product-template` 證實本 session 早已 clone 操作過(commit c9cb03d)
