# Codex Round 5 — race fix root cause confirmation + DS-wide similar pattern audit(M31 真辯論)

## User verbatim 2026-05-16(round 5)

> 「你跟 codex 確認你目前的解法是否真的解決 root cause 且其他相關的問題都有被解決?
>  然後你一定有辦法自己驗證,請你自己想辦法」

## Layer A 本 round 已修(commit `dd0f96ba`)

`combobox.tsx:60-130` `useOverflowCount`:
1. `useEffect` → `useLayoutEffect`(tighter sync timing after commit before paint)
2. Capture rAF IDs(`rafId1` / `rafId2`)
3. `scheduleCalc` 排新 rAF 前 cancel in-flight
4. Cleanup function cancel pending rAFs(原 L123 漏 cancel 為 race 根因)

Layer A hypothesis:
- Path A(逐個 click 滿 6):每 step length 變 → useLayoutEffect re-fire → override 寫 `el.hidden`
- Path B(length 6→0→6):length=0 走 internal calc 排 rAF;length=6 後 stale rAF fire 覆寫 override
- **Race close**:cleanup 取消 rAF + useLayoutEffect 更早跑 → 不留 race window

## Codex Round 5 任務

### Q1 — Verify race hypothesis 跟 fix completeness

請 codex 獨立 grep `combobox.tsx:60-130` 新 useLayoutEffect 實作,verify:
1. **Race hypothesis 正確嗎?** 拆解 step-by-step React render lifecycle + rAF microtask ordering,
   驗證 path B 是否真會發生 stale rAF overwrite。如不同意,counter-propose root cause。
2. **fix completeness**:
   - useEffect → useLayoutEffect 是否引入新問題?(e.g. 沒 paint flicker / sync 過多 layout reads)
   - rAF cancel 兩 IDs 夠不夠?scheduleCalc 內 cancel in-flight 是否 sound?
   - 還有沒有別的時序漏洞(deps mismatch / 多 component instance 共用 ref)?
3. **edge case**:
   - length=1 fast-path early-return 跳過 measurement,override=undefined 時是否一致行為?
   - totalCount=0 early-return 同樣問題?

### Q2 — DS-wide similar pattern audit(user verbatim「其他相關的問題都有被解決」)

請 codex grep DS-wide 找 `useEffect` + `requestAnimationFrame` without capture/cancel pattern:
```bash
rg -n "useEffect.*requestAnimationFrame|requestAnimationFrame.*useEffect" src/design-system
rg -n "requestAnimationFrame\(" src/design-system --multiline
```

對每個 hit 判:
- 有沒有 rAF ID capture?
- cleanup 有沒有 cancel?
- 跟 React state update 有沒有 race?

特別 check:
- `MultiPersonDisplay` person-display.tsx `useLayoutEffect` 內 measurement(已用 useLayoutEffect 但有沒有 rAF/observer leak)
- `useOverflowCount` 周邊 helper / cleanup
- `DataTable` virtualized scroll observers
- 任何 measurement-driven primitive

### Q3 — Self-verify mechanism

Layer A 跑 Playwright force-click 模擬 path A(逐個 click)被 Radix popover 攔。
Codex propose:
- 用什麼方式可精確重現 user path A(逐個 click)vs path B(全選→取消→全選)?
- 是否可直接 DOM dispatchEvent / React state injection?
- 還是該寫 controlled test story 暴露 setter on window?

## 限制

- **不 ship code**;Codex Round 5 純 verify + propose
- Cite source(file:line + 引文)
- 如 fix 不完整 → 明示 missing piece
- 如 race hypothesis 錯 → 明示 alternative root cause

## Output 3 sections

1. **Q1 race hypothesis + fix completeness verdict**
2. **Q2 DS-wide similar pattern grep + audit table**
3. **Q3 self-verify mechanism propose**
