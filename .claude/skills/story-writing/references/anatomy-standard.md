# anatomy Story 標準(`{name}.anatomy.stories.tsx`)

以 `Button/button.anatomy.stories.tsx` 為範本。每個元件的設計規格必須包含以下 5 個 story。

## 為什麼有「設計規格」(anatomy.stories.tsx 的目的)

設計規格取代 Figma inspect,是**元件的技術規格表**。滿足兩個 audience:

1. **設計師 / PM 讀 spec**:詳盡解剖學(anatomy 圖標示每個 slot)、每個數值的 token 來源、每個 variant × state 的色彩組合、每個 size 的尺寸藍圖 — **檢閱方便性必須超越 Figma**,不需切工具,一頁看完
2. **工程師讀 code**:依規格資訊能直接開發出一模一樣的 tsx,不靠設計師協助 — token name / Tailwind class / padding / gap / typography 全部在規格上,Inspect 面板即時 resolve 出 px 值

因此 canonical 5 story 不是裝飾,是**兩個 audience 各自需要的資訊分層**:
- `Overview` = anatomy 圖 + variant 一覽 + props 速查(「這元件長什麼樣」)
- `Inspector` = 即時預覽 + inspect 面板(「各 prop 切換時 token 怎麼變」,超越 Figma 的互動檢閱)
- `ColorMatrix` = variant × state 色彩矩陣(「每格色彩 token 是哪個」)
- `SizeMatrix` = size × variant 尺寸藍圖(「每格尺寸 token 是哪個」)
- `StateBehavior` = 互動狀態前後對照(「hover / active / disabled 怎麼變」)

5 個分層任一缺口 = 規格不完整 = Figma inspect 的替代目標沒達到。這就是為什麼 canonical 5 不是 5 個 random story,而是「足以 100% 還原元件」的最小必要切片。

## Canonical `export const` 名稱 + 中文顯示名(五件套)

每個 `.anatomy.stories.tsx` 的 `export const` 識別名稱必須用英文、中文 story 顯示名必須**強制 `name:` 覆寫**,且兩者**一字不差對齊**以下 canonical:

| 順序 | `export const` | 中文 story `name`(強制覆寫,含編號前綴) |
|------|--------------|---------------------|
| 1 | `Overview` | `'1. 元件總覽'` |
| 2 | `Inspector` | `'2. 元件檢閱器'` |
| 3 | `ColorMatrix` | `'3. 色彩對照表'` |
| 4 | `SizeMatrix` | `'4. 尺寸對照表'` |
| 5 | `StateBehavior` | `'5. 狀態行為'` |
| 6+ | 元件特有 | `'6. XXX'` / `'7. XXX'` 依順序編號(中文命名,見下方擴充規則) |

```ts
export const Overview = {
  name: '1. 元件總覽',  // ← 強制覆寫,不可省
  render: () => (...),
} satisfies Story
```

### 為什麼強制 `name:` 覆寫 + 編號

- **強制中文覆寫**:不覆寫時 Storybook sidebar 顯示英文 identifier(`Overview`),中英混雜破壞中文 spec 一致性。39/57 元件未覆寫,在 sidebar 呈現英文,這是 governance bug
- **強制編號**:Storybook sidebar 不依 `export` 順序,改依 story `name` 字母排序。中文無字母序,sidebar 會亂序;加編號前綴強制排序 canonical 化,順序跟 anatomy-standard 這份文件一致
- **世界級對照**:Polaris(Anatomy / Variants / States)/ Material(Anatomy / Guidelines)/ Atlassian(Examples / Code) 的 Storybook 皆為每個 story 明確標題,從不靠 identifier 帶出 sidebar 名稱

### Canonical 是**預設 5 section 都要建**,N/A 是嚴格例外

**canonical 5 section = 每個 Components/(public)元件預設都該有**。N/A 不是「省工豁免」,是嚴格例外 — 必須是「建了毫無意義 / 反而有害」才算 N/A。下方判斷標準**從嚴**。

