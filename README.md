# OrdiBot

[English](README.md) | [简体中文](README.zh-CN.md)

**Your Desktop AI Companion** — a compact desktop context assistant and an expandable workspace for hosted computer Agents. This is the original OrdinConn repository, renamed without replacing its Git history.

OrdiBot uses Tauri v2, Rust, React and TypeScript. The dark floating Chat window has a narrow navigation rail, a small original 2D character, and one runtime shared with the larger Agent workspace. Financial dashboards, collectors, trading and Android automation are retired from the active desktop application; their historical assets remain recoverable.

- **Chat:** owner-configured OpenAI-compatible endpoint through Model Gateway; multi-turn text, streaming, cancellation, bounded responses and explicit errors. No credential-free demo answers.
- **Context:** attach copied text on demand, actively acquire foreground app/window metadata, or capture and confirm a screenshot. No background screen, keyboard or clipboard monitoring. Vision must be enabled for screenshot requests.
- **Agent:** an OpenAI hosted Agents API adapter with provider-driven task history, records, results, origin approvals and cancellation. Meta Muse and Grok Bot are clearly marked external entries, with no verified native task API integration.
- **Local controls:** floating window, pin preference, mode/geometry restore, tray/menu entry and Command/Ctrl + Shift + Space when registration succeeds.

The current interface is Simplified Chinese. English UI localization is deferred. The owner has deferred production API acceptance until credentials are configured locally. Adapter implementation and local tests do **not** establish live service availability. macOS is the first local delivery target; Windows requires independent native build and interactive acceptance. See [current status](docs/CURRENT_STATUS.md).

## Run locally

Requirements: Node.js 22+, Rust stable, and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for the target platform. macOS requires Xcode command line tools; Windows requires MSVC and WebView2.

```sh
npm ci
npm run desktop:dev
```

Open **Models**, configure Provider, Base URL, Model ID and vision support, and enter the key locally. Keys use the operating system credential store and are never saved in React storage or the JSON history file. Ordinary responses default to Concise; Normal and Detailed are selectable. Remote Agents use a separate OpenAI key and require compatible account permissions and quota.

```sh
npm test
npm run typecheck
cargo test --locked
npm run desktop:build
```

The supported build wrapper creates a local macOS ad-hoc signed `OrdiBot.app` and records source/executable fingerprints. No Apple Developer account, notarization or commercial signing is required. On Windows it builds an NSIS installer. [Build details](docs/MACOS_BUILD.md).

The new `ai.ordibot.desktop` data/credential namespaces are separate from the preserved `ai.ordinconn.desktop` legacy store. Old financial history and provider keys are not automatically imported. Screenshot pixels are transient; copied text deliberately sent in Chat is part of the local conversation history. [Migration audit](docs/ordibot/MIGRATION.md).

## Project records

[Product baseline](docs/PRODUCT_BASELINE.md) · [Architecture](docs/ARCHITECTURE.md) · [Roadmap](docs/open-source/ROADMAP.md) · [Provider verification](docs/ordibot/PROVIDERS.md) · [Security](docs/open-source/SECURITY_AND_PRIVACY.md) · [Build in Public](docs/open-source/BUILD_IN_PUBLIC.md) · [Issue #17](https://github.com/Btkkgo/OrdiBot/issues/17)

Historical OrdinConn documentation is preserved under `docs/legacy/ordinconn-20261012/` and Git history. It does not describe the active OrdiBot product.
