# G6.1 typography, language and appearance acceptance

[English](G6_1_ACCEPTANCE.md) | [简体中文](G6_1_ACCEPTANCE.zh-CN.md)

2026-10-12 · [Issue #20](https://github.com/Btkkgo/OrdiBot/issues/20) · [PR #21](https://github.com/Btkkgo/OrdiBot/pull/21).

The verified local Mac release is built from `f5cb3fe`, with executable SHA-256 `d3fa54b4efb2639675b1ed4542d1556d9571fb8d5d11ec54b166be928f8fbee5`. The receipt, ad-hoc signature and exact application path were verified before native interaction. Subsequent documentation-only updates reuse this executable.

| Gate | Result | Evidence and limit |
| --- | --- | --- |
| Active UI language | PASS | Immediate Chinese → English → Chinese in actual Mac app; Chat, Context, History, Models, Settings and Agent copy inspected. Custom tray copy follows language in code; OS-owned menus follow platform localization. |
| Font scales | PASS | Actual Mac 90/100/110/120/130 selections and live preview. Default 14px system font; font/spacing scale together. Original pet dimensions and SVG artwork retained. |
| 130% layout | PASS | Actual Chinese and English Chat/Agent, Settings and Models; text wraps, controls remain legible, forms/task examples scroll. Native Agent evidence uses the empty workspace; populated task/approval copy is exercised by component fixtures, not a real provider task. |
| Accents/backgrounds | PASS | All five accents and three dark backgrounds selected in native app. All 15 palette combinations test normal/secondary text and button contrast ≥4.5:1, focus/border contrast ≥3:1. |
| Persistence/reset | PASS | Saved English/130/Blue/Midnight, quit and relaunched exact release; selections/theme restored. Reset then saved Chinese/100/Purple/Graphite. Existing config values, histories, docking and window dimensions compared equal to the pre-task private recovery copy. |
| Save failure | PASS | Native invalid HTTP endpoint rejected before saving; English error displayed and button never claimed Saved. Original URL restored; subsequent valid save passed. Actual component test also covers SETTINGS_WRITE_FAILED. No request was sent to that endpoint. |
| Edge/Chat/Agent regression | PASS | Edge click opens, Chat/Agent switch restores compact size, collapse retains head, relaunch remembers docking; English edge labels inspected. Existing rich-content acquisition adapters were unchanged. |
| Compatibility | PASS | Legacy Stored without new fields loads defaults and preserves nonempty conversation/task/geometry fixtures through persistence/reload; invalid new presets rejected. Credential namespace unchanged. |
| TypeScript | PASS | 99 tests: desktop 90 + contracts 9. Both dictionary keys/placeholders complete; raw user/provider content preserved. |
| Rust | PASS | 37 active-default-member tests, including three new compatibility/preset regressions. |
| Typecheck/build/signature | PASS | TypeScript typecheck, frontend build and verified native Mac release. |
| Review | PASS | Three Important state-ordering findings fixed: full-Config preview contamination, draft reset after native snapshot, stale Edge read overriding newer preview. Real DOM lifecycle/event-order regressions observed failing and then passing. No unresolved Critical/Important/Minor. |
| Windows CI | PASS | Independent [branch run](https://github.com/Btkkgo/OrdiBot/actions/runs/38236081002) and [PR run](https://github.com/Btkkgo/OrdiBot/actions/runs/38236236446) passed tests/typecheck/native NSIS build; installer downloaded. |
| Windows GUI/fonts/context | NOT VERIFIED | No interactive Windows desktop was exercised. CI compilation is separate evidence. |
| Live Chat/Vision/Remote Agent | NOT RUN / OWNER DEFERRED | Out of this round; production calls 0. No new Agent capability. |

No original OrdiBot store, OrdinConn backup, legacy credentials or independent robot project was deleted. New fields use existing serde defaults and atomic persistence. Screenshots below contain application UI only; no private desktop capture, key or user content was published. General tray/hotkey and window-title limitations remain tracked by Issue #17; this record does not close full V1 acceptance. New-binary screen-recording grant refresh was not exercised in G6.1; prior V1 capture evidence remains separate.

## Inspected native screenshots

![English settings at 130%, Blue and Midnight](assets/g6-1-settings-en-130.png)

![Chinese Chat at 130%](assets/g6-1-chat-zh-130.png)

![English Agent workspace at 130%](assets/g6-1-agent-en-130.png)
