/**
 * Overlay geometry SSOT — Radix prop number constants(non-CSS-var,JS-side single source).
 *
 * Why JS const not CSS var:Radix `sideOffset` / `collisionPadding` 接 number prop,
 * 不接 `var(--...)`。改值要動 5+ primitive default = 假 SSOT。本檔抽 const,
 * primitive default 統一 import → 改值只動一處全部聯動。
 *
 * Canonical source:`elevation.spec.md` § 浮層間距 sideOffset。
 */

export const OVERLAY_SIDE_OFFSET = 8

export const OVERLAY_COLLISION_PADDING = 8
