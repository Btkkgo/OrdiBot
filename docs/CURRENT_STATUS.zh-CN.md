# OrdiBot 当前状态

[English](CURRENT_STATUS.md) | [简体中文](CURRENT_STATUS.zh-CN.md)

更新于 2026-10-12 · [Issue #17](https://github.com/Btkkgo/OrdiBot/issues/17) · G1/本地能力已实现；完整 V1 为 **NEEDS_VALIDATION**。

## Implemented

深色紧凑 Chat、原创小角色、窄导航、同进程展开 Agent 工作台、模型/偏好表单、主动剪贴板/应用/截图附件、本地历史、流式 Model Gateway 与托管 OpenAI Agent 适配器。金融采集器、交易与 Android 运行时退出默认活跃应用，旧资产/数据分别保留。

## Verified

- **PASS：**验证全部 refs 恢复 bundle、原未跟踪资产归档、SQLite 备份/完整性/逻辑一致；原未跟踪文件哈希未变。
- **PASS：**89 个 TypeScript 测试、30 个 Rust 测试（活跃默认成员）、TypeScript 类型检查、前端构建、公开安全检查与差异空白检查。
- **PASS：**真实 macOS release 应用启动、紧凑/展开切换与 Chat 尺寸恢复、主动剪贴板附件/移除、前台 Chrome 元数据、未配置模型错误且无假回复。已验证两次本地 ad-hoc 构建，最终原生交互检查进行中。
- 实施期间生产 Chat/远程请求：**0**。

## Partial

原生拖动、截图预览确认、菜单栏/快捷键恢复、偏好持久化与最终可执行文件记录仍需最终交互检查。Windows 原生 CI 已准备，尚未运行。Windows 界面/上下文验收为 **NOT RUN**。英文界面本地化待办。

## Blocked

真实 Chat、多轮、取消/错误、截图视觉与托管 Agent 服务验收为 **NOT RUN / OWNER DEFERRED**，等待用户在本地配置密钥及账户能力。代码/fixture 测试不证明线上服务可用。密钥不得发到公开记录或聊天中。

## Designed

仅正式托管电脑任务 API 构成原生 Agent 接入。Meta Muse 和 Grok Bot 保持外部入口，无已核实的原生任务接口。不显示暂停或虚构时间线。

## Planned

完成 Mac 原生交互、独立 Windows 编译、保留 main 分叉提交，验证本次公开变更后更名同一 GitHub 仓库。

## Not Started

Windows 11 交互/上下文/API 与生产服务验收。商业签名/公证、独立宠物、金融产品和本地自主电脑引擎不在范围。

## Next

完成本地交付并分别记录各项检查。用户在 Models 配置密钥后恢复真实 API 验收。参见[基线](PRODUCT_BASELINE.zh-CN.md)、[迁移](ordibot/MIGRATION.zh-CN.md)、[服务证据](ordibot/PROVIDERS.zh-CN.md)与[路线图](open-source/ROADMAP.zh-CN.md)。
