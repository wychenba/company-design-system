/**
 * Motion tokens — JS mirror of `motion.css` for Radix/JS API consumers.
 *
 * Radix primitive props(`delayDuration` / `openDelay` / `closeDelay`)期望 number ms,
 * 不認 CSS var。本 file 是 motion.css 對應 number value 鏡像;改值必同步兩處(或加 lint)。
 *
 * SSOT: `motion.css` + `motion.spec.md`。
 */

/** 純文字提示(Tooltip)— passive hint。2026-05-20 200→500ms 對齊 Material 3 / Apple HIG / shadcn-Radix 主流 */
export const HOVER_DELAY_PLAIN_MS = 500

/** 內容預覽(HoverCard / ProfileCard)— rich preview。2026-05-20 300→700ms 避免列表掃視誤觸發 fetch */
export const HOVER_DELAY_RICH_MS = 700

/** 通用關閉延遲(所有 hover overlay)— accidental-hover 容錯 */
export const HOVER_DELAY_CLOSE_MS = 200
