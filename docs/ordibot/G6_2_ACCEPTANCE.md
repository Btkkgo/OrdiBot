# G6.2 V1 validation and hardening

[English](G6_2_ACCEPTANCE.md) | [简体中文](G6_2_ACCEPTANCE.zh-CN.md)

2026-10-12 · [#22](https://github.com/Btkkgo/OrdiBot/issues/22) · parent [#17](https://github.com/Btkkgo/OrdiBot/issues/17) remains open. Base: main `061d217`. This is a validation task, not full V1 acceptance.

## Result vocabulary

PASS: observed gate succeeds. FAIL: executed gate does not meet criteria. NOT VERIFIED: attempted or source evidence exists, but acceptance is unproven. NOT RUN: not executed. OWNER DEFERRED: explicitly excluded by the owner; execution remains NOT RUN. Automated component/CI evidence is separate from native and live-provider evidence.

## Mac matrix

| Gate | Result | Evidence / limit |
| --- | --- | --- |
| Exact G6.1 process/receipt/signature | PASS | Fresh G6.2 release receipt is `350d2ca`; executable SHA-256 `d3fa54b4efb2639675b1ed4542d1556d9571fb8d5d11ec54b166be928f8fbee5` equals G6.1. Old process exited before rebuilding; exact current bundle was relaunched. Ad-hoc verification succeeds. |
| Edge click / collapse | PASS | Actual native head opens Chat; collapse retains head. |
| Tray Hide/Open, Agent/Edge | PASS | Owner physically operated the current app and confirmed all actions successful. This is owner-operated/reported evidence; the tool cannot access SystemUIServer. |
| Global shortcut from Edge | PASS | Settings confirms registration; owner physically pressed Cmd+Shift+Space and reported successful restoration. Synthetic tool injection did not trigger it; no application defect was established. |
| Agent/Chat and restart restoration | PASS | Fresh restart retains Edge and original preferences; actual Chat 586×951 → Agent 1180×820 → Chat 586×951. Screenshots and private-store comparison match. |
| Native Window Close/Minimize restoration | NOT VERIFIED | Tool menu attempts did not visibly change surface; owner physical confirmation requested. Separate from collapse/Edge/tray restoration. |
| Current-binary screenshot preview/cancel/confirm/remove | PASS | Initial capture failed against a stale OS grant. Only old OrdiBot grant was removed; owner added/enabled the exact verified bundle and reopened it. Actual preview appeared; Cancel left no attachment; Confirm added a screenshot; Remove cleared it. No message sent. Captured pixels were not published or sent to a Provider. |
| Tests/typecheck | PASS | Fresh 99 TypeScript / 37 Rust and typecheck. |
| Mac release rebuild | PASS | `npm run desktop:build` passed frontend/typecheck, release build, source receipt and local signing checks. Runtime code unchanged. |
| Data/config preservation | PASS | Every config value, conversation/task record and stored Chat width/height equals the private pre-task copy. Secure credential namespace unchanged; no credential read. |

## Windows matrix

| Gate | Result | Evidence / limit |
| --- | --- | --- |
| Real Windows 11 GUI availability | NOT RUN | Current computer surface is macOS; no running/installed Windows VM runtime found. No remote Windows GUI was supplied. |
| Chinese/English, five fonts, 15 palette combinations | NOT RUN | Requires real Windows GUI; existing Mac/test results are not substituted. |
| Chat/Agent/Settings, Edge docking/context | NOT RUN | Requires real Windows GUI; no simulated acceptance. |
| Fresh independent Windows CI native installer | PASS | [Workflow dispatch 38257016271](https://github.com/Btkkgo/OrdiBot/actions/runs/38257016271), commit `350d2ca`: npm tests/typecheck, cargo tests and NSIS packaging/upload succeed. Installer downloaded. No GUI claim. |

## Provider matrix

| Gate | Execution | Decision |
| --- | --- | --- |
| Real Chat / streaming / cancel / error | NOT RUN | OWNER DEFERRED |
| Vision / screenshot model response | NOT RUN | OWNER DEFERRED |
| Remote Agent submission / status / approvals / result | NOT RUN | OWNER DEFERRED |

No production credentials are read or used; production Provider calls: 0. No new Agent capability. Original database/backups/secure credentials and separate robot project are preserved. Private store backup is local-only. G6.1 acceptance remains separately documented.

## Hardening result and remaining V1 gates

No reproduced runtime-code defect was established; no product code, dependency, Agent feature or accepted G6.1 behavior was changed. The necessary local repair was refreshing only the existing OrdiBot recording grant through System Settings with owner participation; no bypass or unrelated permission reset.

Parent #17 remains NEEDS_VALIDATION and open: real Windows 11 GUI/context, live Provider acceptance, foreground window-title availability (observed app-only degradation), and physical native Close/Minimize confirmation remain distinct gates. Menu/shortcut results rely on owner operation and report, not synthetic-tool success. New-binary screenshot acceptance is now verified; older V1 evidence remains historical.

## Native application-only screenshots

![Restored default Chinese Chat](assets/g6-2-chat-restored.jpg)

![Default Chinese Agent workspace](assets/g6-2-agent.jpg)
