# Codex hand-off context — drag × virtual scroll empty body

## User-reported symptom
Story `RowDragWithVirtualization`(200 rows + virtualization + enableRowDrag)— body shows 0 rows on initial mount. Headers visible, body empty white space.

User reports this happens in dev mode storybook. Build mode storybook works fine(verified by playwright headless: 18 rows mount initially, scroll-to-100/200/300 keeps 23 rows mounted).

## Files
- `src/design-system/components/DataTable/data-table.tsx`: main impl, contains DragOverlay + useVirtualizer + sortable
- `scripts/debug-drag-scroll-deep.mjs`: regression test that passes against build mode
- `src/design-system/components/DataTable/data-table.stories.tsx`: `RowDragWithVirtualization` story line ~1310

## Recent changes(commit `d125e10`, v10 DragOverlay refactor)
- Retired `stickyRangeExtractor`(was: pin active drag idx ±50 via tanstack rangeExtractor)
- Added `<DragOverlay>` portal rendering cloned outerHTML of source row
- Source row `isDragging ? opacity:0` (was 0.5)
- Reduced `effectiveOverscan` from `Math.max(overscan, 10)` to `Math.max(overscan, 5)`

## Hypothesis
Dev mode + Vite HMR: when state changes during drag(activeDragId / dragOverlayHtml setState), measureElement / virtualizer.measure() race with sortable transform recompute. Build mode lazy production code-split avoids the race.

## What to verify
1. Run `npm run storybook` (dev mode), navigate to story, capture exact DOM state
2. Console errors? React strict mode double-invoke?
3. measureElement not firing because activeDragId state mounted first → virtualizer disabled?
4. virtualizer `enabled: useVirtual` flag — `useVirtual = hasHeightConstraint && !isEmpty` — `isEmpty` = rows.length === 0. Does state ever transition to isEmpty=true during initial render?

## Repro hint
User report from session msg before commit `e498217`. Screenshot in user message shows storybook UI with empty body. Build verification at `e498217` commit shows passing.

## Mitigation considered but not committed
- Add fallback `if (rows.length > 0 && mountedCount === 0) virtualizer.measure()` post-mount effect
- Replace dangerouslySetInnerHTML with React component snapshot

## Related issue trail
- @dnd-kit/core 6.3.1
- @tanstack/react-virtual ~3.x
- Vite + React 18 + Storybook 8

Hand-off: please reproduce in dev mode + isolate root cause. We've burned 10+ iterations on this.
