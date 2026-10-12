# OrdiBot architecture

[English](ARCHITECTURE.md) | [简体中文](ARCHITECTURE.zh-CN.md)

One Tauri v2 process owns one transparent native window. React's `CompanionApp` renders compact Chat or expanded Agent; the original SVG character is part of the same Chat container. Typed IPC commands and a Tauri Channel separate UI from credentials, platform acquisition, model transport and persistence.

```text
React CompanionApp / AgentWorkspace
  -> typed Tauri commands + Chat Channel
  -> companion_store (atomic local JSON; system credential store)
  -> companion_platform (explicit clipboard / foreground metadata / screenshot)
  -> companion_commands -> existing Model Gateway -> OpenAI-compatible stream
  -> companion_remote -> OpenAI hosted Agents sessions / turns / items
```

Screenshots require preview confirmation, are tied to their actual user message, and are not serialized to history. Restored screenshot history explicitly tells the model that old image pixels are unavailable. Copied text/app metadata are labeled as acquired source material. The stream decoder preserves split UTF-8 and requires the provider's completion marker; connection loss cannot fabricate successful completion.

Remote tasks use a separate key and history. The adapter polls provider session, root turn and paginated item records, supports fresh-state origin approval and cancellation, and exposes unsupported sign-in/tool requests. Session idle is not task completion. An ambiguous submission is stored without automatic retries; cloud environment release is explicit.

New state lives under `ai.ordibot.desktop`; legacy `ai.ordinconn.desktop` data and keys are preserved and not auto-imported. JSON writes are atomic, private on Unix, and corrupt files fail without being overwritten. No new cloud backend is introduced. Main UI does not start financial collectors, old Agent/Tool runtime, Android automation, or demo seeding. Cargo default members are Model Gateway and the new desktop package; legacy crates/sources remain in history and on disk.

macOS adapters use the native clipboard, explicit System Events metadata and interactive screenshot acquisition. Missing permissions remain visible; no permission is silently granted. Windows adapters isolate foreground/screenshot calls and native credential storage. Native Windows CI proves compilation only; desktop interaction requires Windows 11 acceptance.

Configuration stores endpoint/model/vision/output/style/pin preferences, never credentials. Key presence is exposed as a boolean. Model errors are normalized without exposing secrets. No attached text can override the user's question or app system policy. See [provider evidence](ordibot/PROVIDERS.md), [migration](ordibot/MIGRATION.md) and [status](CURRENT_STATUS.md).

The supplemental edge interaction uses two coordinated webview surfaces in the same Tauri process, state store and provider runtime: one expandable main window and a tiny non-focusing edge window. The character is part of Chat when expanded. The edge surface remembers side/vertical ratio across displays; pointer-captured drag snaps on release. Tray actions distinguish Edge and Hidden.

A metadata-only native loop runs every three seconds when reminders are enabled and the app is not Hidden. App/title pairs are ephemeral until the owner explicitly attaches them. Reminders are deduplicated and throttled at 20 seconds, expire after 10 seconds, never force open Chat, and never invoke clipboard, screenshot or provider code. A browser/editor-only option filters reminders. Clicking carries only actual app/title metadata into Chat; it does not grant access to page/code/document body.
