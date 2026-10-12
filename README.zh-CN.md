# OrdiBot

[English](README.md) | [简体中文](README.zh-CN.md)

**Your Desktop AI Companion** — 桌面上下文 AI 助手与远程电脑智能体。这是原 OrdinConn 仓库的更名，保留原 Git 历史。

采用 Tauri v2、Rust、React 与 TypeScript。启动为边缘小角色，点击展开 Chat，收起回到记忆的左/右边缘。Hidden 为单独的托盘操作。深色悬浮 Chat 窗口包含窄导航与原创小型二维角色，并与可扩展的 Agent 工作台共用一个运行时。金融 Dashboard、采集器、交易和 Android 自动操作已退出活跃桌面应用，历史资产仍可恢复。

- **Chat：**通过 Model Gateway 调用用户配置的 OpenAI-compatible 服务，支持多轮文字、流式回复、取消、输出限制和明确错误。未配置时不会给出模拟回答。
- **Context：**可关闭的应用名/窗口标题轻提醒，20 秒节流、去重和浏览器/编辑器过滤。点击提醒只附加这些元数据。另可主动附加复制文字、获取元数据和确认截图。不持续监控屏幕、键盘或剪贴板。截图问答需要开启视觉能力。
- **Agent：**实现 OpenAI 托管 Agents API 适配器，任务历史、记录、结果、网站来源批准与取消均由服务响应驱动。Meta Muse 和 Grok Bot 仅为明确标注的外部入口，未宣称原生任务 API 接入。
- **本地控制：**悬浮窗口、置顶设置、模式与窗口位置恢复、菜单栏/托盘入口，以及成功注册后的 Command/Ctrl + Shift + Space 快捷键。

当前界面使用简体中文，英文界面本地化待办。用户已决定先完成界面和本地功能，配置密钥后再验收真实 API。代码与本地测试通过不能证明线上服务可用。macOS 为首个本地交付目标；Windows 需独立编译和交互验收。参见[当前状态](docs/CURRENT_STATUS.zh-CN.md)。

## 本地运行

需要 Node.js 22+、Rust stable，以及目标平台的 [Tauri 前置依赖](https://v2.tauri.app/start/prerequisites/)。macOS 需要 Xcode 命令行工具；Windows 需要 MSVC 与 WebView2。

```sh
npm ci
npm run desktop:dev
```

在 **Models** 配置 Provider、Base URL、Model ID、视觉能力，并在本地填写密钥。密钥交给系统安全存储，不写入 React 存储或 JSON 历史文件。默认回答风格为 Concise，可切换 Normal 和 Detailed。远程 Agent 使用独立 OpenAI 密钥，需要对应账户权限和额度。

```sh
npm test
npm run typecheck
cargo test --locked
npm run desktop:build
```

正式构建入口生成本地 ad-hoc 签名的 macOS `OrdiBot.app` 并记录源码/可执行文件指纹。无需 Apple Developer 账户、公证或商业签名。Windows 构建 NSIS 安装包。[构建说明](docs/MACOS_BUILD.zh-CN.md)。

新 `ai.ordibot.desktop` 数据和密钥命名空间与保留的 `ai.ordinconn.desktop` 旧数据分离，不自动导入金融记录或原密钥。截图像素仅暂存在内存；主动发送的复制文本会进入本地对话历史。[迁移审计](docs/ordibot/MIGRATION.zh-CN.md)。

## 项目记录

[产品基线](docs/PRODUCT_BASELINE.zh-CN.md) · [架构](docs/ARCHITECTURE.zh-CN.md) · [路线图](docs/open-source/ROADMAP.zh-CN.md) · [Provider 核查](docs/ordibot/PROVIDERS.zh-CN.md) · [安全](docs/open-source/SECURITY_AND_PRIVACY.zh-CN.md) · [公开开发规则](docs/open-source/BUILD_IN_PUBLIC.zh-CN.md) · [Issue #17](https://github.com/Btkkgo/OrdiBot/issues/17)

历史 OrdinConn 文档保留在 `docs/legacy/ordinconn-20261012/` 及 Git 历史中，不代表当前 OrdiBot 产品。
