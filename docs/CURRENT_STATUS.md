# OrdiBot current status

[English](CURRENT_STATUS.md) | [简体中文](CURRENT_STATUS.zh-CN.md)

Updated 2026-10-12 · [Issue #17](https://github.com/Btkkgo/OrdiBot/issues/17) · stage G1/local capabilities implemented; **NEEDS_VALIDATION** for complete V1.

## Implemented

Four surfaces (Hidden, Edge, Chat, Agent), left/right docking and remembered vertical position, metadata-only optional reminders with throttle/dedup/filter, and compact dark Chat with an original small character, narrow navigation, expanded Agent workspace in the same process, model/preferences form, deliberate clipboard/app/screenshot attachments, local history, streaming Model Gateway and hosted OpenAI Agent adapter. Financial collectors, trading and Android runtime are excluded from the active default application. Legacy assets/data are retained separately.

## Verified

- **PASS:** verified all-ref recovery bundle, archived original untracked work, SQLite backup/integrity and logical equality; original untracked file hashes preserved.
- **PASS:** 89 TypeScript tests, 33 Rust tests (active default members), TypeScript typecheck, frontend build, public security gate and diff whitespace checks.
- **PASS:** actual macOS release app launch, compact/expanded mode switch and restored Chat dimensions, explicit clipboard attachment/removal, foreground Chrome metadata, unconfigured-model error without fake reply. Two local ad-hoc bundles were verified; final native interaction checks are in progress.
- Production Chat/remote requests during implementation: **0**.

## Partial

Native drag, screenshot preview/confirmation, tray/hotkey restore, preference persistence and final executable receipt need final interaction checks. First independent Windows run passed 89 TypeScript and 30 Rust tests and produced the native executable/NSIS installer, but failed the final source-change guard. Diagnosis/retry is pending. Windows GUI/context acceptance is **NOT RUN**. English UI localization is deferred.

## Blocked

Real Chat, multi-turn, cancel/error, screenshot vision and hosted Agent service acceptance are **NOT RUN / OWNER DEFERRED**, pending credentials and account capabilities configured locally. Code/fixture tests do not prove live provider access. No key should be sent through public records or chat.

## Designed

Only documented hosted-computer task APIs qualify as native Agent integration. Meta Muse and Grok Bot remain external entries with no verified native task contract. No pause or invented timeline is shown.

## Planned

Finish native Mac interactions, run independent Windows compilation, preserve main's divergent commits, and rename the same GitHub repository after validating scoped public changes.

## Not Started

Windows 11 interactive/context/API tests and live production provider acceptance. Commercial signing/notarization, standalone pet, financial product and local autonomous computer engine are out of scope.

## Next

Complete the local delivery and record independent gates. The owner configures keys in Models before real API acceptance resumes. See [baseline](PRODUCT_BASELINE.md), [migration](ordibot/MIGRATION.md), [provider evidence](ordibot/PROVIDERS.md) and [roadmap](open-source/ROADMAP.md).
