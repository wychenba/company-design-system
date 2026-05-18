/**
 * Motion tokens — JS mirror of `motion.css` for Radix/JS API consumers.
 *
 * Radix primitive props(`delayDuration` / `openDelay` / `closeDelay`)期望 number ms,
 * 不認 CSS var。本 file 是 motion.css 對應 number value 鏡像;改值必同步兩處(或加 lint)。
 *
 * SSOT: `motion.css` + `motion.spec.md`。
 */

/** 純文字提示(Tooltip)— passive hint */
export const HOVER_DELAY_PLAIN_MS = 200

/** 內容預覽(HoverCard / NameCard)— rich preview */
export const HOVER_DELAY_RICH_MS = 300

/** 通用關閉延遲(所有 hover overlay)— accidental-hover 容錯 */
export const HOVER_DELAY_CLOSE_MS = 200
