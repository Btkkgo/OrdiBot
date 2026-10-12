# 远程 Provider 核实

[English](PROVIDERS.md) | [简体中文](PROVIDERS.zh-CN.md)

2026-10-12 核对官方文档。用户选择在本地配置凭据后再进行真实 API 验收。实施期间未调用生产模型或提交真实远程任务。

- [OpenAI Agents API Computer use](https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use)：提供官方托管浏览器、`computer_use` 工具，示例使用 `gpt-6-astra`，要求 `OpenAI-Beta: agents=v1`。第三方可创建 `/v1/agents/sessions`、提交任务、读取会话、turn 和分页 item、响应网站来源审批，并发送 `agent.session.input.cancel`。未实现无官方依据的暂停。以根 turn 结果判断完成，idle 不能证明完成。适配器轮询 Provider 原始记录，不生成思考或百分比进度。
- [调用前提](https://developers.openai.com/api/docs/guides/agents-api/quickstart)：用户提供具备 `api.agents.read`、`api.agents.write`、`api.responses.write` 权限的应用 API Key。账号权限、地区、模型访问、限流和额度需在用户账号验证。提交结果未知时记录状态，不自动重发。审批前重新读取当前待确认请求。仅支持公开信息只读任务和网站来源审批；登录和自定义工具输入未支持，会明确显示。
- [价格](https://developers.openai.com/api/docs/pricing)及[托管环境生命周期](https://developers.openai.com/api/docs/guides/agents-api/environments/openai-hosted)：模型及环境使用需要费用。本应用不提供计费权益或额度保证。发送前检查实时价格及账号限额；已结束任务可主动释放环境。不承诺固定价格。
- [Meta Muse](https://ai.meta.com/muse/)：核对产品页面，在所检查资料中未找到已验证的第三方远程任务 API 契约。仅保留外部入口，不宣称接入。
- [Grok Bot](https://docs.x.ai/grok-bot/overview)：检查资料描述消费者云端电脑工作流，未在该页面找到已验证的第三方远程任务 REST 契约。仅保留外部入口，普通 xAI 模型聊天不等同 Grok Bot 电脑访问。

状态：适配器 **IMPLEMENTED / LIVE API NOT RUN**。本地测试验证状态投影，不证明服务可用。用户配置自己的模型地址后，Chat MVP 可独立使用。
