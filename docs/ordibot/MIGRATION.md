# OrdiBot migration audit

[English](MIGRATION.md) | [简体中文](MIGRATION.zh-CN.md)

The approved OrdiBot V1 request supersedes the historical financial/mobile product baseline. Work starts from the existing desktop branch; no substitute repository is created. Before changes, all Git refs were saved in a verified bundle, untracked files archived, and the legacy SQLite database snapshotted through SQLite's backup API with an `integrity_check` result of `ok`. Recovery archives remain private, outside Git.

| Decision | Assets | Treatment |
| --- | --- | --- |
| KEEP | Git history, main, desktop branch, private SQLite, settings, Keychain, separate physical robot project | Preserve; never rewrite or delete |
| REFACTOR | Tauri entry, React UI, Model Gateway, native credentials, typed IPC | Compact companion and one expandable Agent workspace |
| RETIRE from active app | financial UI, collectors, trading/approval runtime, Android/local autonomous runtime, demo seeding | No startup, imports or native dependencies in the new desktop entry; sources remain recoverable |

At the fetched baseline, `main` had 5 exclusive commits and `codex/realtime-workbench` had 15. The physical robot checkout has a separate `OddBot` remote and is outside this migration.

The new bundle identifier is `ai.ordibot.desktop`. Its local `ordibot-v1.json` store and credential service are separate from `ai.ordinconn.desktop`. Legacy data is explicitly preserved, not silently migrated or overwritten. This initial companion does not import financial records or old provider credentials automatically; configure a new provider locally. Clipboard text is read only after a click. Screenshots are previewed and explicitly confirmed; image pixels remain in memory and are excluded from persisted history. Only optional app/window metadata awareness runs; no deep-content monitor or local autonomous computer engine starts.

The new build wrapper verifies an ad-hoc local OrdiBot bundle and records source/executable fingerprints. Historical OrdinConn frozen bundles and their receipts are preserved and are never deleted by this wrapper. Launch the new OrdiBot bundle, not a historical OrdinConn app. The same latest OrdiBot output is used for subsequent builds.
