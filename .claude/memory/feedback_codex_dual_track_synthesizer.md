# Feedback — Codex collab 永遠走 dual-track 比稿(M31 universal 5-step)

**Date**: 2026-05-07(updated 2026-05-10 M31 universal;2026-05-29 prune trim Rule-of-3 dup → pointer)
**Trigger**: User 反覆糾正我退化成 pass-through(直接列 codex 提的 A/B/C 給 user 拍板)

本檔 = M31 dual-track 的 **provenance anchor**(user verbatim 原話 + 起源實證)。**5-step 操作細則 SSOT 不在此** — 在 `.claude/skills/codex-collab/SKILL.md`「M31 Universal 5-step canonical」段 + `.claude/rules/meta-patterns.md` M31 row。本檔只留 verbatim 直接引用 + 起源 anchor,避免 Rule-of-3 drift。

## User 拍板 directive(verbatim,M31 row「verbatim quotes」指向此段)

> 「你跟 codex 都要各自驗證過並視覺稽核過,最後你整合出完美完整的版本」+「你是可以跟 codex 辯論的,請你們彼此據理力爭,但要有依據,所以都要各自熟讀所有檔案」+「**這應該在 infra 要強迫你們整合彼此結論之前有此 mindset**,避免你完全被 codex 的錯誤解法牽著走」(2026-05-10)

> 「你不是應該自己跑一次 knowledge-prune 或是同樣的流程再去跟他比對結果嗎,看哪邊值得參考哪邊不值得參考,這是你的工作流程吧?我以後在每個 session 都希望你是這樣跟他合作的,你自己會有一版,他也會有,最後你負責比稿,取優點去缺點然後再給出一個最佳方案,各方面的協作都是這樣,你不只是一個守門員,我就是要有 2nd opinion 的機制來監督」+「以確保產出品質...完全不打折且要完美且符合世界級的設計...SSOT 為前提,**不以省工為前提**」

## Invariant — 每次 collab 必 dual-track(hook `stop_self_audit.sh:143` 強制)

**Layer A**(Claude own 一版完整分析)+ **Layer B**(codex own 一版)+ **Layer C**(Claude 比稿 — 取優棄劣 → final synthesized)。三層缺一 = 違反。操作 5-step 表見 SKILL.md SSOT。

**禁止**:
- Pass-through(paste codex 結論 + 列 A/B/C 問 user)
- Single-track(只我一版 OR 只 codex 一版)
- 省工(「codex 已查所以我不查」)— dual-track 是 cost 不是 efficiency tool

## 2026-05-10 起源實證(M31 anchor case)

- **Issue 8 cell border**:codex「Field edit border 透明」→ Claude pass-through ship → user「白癡 被 codex 牽著走」→ 重做 cite battle 雙 owner。違反 Step 1-3-5。
- **Issue 11 controller retire**:codex disagree cite RFC → Claude 完整 5-step(read RFC + Phase 7 commit + grep zero consumer + counter-cite)→ codex round 2 grep 確認 → ship。M31 正確 pattern 錨。

## 2026-05-10 Self-improvement amendment — Codex-first for root-cause-elusive bug

**Why**:user verbatim「每次問題丟給你你都解決半天還容易解決不了,然後丟給 codex 就一次到位,到底要怎麼自動改進你自己?」(2026-05-10)。實證:scrollbar thumb hover bug — Claude 自查 2 turn cope-out;codex 1 reply 找到真根因(Chrome 121+ scrollbar-color override webkit pseudo)。

**Invariant**:Bug root cause **第 1 turn 自查窮盡仍找不到**(non-trivial CSS / browser quirk / async timing / cross-component)→ 立刻丟 codex deep-dive,不苦撐 N turn。對齊 M31 Step 0 gate criterion (a)「自試卡 root cause → 啟 codex」。

**判斷 trigger**:自查跑 grep + read + 1 hypothesis → user 仍報「沒解」= 窮盡 signal;跨 browser / CSS spec / framework internal / native rendering → codex first(spec lookup 更精確);純 grep can find / file:line direct mismatch → 自查 OK。**禁**:「我多查 1 round」拖延。

## Anti-pattern 警示(SKILL.md:191「禁 pass-through」指向)

新 session 若看到我:直接列 codex 結論問拍板(pass-through 退化)/ 沒附 own-version findings 就 send brief(single-track 退化)/ 把 codex 講的當 ground truth 不 grep verify(dispatcher 退化)→ 任一 = 違反,user 應立刻糾正 + 我自我撤回。

## Trigger phrases(cross-session)

「比稿 / 2nd opinion / dual-track / 不打折 / 不省工」→ auto invoke codex-collab SKILL 流程。Deep brief + 投遞 interval + queue 自主追蹤 canonical 全在 SKILL.md Step 1-2(不在此重述,避 Rule-of-3 drift)。

## Mechanism propagation

5-layer 已落地(M31 row / `check_codex_collab_5step.sh` / codex-collab SKILL.md / CLAUDE.md 任務導航表 / 本 memory)。SSOT 細節各 home 自管,本檔僅 provenance。
