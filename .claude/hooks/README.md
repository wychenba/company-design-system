# .claude/hooks/ Charter

## 這裡只收:pre/post tool event 的機械化自動檢查

每個 hook 是一個 shell / python script,在 Claude Code tool event 上自動觸發:
- **PreToolUse**:tool 執行前(可 block 或 inject context)
- **PostToolUse**:tool 執行後(通常 inject 提醒 / warning)

**核心特徵**:**不依賴 AI 自律**,tool 層強制執行;規則可用 `grep` / 條件判斷自動驗證。

## 當前居民(33 hooks,2026-04-25)

**元件 tsx / spec write-time 檢查(10)**:
| Hook | Event | 做什麼 |
|------|-------|--------|
| `pre_edit_spec_check.sh` | PreToolUse Edit/Write/MultiEdit | 編輯元件 tsx 前提醒讀對應 spec |
| `pre_new_component_spec.sh` | PreToolUse Write | 建新 component spec.md 強制 Layout Family 宣告 |
| `check_sync_update.sh` | PostToolUse | 改 spec.md 後提醒連動更新 stories |
| `check_token_hygiene.sh` | PostToolUse | grep 硬寫 shadow / shadcn compat alias / overflow raw class |
| `check_cva_default_sync.sh` | PostToolUse | 動到 cva defaultVariants 時 3 方同步警告 |
| `check_anatomy_section_numbering.sh` | PostToolUse | anatomy stories 編號 contiguous 驗證 |
| `check_sideoffset_canonical.sh` | PostToolUse | overlay `sideOffset` 非 8 警告 |
| `check_story_anatomy.sh` | PreToolUse Edit/Write/MultiEdit | **BLOCKS** stories 繞 DS canonical hand-craft |
| `check_third_party_dom_verified.sh` | PreToolUse | 3rd-party lib 用 data-* selector 前提醒驗 DOM |
| `check_spec_iteration_tag.sh` | PostToolUse | spec iteration tag 格式驗證 |

**DS 一致性(4)**:
| `check_ssot_consultation.sh` | PreToolUse Write 新 tsx | 新元件 tsx 開頭必含 SSOT 消費 註解區 |
| `check_avatar_hovercard.sh` | PostToolUse | Avatar hover 必含 NameCard canonical |
| `check_item_list_gap.sh` | PostToolUse | 連續 item list wrapper gap 正確性 |
| `check_container_breathing.sh` | PostToolUse | 自建視覺容器必有 inner padding |
| `check_item_content_primitive.sh` | PostToolUse | 用 `<ItemContent>` 替代手刻 label+desc 結構 |
| `enforce_home_charter.sh` | PreToolUse Write 新 subdir / flat file | classification-sensitive dir charter gate |
| `block_prototype_imports.py` | PostToolUse | 產品 code 禁止 import `explorations/` |

**Governance 治理 anti-bloat(4)**:
| `check_file_size_budget.sh` | PreToolUse Edit/Write | CLAUDE.md/spec/SKILL/memory 行數預算警告 |
| `pre_write_subsumption_check.sh` | PreToolUse Write 新檔 | governance file 新建前 duplicate 警告 |
| `check_governance_compliance.sh` | PreToolUse Write | 新 skill/hook/rule 前跑 7 題 M7 self-check |
| `log_governance_fires.sh` | PostToolUse Write/Edit | 治理檔 fire log 寫入 .claude/logs/ |

**Story auto-compile(1)**:
| `check_story_compile_drift.sh` | PreToolUse Edit/Write | 改元件 tsx/spec 自動跑 compile-stories --check |

**Stop / SessionStart(3)**:
| `stop_tsc_sanity.sh` | Stop | turn 動到 .ts/.tsx 時跑 `tsc -b` 檢查 |
| `stop_harvest_corrections.sh` | Stop | 掃 session 的 user 糾正信號寫 .claude/logs/ |
| `session_start_governance_check.sh` | SessionStart | 4 check(行數 / prune / corrections / benchmarks 過期 auto-fetch) |

## Task ↔ Hook 對照表(世界級設計任務觸發)

| 任務檔案事件 | 觸發的 hook | 效果 |
|------------|-----------|------|
| 建新 component spec.md | `pre_new_component_spec.sh` + `enforce_home_charter.sh` | Layout Family 必宣告 + charter gate(新 subdir 情況) |
| 改 cva `defaultVariants` | `check_cva_default_sync.sh` + `pre_edit_spec_check.sh` | 三方同步提醒 + spec 讀取提醒 |
| 建新 pattern / skill subdir / tokens subdir | `enforce_home_charter.sh` | 強制看對應 charter README,通過三題 verification |
| 建 hooks/commands/agents 新檔 | `enforce_home_charter.sh`(豁免 flat) | 靜默通過(flat 是慣例) |
| 編輯元件 .tsx | `pre_edit_spec_check.sh`(讀 spec)+ `check_cva_default_sync.sh`(若動 defaults) | |
| Write/Edit spec.md | `check_sync_update.sh` | 連動 stories 更新提醒 |
| Write/Edit 任何 .tsx/.spec.md | `check_token_hygiene.sh` | 硬寫 shadow / shadcn alias / raw overflow 抓違規 |
| Write/Edit 產品 code(非 explorations) | `block_prototype_imports.py` | 擋 `import ... explorations/` |
| Write/Edit *.stories.tsx | `check_story_anatomy.sh` | stories hand-craft 繞 DS 被 exit 2 block;allowlist `// @anatomy-exempt:`(檔首全檔)/ `// @anatomy-exempt-next`(下一行) |

## 這裡**不收**(反例)

| 疑似要放這但其實不是 | 實際應去 | 為什麼 |
|-------------------|---------|--------|
| 需要 AI 走流程才能判斷的規則 | `.claude/skills/` | hook 只能機械判斷,複雜 workflow 屬 skill |
| 每 session signal rule | `CLAUDE.md` | hook 是 tool-level,不是 session-level |
| 單一元件的 lint rule | 該元件 spec + code | hook 是跨元件系統級,單元件屬 spec |

## 新 hook 的 criteria(必須全部通過)

1. **規則可機械判斷**(grep / 條件邏輯,不需人類 judgment)
2. **觸發 event 清楚**(PreToolUse / PostToolUse + matcher)
3. **已有明確 tech debt 或 bug class**(不做預防性空守衛)
4. **失敗模式安全**(hook 掛掉不會 block 合法操作 / 誤殺)

## 接線到 settings.json

新 hook 必須在 `.claude/settings.json` 的 `hooks.PreToolUse` 或 `hooks.PostToolUse` 陣列註冊,並用 `$CLAUDE_PROJECT_DIR` 作為路徑前綴。範例:

```json
{
  "type": "command",
  "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/your-hook.sh\""
}
```

## Hook 退出碼約定(Claude Code 協議)

- `exit 0` — 正常,不 inject context
- `exit 2` + stderr — **blocking**,AI 看到 stderr 訊息後必須處理
- `stdout` with `{"hookSpecificOutput":{"hookEventName":"...","additionalContext":"..."}}` — non-blocking context injection

## 建立前必 Read

本 README + 最接近的既有 hook 當範本 + CLAUDE.md `# 規則分層` 的 Hook 章節。
