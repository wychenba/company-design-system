# Feedback — Spec-Impl 對齊 + Sort-parallel + Fix-must-reproduce 三條治理

**Codified**: 2026-05-04(本 session 多處 failure 後 codify)

---

## F1 — Spec-Impl 對齊(D1 SelectMenu width 真實案例)

**Failure mode**:spec.md 寫 canonical「default = X」,但 implementation 被外層元件 hardcode override。
- **Real case**: SelectMenu spec L72 寫「width 預設跟 trigger 同寬」(via `--radix-popover-trigger-width`),但 implementation 被 PopoverContent 預設 `w-72` (288px) 蓋過,canonical 從未生效。User 4 月就抓到 dropdown 寬度怪。

**Codify**:
- Hook `.claude/hooks/check_spec_impl_default_alignment.sh`:edit `*.spec.md` 含「default」/「預設」/「default value」keyword → soft warning 提醒 self-check implementation
- Self-check 步驟:(a) 找對應 implementation file → (b) grep default value 是否被外層 override → (c) 若不一致 → 修 implementation OR 修 spec → (d) 若一致 → implementation 加 inline comment「Default per spec L<N>」回扣

---

## F3 — DataTable filter ↔ sort 對等修

**Failure mode**:filter 修了 row gap / button variant / trash style,sort 漏改 → 視覺不一致。
- **Real case**: filter Q4 trash 改 text Button、Q5 minRows、Q9 button variant 都需 sort 對應修但容易漏。本 session A1 (加篩選 tertiary) → B1 (加排序 也該 tertiary) 是 user 提醒才補。

**Codify**:
- Hook `.claude/hooks/check_data_table_sort_parallel.sh` (PostToolUse):動到 filter-panel.tsx → 提醒 sort-manager.tsx 同步;反之亦然
- Self-check list:row gap / row meta button / chrome corner action / CTA variant / empty state

---

## F4 — Fix-must-reproduce(Q7 真實案例)

**Failure mode**:user 報 bug → 我憑推測修 → 沒實際 reproduce → 修錯方向。
- **Real case**: Q7 「table 慢慢長高」我先用 `position: absolute` chrome group(規避 selection-time push)→ 又用 `visibility: hidden` race(沒實際 hidden 到)→ 兩個都是錯方向。真因 = `estimateRowHeight` (36) ≠ token md (40) 的累積誤差,要 inspect virtualizer 才能找到。

**Codify**(no hook,純 mindset)— 加進 propose-options skill / M20 self-audit:
- 報告 fix 前必先:(a) reproduce bug(視覺 / inspect / log)→ (b) 在 source 找 root cause line → (c) 寫 fix → (d) 再 reproduce 驗 fix 真生效
- 反 pattern:「我猜大概是 X,改 X 試試」→ 強烈警號

---

## 共通 lesson

3 case 都是**「沒 verify 就 claim」**。Stop hook M20 已 BLOCKER 化(本 session 已被攔多次)。下次 propose / fix / done 必有對應 verification artifact(screenshot / DOM inspect / tsc output / spec excerpt)。
