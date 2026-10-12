# OrdiBot 迁移审计

[English](MIGRATION.md) | [简体中文](MIGRATION.zh-CN.md)

已批准的 OrdiBot V1 要求替代历史金融及移动产品基线。从现有桌面开发分支继续，不创建替代仓库。改动前，所有 Git 引用已保存为验证通过的 bundle，未跟踪文件已归档，旧 SQLite 已通过 backup API 生成快照，`integrity_check` 为 `ok`。恢复归档仅保存在 Git 之外的本地私有位置。

| 决策 | 资产 | 处理 |
| --- | --- | --- |
| KEEP | Git 历史、main、桌面分支、私有 SQLite、设置、Keychain、独立实体机器人项目 | 保留，不重写或删除 |
| REFACTOR | Tauri 入口、React UI、Model Gateway、原生凭据、typed IPC | 小型助手及同一窗口内可扩展 Agent 工作台 |
| 从活跃应用 RETIRE | 金融 UI、采集器、交易/审批 Runtime、Android/本地自主 Runtime、Demo 初始化 | 新桌面入口不启动、不导入、不依赖；源码仍可恢复 |

拉取后的基线中，`main` 独有 5 个提交，`codex/realtime-workbench` 独有 15 个提交。实体机器人工程使用独立 `OddBot` 远端，不属于本次迁移。

新 bundle identifier 为 `ai.ordibot.desktop`。本地 `ordibot-v1.json` 和凭据服务与 `ai.ordinconn.desktop` 分离。明确保留旧数据，不静默迁移或覆盖。首版不会自动导入金融记录和旧 Provider 密钥，需在本地配置新服务。剪贴板仅点击后读取，截图先预览确认；截图像素仅保留在内存，不写入历史文件。仅运行可关闭的应用/窗口元数据感知，不启动深层内容监控或本地自主操作引擎。

新构建包装器验证本地 ad-hoc OrdiBot bundle，并记录源码和可执行文件指纹。历史 OrdinConn 冻结 bundle 及凭据保留，新包装器不删除它们。应启动新的 OrdiBot bundle，而不是历史 OrdinConn 应用。后续构建使用同一最新 OrdiBot 输出位置。

原仓库现已更名为 `Btkkgo/OrdiBot`。更名前后节点身份 `R_kgDOUib6fw`、139 Stars 与全部远程 refs 一致；旧地址仍指向同一仓库。main 的五个分叉提交采用 noreply 身份本地合并，保留双方历史。实体机器人工作区及其独立远程未改动。