**判斷預設 applicable**(採 Polaris / Material / Atlassian 世界級 baseline):
- **Inspector**:**幾乎所有 public 元件都 applicable**。只要元件有 ≥ 2 props,就該有 Inspector 讓 designer 切 props 看 render + token 對照。拒絕 Inspector 的唯一理由 = 元件 props < 2(極罕見,例 Separator / Skeleton 無互動 prop)
- **ColorMatrix**:applicable 如元件有 variant / hue / severity / theme。N/A 僅當元件色彩完全繼承 context(例 HoverCard 繼承 page theme 無自己 palette)
- **SizeMatrix**:applicable 如元件有 size prop(sm/md/lg)。固定尺寸才 N/A(Notice / Chip / Avatar 的特定固定場合)
- **StateBehavior**:applicable 如元件有任何互動 state(hover / selected / disabled / loading / error / focus)。純靜態 indicator(Badge / Tag)才 N/A

**嚴格警告**:曾經被誤用「applicable-where-meaningful」放行大量元件跳 Inspector,造成 anatomy 紙本文件不如世界級。**2026-04-21 audit 重修:policy 改回「預設全建,N/A 要硬 rationale」**。N/A 不是省工通行證。

### 允許的偏離(CLAUDE.md「Consistency Audit 原則」公式)

1. **追加第 6+ 個元件特有 story**:OK,不需 rationale。命名遵循以下格式:
   - `export const` 用 PascalCase 英文(如 `StandardRatios` / `LayoutMatrix` / `ColorBindingRule`)
   - 中文 `name:` 必須用編號前綴 + 中文描述:`'6. 標準比例'` / `'6. 佈局矩陣'` / `'6. 色彩綁定規則'`
   - ❌ 不准用素顏型 `'色彩綁定規則'`(破壞編號連續性)
   - ❌ 不准帶括號 context `'6. Orientation(horizontal / vertical)'` — 括號寫在 story 標題本體,不影響 sidebar 文字
2. **缺 canonical 5 某一項(N/A)**:**必須在元件 spec.md 寫一段 rationale**,格式:「本元件無 `{SectionName}` story,因為 {原因}」。典型原因:
   - Badge / Tag:純視覺 indicator,無互動狀態 → 不需 StateBehavior
   - Chart:色彩來自 ChartConfig 不來自元件 variant → 不需 ColorMatrix
   - Separator / Skeleton / CircularProgress / Avatar:無 size tier(自由 number)→ 不需 SizeMatrix(或 SizeMatrix 改為「範圍展示」)
   - Notice / Alert:固定單一 size(Material Banner / Polaris Banner 共識) → 不需 SizeMatrix
3. **保留 canonical 編號**:若有 Overview(1) + ColorMatrix(3) + StateBehavior(5),**編號保持 3 和 5**,不重編為 2 和 3 — 這讓讀者在 sidebar 一眼看出「這個元件跳過了 2 和 4」而非誤以為 canonical 就只有 3 個 section
4. **同概念改名**:不允許(如 `VisualTokens` 取代 `ColorMatrix` / `StyleMatrix` 取代 `ColorMatrix`)一律改回 canonical

**`/design-system-audit` Dimension 13 強制 grep 比對**:
- `export const` 名稱 ≠ canonical → violation
- 無 `name:` 覆寫(依賴 identifier) → violation
- `name:` 值 ≠ canonical 中文(含編號前綴) → violation
- 缺 canonical 5 某項且 spec.md 無 rationale → violation

## 1. 元件總覽

- Anatomy 圖——標示所有 slot(標準版面 + iconOnly 等變體版面)
- Variant 一覽——每個 variant 一行:渲染元件 + 一句話角色描述
- Props 速查表——prop / type / default / 說明

## 2. 元件檢閱器(取代 Figma inspect)

- 控制項:variant / danger / state / size / iconOnly(依元件調整)
- 左側:即時預覽 + 尺寸藍圖
- 右側:Inspect 面板,分區顯示 Color / Layout / Typography / Style
- **State 使用開發術語**:default / hover / active / disabled(不用 rest)

