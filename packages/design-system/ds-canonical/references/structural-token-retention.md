# 結構性保留 token canonical(audit Dim 48 SSOT,2026-05-17 codified)

某些 token 看起來「0 consumer」但屬**結構性保留**,不該 retire。**Sub-agent 跑 audit Dim 48 抓 0-consumer candidate 時必先過此 table,屬下列 6 類則 retract finding(不列為 violation)**。

## 6 類結構性保留(對齊 Radix Color / Atlassian @atlaskit/tokens / Polaris polaris-tokens 三家共識)

| 類別 | Examples | 保留 rationale |
|---|---|---|
| **1. Radix-style palette completeness** | `--color-{blue,deep-orange,orange,amber,yellow,lime,green,turquoise,indigo,purple,magenta}-{3,4,5,8,9,10}` / `--white-a{12,15,25,45,65,85}` / `--color-red-{1..10}`(red palette 因 semantic 重映射 deep-orange 而不直接消費)| Radix Color idiom 必 12 步階完整,即使目前只消費 step-{1,2,6,7} 給 Tag/Avatar,中間步階保留供未來 hue scale 擴充 / hue calibration 對照。Retire = 破壞 palette 完整契約,新加 hue 時需重新訂全套 |
| **2. Forward-looking consumer reservation** | `--brand` / `--color-brand` | 預留給 consumer-layer(`src/app` / product UI)消費的品牌色 token。DS 本身不消費,跟 `--primary`(DS UI accent)分層。Retire = 未來產品做品牌頁時要重補 token + spec |
| **3. Tailwind bridge alias to semantic state SOP** | `--color-status-{online,busy,away,offline}` / `--color-inverse-neutral-{hover,active}` | `@theme inline` bridge 讓 `bg-status-online` 類 utility 可用,即使現有 code 走 `var(--status-online)` direct(NameCard.tsx / Avatar.tsx / Tag.tsx 實際消費 underlying token 非 alias)。Bridge 是 future-proof Tailwind class consumption,retire = 限縮使用方式。（2026-06-04:原 `--color-warning-foreground` 已移除——改名 `--on-emphasis-dark`,white/dark on-fill 配對見 color.spec.md）|
| **4. State SOP 5 件套** | `--info-active / --success-active / --warning-active / --primary-text` 等 | semantic state 5 件套(base / hover / active / subtle / text)結構完整性,即使現有 active variant 無 consumer,保留供未來互動 state 擴充 |
| **5. Type scale completeness** | `--font-h1-size` / `--font-h4-size` 等 typography utility | Type scale 12-tier completeness,即使現有 production 只用 h2/h3/h5,h1/h4/h6 預留供 marketing / hero / drawer title 等場景 |
| **6. Elevation dark-mode pair** | `--elevation-100-hover / --elevation-200-hover` | `primitives.css:236,238,419,421` light + dark 雙模式各自定義 → 結構性 dual-tier,retire 會破 dark mode visual contract |

## Retire criteria 真實 strict(只有以下才 retire)

- 真實 0 consumer + **0 forward-looking reservation** + **0 dark-mode pair** + **0 palette completeness role**
- 對齊 Radix Color / Atlassian `@atlaskit/tokens` / Polaris polaris-tokens 三家 retire 政策共識

## Sub-agent 強制 triple-verify before propose retire

對每 candidate retire token,sub-agent 必 verify 3 layer:

1. **`grep -rn var(--TOKEN_NAME)` DS-wide**(含 `packages/design-system/src/**` + `src/app/**` + `src/explorations/**`)— 抓 direct `var()` consumption
2. **`grep -rn "TOKEN_NAME"` 排除 css/spec.md 定義 + template literal usage**(eg. `\`h-table-row-${size}\``)— 抓動態 utility class generation
3. **Cross-check 上 6 類**:屬任一 → retract finding,**不列 retire candidate**

**任一 layer 顯示「有 consumer / 屬結構保留」→ 從 retire report 中拿掉**(不要送 user 拍板浪費時間)。

## Audit Dim 48 false-positive 經驗(2026-05-17,user 抓教訓)

Sub-agent 用 narrow grep(只看 utility class hit,沒看 `var()` direct + template literal + dark mode override + forward-looking)抓 58 個 retire candidate;Layer A own re-verify 後 100% 為 false positive(全是結構性保留)。

User verbatim 2026-05-17:「每次抓出的問題你他媽要給我基於我們所有的檔案包括設計原則去再三確認到底是不是問題,避免明明就不是問題卻一直要我決策浪費我的時間」。

本檔 codify 後類似 audit 跑時自動辨識結構性保留 token,不再誤判。

## 引用

- `tokens/color/color.spec.md`「結構性保留 token canonical」(pointer 段)
- `.claude/skills/design-system-audit/SKILL.md` Dim 48(sub-agent prompt 必 cite 本檔)
