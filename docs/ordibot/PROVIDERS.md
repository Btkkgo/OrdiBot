# Remote Provider verification

[English](PROVIDERS.md) | [简体中文](PROVIDERS.zh-CN.md)

Official documentation checked on 2026-10-12. The owner deferred real API acceptance until local credentials are configured. No production model or remote task was invoked during implementation.

- [OpenAI Agents API Computer use](https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use): official hosted browser environment, `computer_use` tool, `gpt-6-astra` in official examples; `OpenAI-Beta: agents=v1`. Third-party applications create `/v1/agents/sessions`, submit task input, retrieve sessions, turns and paginated items, respond to origin approvals, and send `agent.session.input.cancel`. No documented pause is implemented. Root turn outcomes determine completion; session idle alone does not. The adapter uses provider records through polling, with no generated reasoning or percentage progress.
- [Prerequisites](https://developers.openai.com/api/docs/guides/agents-api/quickstart): user-supplied application API key with `api.agents.read`, `api.agents.write`, and `api.responses.write`; permissions, regional access, model access, rate limits and quota must be checked on the user's account. Uncertain submission is recorded without automatic retries. Approval requests are revalidated against current session state. Only public read-only tasks and browser-origin approval are supported; sign-in and custom tool requests remain unsupported and visible.
- [Pricing](https://developers.openai.com/api/docs/pricing) and [hosted environment lifecycle](https://developers.openai.com/api/docs/guides/agents-api/environments/openai-hosted): inference and environment usage are billable. This app has no billing entitlement or quota guarantee. Review the live pricing/account limits before submitting; completed environments can be explicitly released. No fixed cost is promised.
- [Meta Muse](https://ai.meta.com/muse/): product page checked; no verified third-party remote-task API contract found in inspected material. External entry only, not an integration claim.
- [Grok Bot](https://docs.x.ai/grok-bot/overview): inspected material describes the consumer cloud-computer workflow; no verified third-party remote-task REST contract found there. External entry only. Ordinary xAI model chat is not represented as Grok Bot computer access.

Status: adapter **IMPLEMENTED / LIVE API NOT RUN**. Local fixtures validate state projection, not service availability. Chat MVP remains usable independently after the user configures its own model endpoint.