## 3. 色彩對照表

- Variant × State 矩陣
- 每格:渲染元件 + bg / text / border token 標註(含即時色塊)
- 標準 variant 與 danger variant 分開

## 4. 尺寸對照表

- Size token 對照表(每個 size 的所有 token 一覽)
- 含 iconOnly 等變體模式的覆寫說明
- 視覺預覽矩陣(Variant × Size,含變體模式)

## 5. 狀態行為

- 每個互動狀態的前後對照(如 loading spinner 替換規則)
- 所有 variant 的 disabled 渲染(含變體模式)
- 元件特有狀態(如 checked toggle)

## 設計規格品質規則

- **Token-first**:所有數值以 token name 為主(如 `h-field-sm`),resolved px 值為輔助灰字。開發者只需確認 token 正確——theme / density 的值解析由系統處理
- **不含 density 雙值**:不顯示 `28px (md) / 32px (lg)`,只顯示 token name + 當前 resolved 值
- **Dev 語言**:使用開發術語(default 不是 rest,用 Tailwind utility name 如 `px-3` `gap-1`)
- **藍圖完整性**:render 函式中**每一層**的 padding / margin / gap 都必須在藍圖中呈現——包括子元素的間距(如 label span 的 `px-1`),不可遺漏
- **範例驗證**:每個範例必須用 spec.md 的所有規則逐條驗證(如 badge 不應出現在 loading / disabled 狀態)
- **色塊即時渲染**:使用 `var()` 內聯樣式,確保切換 dark mode / density 時自動更新
- **資料正確性**:TOKEN_MAP / SIZE_SPECS 等資料必須與元件 `.tsx` 的 `cva()` 定義交叉比對,確認完全一致
- **值溯源完整性**:設計規格中出現的每個行為描述,必須追到 code 中的具體值。不可只描述行為模式而省略數值——包括 Provider 層級設定(如 `delayDuration`)、全域設定檔(`main.tsx`、`preview.tsx`)、CSS 變數定義檔。規則:**如果 code 裡有具體數字,設計規格就必須標出來**

## 連動更新規則

三份文件互為依賴,任一變動必須同步更新其他兩份:

| 異動來源 | 必須連動更新 |
|---------|-------------|
| **`.tsx` 元件程式碼**(variant / size / token / 內部結構) | → 設計規格(TOKEN_MAP、SIZE_SPECS、藍圖、Inspect 面板)<br>→ 展示(如有對應的 story) |
| **`.spec.md` 設計原則**(新增 / 修改 / 刪除規則) | → 設計原則 stories(do/don't 範例必須反映最新 spec)<br>→ 設計規格(範例驗證:確認規格中的範例不違反新規則) |
| **設計規格 story**(結構調整、新增對照維度) | → 展示(確保展示仍是規格的便利瀏覽版,不脫節) |

## 高風險漂移點:`cva()` defaultVariants

**`defaultVariants` 是三方(code / spec / story)最容易漂移的位置,改之前必須意識到四方聯動:**

| 改什麼 | 必須同步 |
|--------|---------|
| `cva()` 裡的 `defaultVariants.size`(或 variant / state) | 1. 元件 `.spec.md` 的 prop 表 / 預設標記<br>2. 元件 `.tsx` 頂端 docblock 的 `★ 預設` 標記<br>3. `{name}.anatomy.stories.tsx` 的 SIZE_SPECS 表 / default marker<br>4. 若屬 field-height family → `tokens/uiSize/uiSize.spec.md` 的 family 清單 |

**曾發生的 bug**:SegmentedControl 的 cva `defaultVariants.size` 是 `md`,spec.md + docblock + anatomy 都寫 `sm ★default`——三方不一致持續存在到 audit 才發現(2026-04-18 修正)。

**預防法**:改 `defaultVariants` 前,grep 該元件所有檔案(`grep "★\|預設\|default" src/design-system/components/{Name}/`),一次改完所有出現位置,不單改 code 就收工。
