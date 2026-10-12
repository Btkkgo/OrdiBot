# OrdiBot 架构

[English](ARCHITECTURE.md) | [简体中文](ARCHITECTURE.zh-CN.md)

一个 Tauri v2 进程管理一个透明原生窗口。React `CompanionApp` 在紧凑 Chat 与展开 Agent 间切换，原创 SVG 角色属于同一个 Chat 容器。Typed IPC 与 Tauri Channel 将界面和密钥、平台采集、模型传输、持久化隔离。

```text
React CompanionApp / AgentWorkspace
  -> typed Tauri commands + Chat Channel
  -> companion_store（原子本地 JSON；系统密钥存储）
  -> companion_platform（主动剪贴板 / 前台元数据 / 截图）
  -> companion_commands -> 原 Model Gateway -> OpenAI-compatible stream
  -> companion_remote -> OpenAI hosted Agents sessions / turns / items
```

截图须预览确认，绑定真实用户消息，不序列化到历史。恢复旧截图对话时明确告知模型原像素不可用。复制文本/应用元数据标明采集来源。流解码保留跨分块 UTF-8，并要求服务完成标记；连接中断不能伪造成功。

远程任务使用独立密钥与历史。适配器轮询服务会话、根 turn 和分页 items，网站来源批准先核查最新状态，支持取消，并显示不支持的登录/工具请求。会话 idle 不等于任务完成。结果不明的提交被记录且不自动重试；云端环境释放需主动操作。

新数据位于 `ai.ordibot.desktop`，旧 `ai.ordinconn.desktop` 数据和密钥保留且不自动导入。JSON 原子写入，Unix 文件仅用户可读，损坏文件不被覆盖。不增加云端后端。主 UI 不启动金融采集器、原 Agent/Tool 运行时、Android 自动操作或演示数据。Cargo 默认成员为 Model Gateway 与新桌面包；旧 crates/源码保留在历史与磁盘。

macOS 使用原生剪贴板、主动 System Events 元数据与交互式截图。权限缺失明确提示，不静默授权。Windows 隔离前台元数据/截图调用和原生密钥存储。Windows CI 只能证明编译，桌面交互需 Windows 11 验收。

配置保存 endpoint/model/vision/output/style/pin，不含密钥。界面仅收到密钥存在的布尔状态，模型错误归一化且不暴露秘密。附件文字不得覆盖用户问题或系统规则。参见[Provider 证据](ordibot/PROVIDERS.zh-CN.md)、[迁移](ordibot/MIGRATION.zh-CN.md)与[状态](CURRENT_STATUS.zh-CN.md)。

补充边缘交互使用同一 Tauri 进程、存储和 Provider 运行时中的两个协同 webview：可扩展主窗口与不抢焦点的小型边缘窗口。展开后角色属于 Chat。边缘窗口记忆停靠侧与跨屏垂直比例，指针捕获拖动在释放后吸附。托盘分别提供 Edge 与 Hidden。

元数据循环仅在提醒开启且非 Hidden 时每三秒运行。应用/标题在主动附加前仅存在内存。提醒去重、20 秒节流、10 秒消失，不强制展开 Chat，不调用剪贴板、截图或服务。提供仅浏览器/编辑器过滤。点击只带入真实应用/标题，不取得页面、代码或文档正文。
