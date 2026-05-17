# Codex Round 3 — Ant Design Select All 深研 + Round 2 verify gap 補完(M31 真辯論)

## User verbatim 2026-05-16(third round 不買單)

> 「然後 select all 那個問題我不買單,你自己去研究看看 ant design 到底是不是你說的那樣,然後這題也跟 codex 討論辯論」

> 「我要你和 codex 都各自仔細研究 ant design 的設計和實作邏輯,並討論辯論出改善的方向的共識,確保我們跟世界級的設計一樣」

User Round 3 抓:
1. Round 1 我 claim 「Ant 用 source order」→ 假
2. Round 2 codex 給 rc-select cite 但太淺(只底層 lib,沒 Ant 本身)
3. User 要「深研 + 改善方向共識 + 世界級對齊」

## Layer A Round 2 4 個 dissent gap(本 round 補)

| Gap | 內容 |
|---|---|
| (1) γ vs α+γ | Codex Round 2 vote γ pure(chip overlay last avatar);我 ship α+γ hybrid(formula slot-based + chip wrapper `-ml-0.5` 視覺 overlap)。Codex 未 confirm hybrid 是否 acceptable extension。請判:hybrid 視覺結果 = pure γ 嗎?還是有 layout difference 我沒看見? |
| (2) MultiPersonDisplay readonly path 共用 primitive | `person-display.tsx:189-208` measured=true 走同 `getAvatarStackVisibleCount`。formula 改 slot-based 後 readonly stack 是否 smooth?需 grep verify display path 也套 chip overlap。 |
| (3) text-tag Combobox 不回流 | `overflowWrapperClassName` opt-in;text-tag mode(非 PeoplePicker)不 pass = undefined。理論上 chip wrapper 仍 `shrink-0` 無 overlap,跟 fix 前一樣。但需 grep DS 內 Combobox 文字 tag 使用 site 驗證。 |
| (4) Ant Design Select All 深研 | Round 2 我只丟 Q5 給 codex,只回 rc-select(底層)。User 要 Ant Design 本身設計+實作邏輯深研。 |

## Codex Round 3 任務

### Q1 — Ant Design Select All 深研(主任務)

**請 codex 用 `npx codex exec` MCP github_fetch_file** grep + cite 至少 4 個 Ant Design source/docs site:

1. **`ant-design/ant-design` Select examples**:`components/select/demo/big.md` / `demo/multi.md` — Ant Design 官方 demo 是否含 select-all?ordering?
2. **`ant-design/ant-design` Transfer 元件**(has built-in checkAll):`components/transfer/index.tsx` + `transfer/list.tsx` — `handleSelectAll` ordering logic
3. **`ant-design/ant-design` Table column filter**(has filter checkAll):`components/table/hooks/useFilter.tsx` — column filter 選全部後 selected keys ordering
4. **GitHub issues / PR**:`issues?q=is:issue+select+all+order` / `is:pr+selectall+order` — Ant Design 社群是否討論過 Select All ordering UX

### Q2 — World-class 對照(per M8 ≥3 家)

Ant 答案 vs:
- **MUI Autocomplete** + Select multiple — 有沒有 selectAll?如有,ordering?
- **Polaris** SelectPanel — Select All ordering
- **Atlassian Forge** UI kit Select — Select All

3-column 表:每家 source cite + ordering 行為 + 共識?

### Q3 — Round 2 Layer A α+γ hybrid verdict

Codex Round 2 vote γ pure。我 ship α+γ:
- α = formula 改 slot-based(`avatar-stack-overflow.ts:75-79`)
- γ = chip wrapper `-ml-0.5` overlap(`combobox.tsx:170-174` + `people-picker.tsx:412`)

Codex 跑 read-only grep verify:
- α 是否真實作 slot-based?formula 是否 smooth at adjacent length?
- γ 是否真做 chip overlap 而非 chip-as-separate-chunk?
- α+γ 視覺結果 = pure γ?還是有 layout difference?

Approve / counter-propose / 拒絕 hybrid?

### Q4 — DS-wide 補 grep audit(per user「所有相關類似地方」)

Codex 跑 read-only grep:
1. `MultiPersonDisplay` 是否套用同 chip overlap pattern?(person-display.tsx 內 `OverflowIndicator` 渲染處)
2. text-tag Combobox(非 PeoplePicker)的 chip 是否 broken by chip overlap change?(opt-in 設計理論上 OK 但需 verify consumer)
3. 還有沒有「同 formula primitive 但不同 visual idiom」的 drift 點?

### Q5 — Improvement direction 共識(per user「改善方向的共識」)

如果 Ant Design Select All 是某 ordering(假設 = source order)+ 跟 MUI/Polaris 一致 → DS 該對齊。
如果世界級無共識 → 該如何決?基於 DS 自身 SSOT mindset #2「優先消費既有」?

請 propose 3 路徑 + cite:
- (A) Preserve current click order + append unselected at end(我 Round 1 propose)
- (B) Always source order(我 Round 1 推薦)
- (C) 維持現行 click order until Select All → source order reset(現行 behavior)

## 限制

- **不 ship code** Round 3(仍 verify phase)
- Cite source 必含 file:line + 引文
- Sandbox 跑不了 Playwright → 明示 Layer C visual 仍由 Layer A 負責跑
- Layer A 整合後再 propose user 拍板

## Output 4 sections

1. **Q1 Ant Design 深研**:Transfer / Table filter / docs / issues cite + verdict
2. **Q2 World-class 3-column 表**
3. **Q3 α+γ hybrid verify**(approve / counter)
4. **Q4 DS-wide audit gap**
5. **Q5 improvement direction 3 路徑 propose** + 你 vote
