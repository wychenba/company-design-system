# Skill 分工 + Anti-pattern + 世界級對照(deep-audit-cross-codex SKILL.md 抽出)

## 與其他 skill 分工

| Skill | Scope | 不重疊 |
|---|---|---|
| `/design-system-audit --deep` | 全 dim Claude solo audit | 本 skill chain 為 Phase A.1,額外 Phase B + 全盤閱讀 preflight + 比稿辯論 |
| `/codex-collab` | M31 5-step dual-track for **任意題目** | 本 skill chain 為 Phase B,額外 Phase A 前置 + 全 dim 完整覆蓋(per design-system-audit SSOT) + Phase C 共識 commit |
| `/propose-options` | M18 4-Q gate single propose | 本 skill A.2 / B.5 chain 用它格式化 propose |
| `/ensure-canonical` | M19 5-layer auto-pipeline | 本 skill A.3 / B.5 chain 用它落地 canonical |
| `/knowledge-prune` | 治理文件冗贅清 | **Transitively chained**:Phase A.1 chain `/design-system-audit --deep` → Phase 4.5 auto-chain `/knowledge-prune`(per `design-system-audit/SKILL.md:334-340` 9-trigger 條件)。SSOT 透過 `Skill` tool 直接 invoke,**不**重寫 prune logic / **不**複製 phase。Mechanical signal:`check_audit_post_report_validator.sh:81` emit `prune-chain-trigger` → `inject_pending_self_audit.sh` parse `.claude/logs/audit-post-report-validator.jsonl` → next-turn inject directive |
| `/bug-fix-rhythm` | surgical visual bug 修 | 正交,本 skill 是 broad sweep;surgical bug 不該觸發本 skill |

## Anti-pattern(永久 ban)

- ❌ Skip A.0 全盤閱讀(憑記憶判斷哪些 spec 該讀)
- ❌ A.1 sub-agent prompt 含「sample top N」/「heavy agent skip」escape
- ❌ A.2 propose 用 jargon(L1-L7 / SSOT / canonical 在 propose 內裸用)
- ❌ 跳 Phase B 只跑 Phase A(除非 codex transport 全失敗 + user 同意)
- ❌ B.2 收 codex reply 直接 paste 給 user(pass-through,M31 Step 4.5 verify 跳)
- ❌ B.4 disagreement 用直覺 vote / 「兩邊都對」打太極(cite battle invariant)
- ❌ C.2 AI 自決 merge main(M28 violation)
- ❌ Phase A 完成沒等 user 拍板 SSOT-UI/UX 就進 Phase B(scope 跑掉)

## 世界級對照

- **RFC 學術同儕審查**:作者 v1 + reviewer v2(獨立)+ public cite battle 收斂共識
- **Linux kernel patch review**:Maintainer first-pass + lkml mailing list 二 review + cite source 比稿
- **Google ML eng-design-review**:proposer + adversarial reviewer + structured disagreement protocol
- **Anthropic constitutional AI critic + revise**:同 model 不同 prompt 互審 → 本 skill 升級成跨 model
