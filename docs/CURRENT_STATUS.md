# OrdiBot current status

[English](CURRENT_STATUS.md) | [简体中文](CURRENT_STATUS.zh-CN.md)

Updated 2026-10-12 · [Issue #17](https://github.com/Btkkgo/OrdiBot/issues/17) · local G1–G5 delivery; **NEEDS_VALIDATION** for complete V1.

## Implemented

Four surfaces (Hidden, Edge, Chat, Agent), left/right docking and remembered vertical position, optional metadata-only reminders with throttle/dedup/filter, compact dark Chat with an original small character, expanded Agent workspace in one runtime, model/preferences form, deliberate clipboard/app/screenshot attachments, local history, streaming Model Gateway and hosted OpenAI Agent adapter. Financial collectors, trading and Android runtime are excluded from the active default application. Legacy assets/data are retained separately.

## Verified

- **PASS:** all-ref recovery bundle, original untracked archive, SQLite backup/integrity and logical equality; original untracked file hashes preserved.
- **PASS:** 89 TypeScript tests, 34 Rust tests (active default members), TypeScript typecheck, frontend/native build, public security and whitespace gates. Independent code review found two retry/filter defects; both regressions failed before the fix and passed afterward; follow-up review approved the fixes.
- **PASS:** actual macOS release launch; Edge startup/click expansion; Chat/Agent switch and restored Chat dimensions; Chat and Edge dragging; left/right docking, vertical position and preference persistence across restart; explicit clipboard attachment/removal; actual foreground app metadata; actual reminder-click metadata attachment; screenshot preview, cancellation without attachment, confirmed attachment and removal on the previous `68a4f86` release after its screen-recording grant was refreshed. Missing model configuration produces an honest error without a fake reply.
- **PASS:** same GitHub repository renamed to [Btkkgo/OrdiBot](https://github.com/Btkkgo/OrdiBot): identity `R_kgDOUib6fw`, 139 stars and all remote Git refs unchanged at rename. Main's five divergent commits are preserved through a controlled local merge; [PR #18](https://github.com/Btkkgo/OrdiBot/pull/18) is merged and public main includes `68a4f86`. The separate physical robot project is untouched.
- **PASS:** independent Windows CI at `68a4f86` ran 89 TypeScript / 34 Rust tests and uploaded a native NSIS installer. Fresh renamed-checkout runs passed after cache isolation was fixed, including [main run 38207262944](https://github.com/Btkkgo/OrdiBot/actions/runs/38207262944). Compilation is distinct from GUI acceptance.
- Production Chat/remote requests during implementation: **0**.

## Supplemental edge-entry revision

- **PASS:** the edge entry now shows a cropped head, while expanded Chat retains the full original character at the remembered vertical ratio. Native left/right expansion, collapse back to a head, and reminder-click metadata attachment with editable input were exercised on the revised release.
- A persistent card above the composer identifies the accepted app/title separately from passive latest metadata and offers explicit text/screenshot attachment. It disappears after rich content is attached. Independent review caught its initial placement above long history; moving it outside the history scroller resolved the finding.
- **PASS:** 89 TypeScript tests, typecheck, frontend and signed native builds. Native adapters and the previously verified 34 Rust tests are unchanged. Fresh Windows CI and the current binary screen-recording grant still require revalidation. Production requests remain 0.

## Partial

macOS passive awareness obtained real app names; window titles were unavailable in observed runs and degrade to app-only metadata. Reminder throttle/filter/dedup and metadata attachment boundaries have regression/source coverage; tray menu and global shortcut restoration are **NOT VERIFIED**. CUA synthetic shortcut attempts did not reopen Chat; no specific native cause was established, and Edge-click restore works. Windows GUI/context acceptance is **NOT RUN**. English UI localization is deferred.

## Blocked

Real Chat, multi-turn, cancellation/error, screenshot vision and hosted Agent service acceptance are **NOT RUN / OWNER DEFERRED**, pending credentials and account capabilities configured locally. Code/fixture tests do not prove live provider access. No key should be sent through public records or chat.

## Designed

Only documented hosted-computer task APIs qualify as native Agent integration. Meta Muse and Grok Bot remain external entries with no verified native task contract. No pause, invented timeline or fabricated task result is shown.

## Planned

Address remaining native restoration and Windows 11 interactive gates with real platform evidence. The original main migration is complete. The supplemental UI revision is locally verified; its release receipt and fresh Windows CI are being finalized.

## Not Started

Windows 11 interactive/context/API tests and live production provider acceptance. Commercial signing/notarization, a roaming pet, financial product and local autonomous computer engine are out of scope.

## Next

Use the local companion and configure keys in Models only when ready for real API acceptance. See [baseline](PRODUCT_BASELINE.md), [migration](ordibot/MIGRATION.md), [provider evidence](ordibot/PROVIDERS.md) and [roadmap](open-source/ROADMAP.md). Issue #17 remains open for the unverified gates.
