# Triage rubric — SSOT-UI/UX vs Non-SSOT scope classifier

## Scope classifier(critical 第 1 步)

### SSOT-UI/UX substantive(必 ASK user)

任一命中 → **STOP propose 等 user A/B**:

- 動 `src/design-system/components/<X>/<X>.tsx` 的 cva variant / size / state(視覺 surface)
- 動 spec.md 的「視覺結構 / canonical / SSOT / 何時用 / 何時不用 / 邊界案例 / Layout Family」段落 substantive meaning
- 加 / 刪 / 改 token(`tokens/**/*.css` / `*.spec.md`)
- 加新 prop / 重命名 prop / 改 prop default value(API contract)
- 跨元件 design language 改動(同類 row primitive 重新訂 padding / dismiss canonical 跨元件改)
- 新 family 宣告 / 改 family 歸屬
- 新 pattern 加入 `patterns/` 或既有 pattern scope 改變

### Non-SSOT(AUTO 整批做完,M33 anti-defer)

- Bug fix(spec 既有 canonical + code 跑掉 → 對齊 spec)
- Code clean(unused import / dead export / typo / 排版)
- Refactor 不動行為(extract helper / rename internal symbol / consolidate condition)
- 命名一致對齊既有 canonical(per `# 命名與語言一致性`)
- Test / audit / verify(playwright / invariant script / hook regex 加廣)
- Audit dim / hook 加廣(對齊 spec wording 廣度,M34)
- Pointer / cross-link 補完整(reciprocal Dim 3 / SSOT pointer)
- Spec typo / markdown layout / 標點
- Memory file rotate(已 absorb → demote)
- Governance / hook / skill 內部 refactor(無 BLOCKER 邏輯改)

## SSOT-UI/UX propose 中文人話 format(per `feedback_propose_in_plain_chinese.md`)

```
### 決策 N:<一句話標題,zero jargon>

**現況**:
- <目前 spec / code 行為,具體一句話人話>
- 證據:<file:line>

**影響**:
- 不改:<具體後果>
- 改了:<具體後果>

**選項**:
- A. <做法 1>
  - 後果:<好處 / 代價>
  - 涉及檔案:<count + file 列表>
- B. <做法 2>
  - 後果:<好處 / 代價>
  - 涉及檔案:<count + file 列表>
- C. 不動
  - 後果:<漂移持續累積 / 或維持現況的成本>

**我推**:<A / B / C> 因 <理由>
```

### 4-Q gate(propose 前必 inline 跑,失敗 → 不列 option)

| Q | Check | 失敗 → |
|---|---|---|
| Q1 M22 cite | 3-column owner table(spec path:line / canonical sentence / conflicting code)| 撤回 propose,先補 anchor |
| Q2 M17 SSOT | 既有 token / primitive / pattern 列消費清單 | 撤回,先 consume 既有 |
| Q3 Rule-of-3 | 同概念 ≥ 3 處 → 選 SSOT 其他 pointer | 撤回,選 SSOT home |
| Q4 M10 下游 | 修上游 ≥ 3 處下游 redundant 可清 | 提案加上「下游 N 處同步 retire」 |

### 禁用 jargon list(propose 內 zero tolerance)

❌ `L1-L7` / `canonical` / `primitive` / `SSOT` / `consume` / `traits` / `M-rule` / `cva` / `tier` / `tokens` / `wrapper`
✅ 翻成:`主檔` / `設計原則` / `共用零件` / `通用基底` / `共用設計來源` / `沿用` / `行為類型` / `規則 N` / `樣式拼裝表` / `層級` / `設計變數` / `外殼`

## Non-SSOT autonomous 7 軸 simultaneous optimize

每次動 code 前 mental check:

1. **言簡意賅** — comment / spec 文字短而精;禁長 docstring;禁不必要 comment(per CLAUDE.md `# Tone and style`)
2. **效率 + 效能** — 避 unnecessary re-render / memo gap / O(N²) algorithm / context thrashing
3. **SSOT 鐵律** — 動 visual decision 前 grep DS 既有 token / variant / pattern(M23)/ spec.md owner(M29)/ wrapper extends primitive(M30)/ token 而非 hardcode(M17)
4. **易懂 + 維護 + 擴充** — file size budget(governance ≤ 200/300/500/800)/ function ≤ 80 / naming 一致 / public API 穩定
5. **世界級 + 一致設計語言** — mindset #1(Polaris / Material / Atlassian / Ant / Carbon / Apple HIG ≥ 3 cite)+ M22 inline cite + M26 propose 前 WebFetch ≥ 3 source
6. **完整 self-verify** — M20 best-practice score ≥ 80 / M31 5-step(Layer A own + Layer C codex 比稿)/ M32 pixel-quantified audit
7. **自動 self-improve** — M14 5-layer pipeline(對話結論 → spec / hook / SKILL / CLAUDE.md / memory 該動的全動)+ M20 stop hook auto-score

任一軸明顯 degrade → 撤回方案重來,**禁** 「先這樣 / 之後優化」defer keyword(M33 BLOCKER)。

## 共識決策(Phase B.5)同 format

Phase B 共識(Claude + Codex 雙 verify PASS)走相同 propose / autonomous 分流:

- SSOT-UI/UX 共識 → 中文人話 propose user 拍板
- Non-SSOT 共識 → autonomous batch(7 軸 optimize)

**禁** Phase B 共識降回 Phase A 已 ASK 的同 decision 重 ASK(浪費 user 時間)。已 ASK 的 → 等 user 拍板;新發現(Phase B 抓的 Phase A 漏)→ 新 propose。
