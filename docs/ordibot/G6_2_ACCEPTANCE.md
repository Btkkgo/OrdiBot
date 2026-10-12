# G6.2 V1 validation and hardening

[English](G6_2_ACCEPTANCE.md) | [简体中文](G6_2_ACCEPTANCE.zh-CN.md)

2026-10-12 · [#22](https://github.com/Btkkgo/OrdiBot/issues/22) · parent [#17](https://github.com/Btkkgo/OrdiBot/issues/17) remains open. Base: main `061d217`. This is a validation task, not full V1 acceptance.

## Result vocabulary

PASS: observed gate succeeds. FAIL: executed gate does not meet criteria. NOT VERIFIED: attempted or source evidence exists, but acceptance is unproven. NOT RUN: not executed. OWNER DEFERRED: explicitly excluded by the owner; execution remains NOT RUN. Automated component/CI evidence is separate from native and live-provider evidence.

## Mac matrix (in progress)

| Gate | Result | Evidence / limit |
| --- | --- | --- |
| Exact G6.1 process/receipt/signature | PASS | Running release matches `f5cb3fe` receipt and executable d3fa54b4…; ad-hoc verification succeeds. |
| Edge click / collapse | PASS | Actual native head opens Chat; collapse retains head. |
| Tray menu | NOT VERIFIED | Tool cannot access SystemUIServer; owner interaction requested. |
| Global shortcut | NOT VERIFIED | Settings indicates successful registration. Synthetic Cmd+Shift+Space on OrdiBot and Finder did not visibly restore; physical input requested. No confirmed code root cause. |
| Window close/minimize/Agent/restart restoration | NOT VERIFIED | Native Window menu inspected; complete restoration sequence pending. |
| Current-binary screenshot preview/cancel/confirm/remove | NOT VERIFIED | Capture returned cancellation/permission error and no attachment. Owner OS authorization refresh required. Previous V1 binary acceptance is historical. |
| Tests/typecheck | PASS | Fresh 99 TypeScript / 37 Rust and typecheck. |
| Mac release rebuild | NOT RUN | Pending final native build and executable receipt. |

## Windows matrix

| Gate | Result | Evidence / limit |
| --- | --- | --- |
| Real Windows 11 GUI availability | NOT RUN | Current computer surface is macOS; no running/installed Windows VM runtime found. No remote Windows GUI was supplied. |
| Chinese/English, five fonts, 15 palette combinations | NOT RUN | Requires real Windows GUI; existing Mac/test results are not substituted. |
| Chat/Agent/Settings, Edge docking/context | NOT RUN | Requires real Windows GUI; no simulated acceptance. |
| Fresh independent Windows CI native installer | NOT RUN | Pending branch workflow dispatch; build result will be recorded separately. |

## Provider matrix

| Gate | Execution | Decision |
| --- | --- | --- |
| Real Chat / streaming / cancel / error | NOT RUN | OWNER DEFERRED |
| Vision / screenshot model response | NOT RUN | OWNER DEFERRED |
| Remote Agent submission / status / approvals / result | NOT RUN | OWNER DEFERRED |

No production credentials are read or used; production Provider calls: 0. No new Agent capability. Original database/backups/secure credentials and separate robot project are preserved. Private store backup is local-only. G6.1 acceptance remains separately documented.
