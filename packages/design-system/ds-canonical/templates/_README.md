// AUTO-GENERATED canonical reference from product-workspace/apps/template/src/App.tsx
# DS canonical templates

This directory ships **canonical app templates** for consumer apps to mirror.
Per user 2026-05-27「ds repo push main → PW template 永遠 latest」directive.

## Files

- `dashboard-app.tsx` — AppShell + Sidebar + DashboardPage canonical full composition
  (aligned with `sidebar.stories.tsx#IconCollapse` + `header-canonical.spec.md:57-72`)

## Sync mechanism

DS bump → `ssot-sync-dispatch.yml` dispatch → PW `sync-design-system.yml` 收 event:
1. `npm update` design-system + storybook-config(既有)
2. **NEW**: pull `node_modules/@qijenchen/design-system/ds-canonical/templates/dashboard-app.tsx`
   diff against PW `apps/template/src/App.tsx`
3. If drift → auto-create PR(NOT direct push to main — user review)

Fork users 從 PW main fork → 取到當下最新 canonical baseline。Fork 後 diverge customization 是 fork user 自己責任。

## SSOT chain
DS canonical(此 file)→ npm pkg ship → PW sync auto-PR → fork user fork 取 latest.
