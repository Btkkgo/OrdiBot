# G7.1A secure Model Gateway acceptance

[English](G7_1A_ACCEPTANCE.md) | [简体中文](G7_1A_ACCEPTANCE.zh-CN.md)

2026-10-12 · [Issue #24](https://github.com/Btkkgo/OrdiBot/issues/24) · [PR #25](https://github.com/Btkkgo/OrdiBot/pull/25). Based on main `061d217`; [G6.2 PR #23](https://github.com/Btkkgo/OrdiBot/pull/23) is OPEN, unmerged, and is not included as verified main evidence. Issues #17 and #22 remain OPEN.

## Security changes

- Chat credentials bind the normalized Provider name and canonical URL (scheme, host, effective port and complete base path). Model ID and parameter changes do not change credential identity. Changing Provider/endpoint clears the active binding; returning to an earlier endpoint does not silently restore its key.
- New Chat slots contain a trusted identity/secret envelope in native secure storage. Editable JSON holds only the identity and a UUID account pointer. Forging JSON identity while retaining an old slot cannot rebind its secret to another endpoint. This does not protect against an attacker who can already modify native secure storage or execute arbitrary code as the user.
- Legacy shared Chat keys are neither imported nor overwritten. They require explicit re-entry in Models before cloud use. Existing Remote credentials remain available through their separate fixed-provider path. This round did not read or change existing credentials.
- Loopback mode (localhost including a trailing dot, IPv4 127/8, IPv6 loopback and mapped loopback) never reads a Chat key. Gateway also strips Authorization even if called with a key argument. Local Chat key entry is disabled; native saving rejects a supplied local Chat key. Plain HTTP is allowed only on loopback; URL credentials, queries and fragments are rejected.
- Chat complete/stream and Remote HTTP clients reject all redirects. A configured HTTPS cloud endpoint remains an owner trust decision; TLS verification remains enabled. No redirect fallback or automatic endpoint migration occurs.
- Saves stage new immutable Chat/Remote slots, then atomically persist one configuration/binding pointer snapshot. Memory commits only after persistence succeeds. Key-write, second-slot-write and JSON-persistence failures preserve the committed configuration and old slots. Failed or interrupted staging may leave unreferenced **new** slots; they are deliberately retained, never used automatically, and no cleanup deletes existing credentials. UI reports actual save errors, clears unsaved Chat key text on endpoint/provider edits and disables editing during save.
- Three explicit parameter profiles: `standard` sends temperature + max_tokens; `completion` omits temperature and sends max_completion_tokens; `no-temperature` omits temperature and sends max_tokens. These are request-shape controls, not proof that any model supports them. Old configs/requests default to standard. Two retained legacy request literals receive only the new default field to preserve compilation; retired runtimes remain inactive.

## Acceptance matrix

| Gate | Result | Evidence and limit |
| --- | --- | --- |
| Credential isolation and tampered JSON | PASS | In-memory vault fixtures: provider/host/port/path changes, trusted envelope check, no legacy Chat adoption, no local vault read. |
| Save failure and restart | PASS | First/second key-write and missing-parent persistence failures preserve prior state/slots; temp-file reload retains bindings and parameter policy; JSON contains no fixture secrets. Existing user data is not opened. |
| HTTP safety | PASS | Real loopback HTTP fixtures reject 307 without accessing the redirect destination; build-only cloud request checks Authorization, all supported local forms omit it. No cloud connection is sent. |
| Parameter compatibility | PASS | Serialized request profiles select one token field and omit unsupported temperature; Settings passes the selected profile. This is protocol-shape coverage only. |
| TypeScript | PASS | `npm test`: 105 tests (desktop 96 + contracts 9), including G6.1 language/theme/layout/lifecycle regressions. |
| Rust | PASS | `cargo test --locked`: 47 active-default-member tests (Gateway 26 + native desktop 21). |
| Retained source compatibility | PASS | `cargo check --locked -p agent-runtime -p ordinconn-app --offline`; compile-only, no retired runtime launched. |
| Typecheck | PASS | `npm run typecheck`. |
| Independent review | PASS | Security/compatibility findings fixed and reviewed again; no remaining blocking finding. |
| Mac native build/signature | PASS | npm run desktop:build at c5a204e; frontend/release bundle, stable source fingerprint and ad-hoc strict signature verification passed. |
| Windows independent CI | PASS | [Branch run](https://github.com/Btkkgo/OrdiBot/actions/runs/38269809980) and [PR run](https://github.com/Btkkgo/OrdiBot/actions/runs/38269996025) at c5a204e: 105 TypeScript / 47 Rust, typecheck, native NSIS build and installer upload. CI is distinct from GUI acceptance. |
| New-binary Mac GUI / native Keychain operations | NOT RUN | Not exercised in this credential-preserving foundation task; earlier G6.1 evidence remains historical. |
| Windows 11 GUI | NOT RUN | No real Windows GUI used. |
| Real Chat / Vision / Remote Agent | NOT RUN / OWNER DEFERRED | Production Provider calls: **0**. No Ollama request or remote task was sent either. |

No dependencies, old databases, backups, histories, original character artwork or separate physical robot project were changed or deleted. Native fixture stores use temporary directories and an in-memory vault. Automated tests do not prove actual API availability or OS vault integration. Prior G6.1 native UI acceptance is not relabeled as a new G7.1A runtime PASS.

## G7.1B authorization required

Owner approval must name the Provider, exact endpoint, model and bounded live test scope. Keys must be entered locally, never sent in chat or public records. Approve a request/token/spend cap before cloud calls; account pricing and capabilities need current verification. Local Ollama acceptance requires explicit approval too. Chat-only approval does not authorize screenshots/Vision, Remote Agent, permission changes or merging this PR. Streaming/cancellation may still incur billed server work. This task stops before these operations.

## Native build receipt

Verified Mac arm64 build at `c5a204e`, 2026-10-12T15:24:19Z. Executable SHA-256: `aa5f87f6ec9d284d0ea86a950f570aa9edb0d4f46f54cb91e829ec10921df9b8`; source fingerprint: `42325cb0a79be6bb3973f0fd3e2857b588745d4b3fa0cb80b7fac080de9b2ff5`. Bundle: `target/release/bundle/macos/OrdiBot.app`. The old process was quit before building; the new package was not launched and no recording permissions changed. The existing STATIC_VCRUNTIME deprecation warning is nonfatal and unrelated to this patch. Subsequent documentation-only closeout reuses this executable.
