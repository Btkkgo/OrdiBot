# G7.1B native acceptance and first Chat preparation

[English](G7_1B_PREPARATION.md) | [简体中文](G7_1B_PREPARATION.zh-CN.md)

2026-10-12 UTC. **PREPARATION ONLY. Production Provider requests: 0.** No merge, commit, push, Issue closure, real key access, Ollama request or Remote Agent operation was performed. This report is local and unpublished pending owner authorization. Historical G7.1A evidence is not retrospectively relabeled.

## Baseline and merge recommendation

- Live main: `061d217a8043f5508ec2a7cc8244e7bb196476e1`. Local branch: `codex/ordibot-g7-1a`, HEAD `4ed310fb110619859dda9b7c074745a0074347b3`. Existing untracked work and the separate physical robot project were preserved. Product sources, dependencies and databases were not edited.
- [PR #23](https://github.com/Btkkgo/OrdiBot/pull/23): OPEN, MERGEABLE/CLEAN against current main, head `842054d`. Its 11 changed files are documentation, two evidence images and a plan; no product, dependency, schema or security boundary change. GitHub submitted reviews and unresolved review threads are empty, which is not reviewer approval. Its head has no attached status checks. The independent [Windows dispatch](https://github.com/Btkkgo/OrdiBot/actions/runs/38257016271) passed at `350d2ca`; later commits change documentation only. Existing G6.2 limitations must remain explicit: native close/minimize/window-title gaps, Windows GUI NOT RUN and services OWNER DEFERRED.
- [PR #25](https://github.com/Btkkgo/OrdiBot/pull/25): OPEN, MERGEABLE/CLEAN against current main, head `4ed310f`. Latest independent [Windows PR CI](https://github.com/Btkkgo/OrdiBot/actions/runs/38270756265) is SUCCESS at this exact head: TypeScript, Rust, typecheck, native NSIS build and upload. GitHub reviews/threads are empty; prior engineering review is separate evidence.
- Read-only merge-tree inspection finds four shared documents: both Current Status files merge textually, while both `docs/devlog/2026-10-12*` files have actual conflicts. A CLEAN result against main does not establish mutual compatibility between the two PRs.

Recommendation: #23 is suitable for an owner-approved documentation closeout merge, preserving incomplete V1 gates and Issues #17/#22. Merge #23 first through the repository's controlled local noreply-identity process; then append a normal merge of updated main into #25, retain both DevLog stages, reconcile Current Status in both languages and update the now-current PR #23 state. Do not rebase/force-push. Rerun scoped tests/typecheck/security/diff and Windows CI on the resulting #25 head; recheck the Mac artifact source fingerprint. If runtime sources change, rebuild and repeat affected native checks. Review #25 again before separately authorizing its merge. **None of this merge/push plan was executed.**

## Native Mac acceptance matrix

The exact existing G7.1A release app was used, built from code commit `c5a204e`; SHA-256 `aa5f87f6ec9d284d0ea86a950f570aa9edb0d4f46f54cb91e829ec10921df9b8`. Its hash and strict ad-hoc signature were checked again. No rebuild or permission change was needed.

Before launch, the owner store was privately backed up with mode 0600. A temporary marked configuration used reserved `.invalid` cloud addresses and a dedicated loopback Fixture. Only new UUID test credential slots were created; existing slots were not read, overwritten or deleted. A test Remote pointer prevented legacy Remote-key fallback; no task was submitted. After normal exit, the owner store's original bytes, SHA, mode and timestamps were restored. The application remains exited. Private backups and all newly staged slots remain local.

| Gate | Result | Actual evidence / limit |
| --- | --- | --- |
| Native startup, normal quit and restart | PASS | Actual app starts in Edge; native Command-Q removes the process; reopening the same bundle restores settings. |
| Configuration save/reload | PASS | Fixture provider, endpoint, model, output 256, standard policy and Vision disabled persisted and reappeared after restart. |
| macOS Keychain write/read | PASS | Actual Models password entry writes a new slot; native UI reads it after restart. A helper compiled against current credential/store code reads only the marked new test slot and reports a boolean match without emitting its value. |
| Provider and Endpoint isolation | PASS | Changing Provider clears key availability; returning to the old Provider does not restore it. Re-entering a test key then changing Endpoint clears availability again. |
| Loopback without cloud Authorization | PASS | One actual native Chat POST to a dedicated 127.0.0.1 Fixture: `/v1/chat/completions`, Authorization absent, no attachments, only controlled test text, standard policy and output limit 256. Two synthetic SSE deltas render as a clearly labeled LOCAL FIXTURE answer. This is not real AI acceptance. |
| Configuration-persistence failure | PASS | Temporarily replacing only the fixture destination with an empty directory makes atomic rename fail. UI shows an actual save error, not Saved. Returning to Models shows the original committed identity/key; before/after helper results match. New unreferenced slots are retained. |
| Native Keychain write failure | NOT RUN | OS write denial was not induced or simulated as native evidence; G7.1A automated failure fixtures remain separate. |
| Edge, Chat, empty Agent navigation | PASS | Collapse retains Edge, click reopens Chat with the Fixture conversation; empty Agent workspace opens and returns to Chat/Models without remote submission. |
| Dock side/vertical position and Chat size | PASS | Side/vertical values and 586×951 saved Chat size remained stable. |
| Strict unchanged absolute window coordinates | FAIL | Final native fixture coordinates differed from the original saved coordinates. Existing `position_chat_at_edge` computes coordinates from current work area/dock position; the precise cause of this observation is NOT VERIFIED. No product patch was made. Original coordinates were restored with the complete owner store. This is not proof of a G7.1A regression. |
| Existing data preservation | PASS | Original owner-store bytes/hash/mode/timestamps restored, empty task history unchanged throughout, no old credential or backup deletion. |
| Nonempty historical-data native regression | NOT VERIFIED | Owner store had zero conversations and zero tasks; a successful Fixture conversation persisted, but this cannot prove native migration of nonempty prior history. |
| Windows 11 GUI | NOT RUN | Windows CI is build/test evidence only. |
| Real Chat / Vision / Remote Agent | NOT RUN / OWNER DEFERRED | Production requests remain 0; no attachments or remote tasks sent. |

Local evidence is under ignored `target/ordibot-g71b-native-evidence/`: sanitized Keychain comparisons, loopback request booleans, restoration result and test logs. Private store copies must never be staged/uploaded. UI actions are also recorded in this task's tool trace.

## Tests and preflight

- Fresh local `npm test`: 105 PASS (96 desktop + 9 contracts); `cargo test --locked --offline`: 47 active tests PASS (26 Gateway + 21 desktop); `npm run typecheck`: PASS. Native build is reused from unchanged G7.1A code; hash/signature were reverified, not described as a new build.
- Public-repository security scan, tracked diff check and new bilingual-document links/format checks: PASS. Four new local report/DevLog files remain uncommitted and unpublished; tracked files are unchanged.
- Source boundaries: `companion_credentials.rs::chat_key_for/save_settings`; `companion_store.rs::persist`; `companion_commands.rs::build_request/chat_send`; `openai_compatible.rs::build_chat_request/ChatStreamNormalizer/request_builder`. Redirects remain disabled and no automatic retry exists in the active native Chat path.
- Proposed, **not applied** owner settings: OpenAI; `https://api.openai.com/v1`; exact POST `https://api.openai.com/v1/chat/completions`; `gpt-4.1-mini-2025-04-14`; standard; Vision off; 256 output tokens. Official [model documentation](https://developers.openai.com/api/docs/models/gpt-4.1-mini) lists this snapshot, Chat Completions and streaming. The [Chat reference](https://developers.openai.com/api/reference/resources/chat) documents temperature and token limits; `max_tokens` is deprecated and incompatible with o-series models. Compatibility with this non-reasoning model is a documented expectation, not a tested account/API PASS.
- Account model permission, balance, applicable service tier and real endpoint connectivity: **NOT VERIFIED**, to be checked locally by the owner; no authenticated model-list or other Provider request was made.
- Output 256 is serialized and native Fixture verified. Input is currently limited by history count (40 messages) and per-message size, not a small input-token budget. Future tests must use fresh controlled conversations, no existing history/attachments, and include the system prompt plus prior reply in input accounting.
- Current UI has **no hard three-request counter or dollar-budget gate**. The future bounded procedure must keep a ledger, issue requests sequentially, count failures/unknown outcomes as consumed attempts, never press Retry, and stop after three attempts or the first error. This is procedural control, not a software-enforced cap. A hard counter requires separately approved implementation and regression tests before live calls.
- The streaming request does not set `stream_options.include_usage`; the normalizer requires a choice and the native event loop only consumes text/completion/errors. Token usage/request IDs/returned model ID/latency are not persisted or displayed. Adding only include_usage would fail on the official empty-choices usage chunk. Accurate usage capture requires a separately approved minimal change, or owner-local account usage evidence; otherwise record usage/actual cost NOT VERIFIED. Do not add extra API requests to recover metrics.

## Pending live procedure and cost

After explicit owner authorization and resolution/acceptance of the limits above:

1. Locally confirm account access/balance; the owner alone enters the cloud key in Models. Validate exact bound endpoint/model/profile and Vision off.
2. Fresh Chat, no context/attachments: `Reply with ORBIT-READY only.` Record one attempt, wall latency, observable stream and completion/failure.
3. Same Chat: `What exact token did you reply with?` Record the second attempt and whether prior context is reflected.
4. Fresh Chat: `What is 2 + 2? Reply in five words or fewer.` Record the third attempt. An earlier error ends the run; no retry or extra error-provocation request. Do not include private history, screenshots, clipboard, files, tools or Agent tasks.

Record attempt number, configured model separately from returned model (if accessible), response outcome, stream observations, elapsed time, sanitized error, token usage availability and estimated cost. The proposed payloads and ledger are a plan; no real request was executed.

Official [GPT-4.1 mini pricing](https://developers.openai.com/api/docs/models/gpt-4.1-mini) is $0.40 per million uncached input tokens and $1.60 per million output tokens under standard pricing. At **at most 1,000 input tokens per request**, three requests with all 256 output tokens cost approximately **$0.0024288**; this is a conditional estimate, not an enforced input cap. The 768-output-token portion alone is $0.0012288. Applicable tier/pricing, actual input and billing can differ; cancellation or failure does not prove zero billed work. **USD 0.10 remains an owner-proposed spending ceiling, not a hard application budget.**

Required separate owner decisions: merge/push #23 and then reconciled #25; whether to authorize minimal usage/counter work or accept documented procedural limits; account readiness and locally entered key; then explicit production authorization naming the above model/endpoint, no attachments/Agent, maximum three attempts, output 256 and cost expectations. No live call begins from preparation approval alone. Issues #17/#22 stay OPEN. Stop here for the owner's decision.
