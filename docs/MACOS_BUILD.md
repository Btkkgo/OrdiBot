# OrdiBot local desktop builds

[English](MACOS_BUILD.md) | [简体中文](MACOS_BUILD.zh-CN.md)

Use `npm run desktop:build` from the repository root. `-- --debug` selects a debug build; otherwise the output is release. The wrapper uses the current OrdiBot configuration, rejects source changes during the build, verifies the native executable and local ad-hoc signature, registers the app, and stores source/executable receipts in ignored `target/ordibot-build-receipts/`.

Launch `target/release/bundle/macos/OrdiBot.app` for the release build. Quit an already running OrdiBot before rebuilding/reopening; a running process can retain the older executable after its bundle is replaced. Match the active process path and latest receipt before acceptance. Subsequent release builds replace this same output rather than creating extra OrdiBot app copies.

No Apple Developer certificate, Team ID, hardened-runtime distribution, notarization, stapling or App Store preparation is required. Historical OrdinConn bundles/frozen receipts, source, private data and Keychain are preserved. The new wrapper does not perform legacy cleanup. The new identifier is `ai.ordibot.desktop`; configure model keys locally instead of silently importing old credentials.

On Windows, platform config selects NSIS and the original OrdiBot `.ico`. The independent Windows CI runs tests and the native debug installer build. Compilation does not verify Windows GUI/context/API behavior.

Local ad-hoc signing can change the executable code requirement after a rebuild. A screen-recording toggle may remain enabled while macOS rejects the replacement executable against an older grant. In that observed case, quit OrdiBot, remove only its stale Screen & System Audio Recording entry, add the current verified `OrdiBot.app`, enable it and reopen. Verify an actual screenshot preview; the toggle alone is insufficient evidence. Do not reset unrelated application permissions.
