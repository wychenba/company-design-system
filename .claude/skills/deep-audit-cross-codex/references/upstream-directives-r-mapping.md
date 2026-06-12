# Upstream context / framing + user-verbatim directives + R18-R26 mechanical-mapping(deep-audit-cross-codex SKILL.md 抽出)

## SSOT integrity invariant + 生態位 + 上游 canonical 全繼承

> **SSOT integrity invariant**(2026-05-18 user-mandated):本 skill 的 audit dim list **完全 chain `/design-system-audit --deep` SSOT**(`.claude/skills/design-system-audit/SKILL.md` `## The N audit dimensions` 段)。
>
> **禁** hardcode dim count(`46 dim` / `53 dim` 等具體數字)— 用「全 dim」/「Group A-P」/「per design-system-audit SSOT」表達。新增 / 刪除 / 修改稽核項目 → **只動 design-system-audit/SKILL.md**,本 skill 自動繼承。
>
> Mechanical 強制:hook `check_dim_count_drift.sh` 攔 Edit 寫死數字。

**生態位**:`/design-system-audit --deep` 是 Claude solo 全 dim 稽核 SSOT;本 skill 是**雙 model 完整 sweep**(Claude solo → codex parallel → 比稿辯論共識 → 落地),chain 既有 audit dim 不 fork。

**上游 canonical 全繼承**(per user「避免膨脹但別漏」):本 skill chain CLAUDE.md 全 mindset + meta-patterns 全 active M-rules + 治理 8-home / 自主執行 / 命名 SSOT canonical,**不重述、不 hardcode count(避 R19 膨脹),全靠 reference**。

## 上游 user-verbatim directives + R18-R26 對齊

對齊 mindset #1「不取巧省工」+ M31 dual-track + 用戶 2026-05-18 directive(verbatim):

> 「完整深度進階稽核整個 design system」+「codex 跑相同的完整深度進階稽核」+「跟 codex 討論辯論出共識」+「SSOT-UI/UX 增刪改需要用中文具體人話言簡意賅地講給我聽讓我判斷決策,其他的決策基本上就是不以省工為前提...自主自動自發地做到完整、完美」

**+ 用戶 2026-05-29 directive(verbatim,permanent codify)**:

> 「你應該要確保任何 infra 包括各種 Claude.md, skills, hooks 等在 ds repo, template repo, fork template 的 repo, 都能正常順利如預期的運作達到預期的效果, 且流程都正確無誤,且該維持 SSOT 的部分又能完全維持」+「我們的工作流程就是用 claude code 直接連去 repo 進行各種增刪改, 然後要可以部署出來讓人驗證, 驗證完成之後再推去 main」+「確保環境建置是能夠全雲端的, 且該自動化的就自動化, 真的無法自動化的要有具體的言簡意賅的中文明確引導」+「確保所有原則都是足夠泛化可以用來舉一反三的原則, 避免原則無限膨脹, 沒有多餘重複的且是 SSOT, 並確保所有 infra 都是最佳有效率的 claude code 實務, 並確保 infra 能夠產出世界級的設計並符合我們一致的設計語言和確保 ssot, 然後所有程式碼都是乾淨簡潔易懂好維護好管理的, 且是會有大腦地自動優化不斷改善, 確保自己永遠符合上述原則」

**機械強制 R18-R26 對齊**:
- R18 泛化 / 舉一反三 → 上游 mindset #6 + meta-patterns velocity ≤ 3/quarter(`/knowledge-prune`)
- R19 避免膨脹 → 上游治理 canonical 行數預算 + `/knowledge-prune` 季度
- R20 無多餘重複 SSOT → 上游 Rule-of-3(`/knowledge-prune` D1 + ensure-canonical Phase 3)
- R21 最佳 Claude Code 實務 → 上游「世界級對照」section
- R22 世界級 + 一致設計 → 上游 mindset #1 + A.3 7 目標 simultaneous
- R24 code clean → chain `/code-quality-audit`(Phase A.4 verify chain)
- R25 大腦自動 self-improve → chain `/ensure-canonical` Phase F + M14
- R26 永遠符合 → M19 trigger phrase auto-pipeline(`stop_self_audit.sh` 機械強制)
