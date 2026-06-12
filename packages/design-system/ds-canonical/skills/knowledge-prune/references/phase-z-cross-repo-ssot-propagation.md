# Phase Z reference — Cross-repo SSOT propagation(knowledge-prune SKILL.md「Phase Z reference」extract)

### Phase Z reference — Cross-repo SSOT propagation(2026-05-26 retract skill-specific Phase Z,移到 CLAUDE.md canonical)

**Per user 2026-05-26 correction**:「不是只要一 knowledge audit deep 之後就要,是等我 push main 後才要」。

Cross-repo SSOT sync trigger 不是「skill 跑完」而是「push main 後 SSOT-affecting diff」— canonical 統一在:
- `CLAUDE.md` `# Git solo-work canonical` Step 5.5
- Hook `check_post_main_ssot_propagate.sh`(PostToolUse Bash 偵測 `git push origin main` + diff)

→ /knowledge-prune skill 本身**不負責 trigger sync**;Phase 3-4 commit + Phase 6 user 拍板 push main 後,canonical hook 自動偵測 SSOT diff + 提議 npm bump。**整鏈 1 trigger 同時 cover /deep-audit-cross-codex / 一般 dev / 任何 SSOT-affecting 來源**(DRY,不複製到每個 skill)。
