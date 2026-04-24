# .claude/benchmarks/

External signal store for `/knowledge-prune` Phase 0.5 + `/design-system-audit` world-class checks.

## Contents

| File | Purpose | Refresh cadence |
|------|---------|----------------|
| `claude-code-features.jsonl` | Claude Code release notes / new features | Monthly |
| `external-ds-snapshots/*.md` | Polaris / Material / Atlassian / Ant / Carbon changelog highlights | Monthly |
| `last-fetch.txt` | Timestamp of last successful fetch | Updated by `fetch.sh` |

## Refresh

Run `bash .claude/benchmarks/fetch.sh` manually OR let `session_start_governance_check.sh` remind when > 30 days stale.

`fetch.sh` is **fail-silent**: network errors don't block, only updates `last-fetch.txt` on success. `last-failure.txt` records last error for later diagnosis.

## Why

Session memory forgets. World-class DS ship changes we should track (new Material 3 tokens, Polaris v13 breaking changes, Claude Code 9.0 feature). Without a local store + refresh cadence, we drift.

Per CLAUDE.md `# 資訊治理 canonical` → external signal driving internal governance.
