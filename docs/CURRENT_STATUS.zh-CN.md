# OrdiBot 当前状态

[English](CURRENT_STATUS.md) | [简体中文](CURRENT_STATUS.zh-CN.md)

更新于 2026-10-12 · [Issue #17](https://github.com/Btkkgo/OrdiBot/issues/17) · G1–G5 本地交付；完整 V1 仍为 **NEEDS_VALIDATION**。

## Implemented / 已实现

Hidden、Edge、Chat、Agent 四态，左右停靠与垂直位置记忆，可关闭且有节流/去重/过滤的仅元数据提醒，原创小角色与深色窄 Chat，同一运行时中的扩展 Agent 工作台，模型/偏好表单，主动剪贴板/应用/截图附件，本地历史，流式 Model Gateway 与托管 OpenAI Agent 适配器。金融采集、交易与 Android 运行时已退出活跃默认构建；历史资产与数据保留。

## Verified / 已验证

- **PASS：**全部 refs 恢复备份、原有未跟踪文件归档、SQLite 备份/完整性及逻辑一致；原有未跟踪文件哈希保留。
- **PASS：**89 个 TypeScript、34 个 Rust 测试（活跃默认成员），类型检查，前端/原生构建，公开安全与空白检查。独立代码审查发现重试/过滤两处缺陷；两项回归均先失败、修复后通过，复核认可修复。
- **PASS：**真实 macOS release 启动；Edge 默认启动与点击展开；Chat/Agent 切换及 Chat 尺寸恢复；Chat/Edge 拖动；左右停靠、垂直位置及偏好重启持久化；主动剪贴板附件与移除；真实前台应用元数据；真实提醒点击附加元数据；最新 `68a4f86` release 的录屏授权刷新后，截图预览、取消不附加、确认附件与移除通过。缺少模型配置时显示真实错误，不生成假回复。
- **PASS：**同一 GitHub 仓库已更名为 [Btkkgo/OrdiBot](https://github.com/Btkkgo/OrdiBot)：身份 `R_kgDOUib6fw`、139 Stars 和更名时全部远程 Git refs 保持一致。main 的五个分叉提交通过受控本地合并保留；[PR #18](https://github.com/Btkkgo/OrdiBot/pull/18) 已合并，公开 main 包含 `68a4f86`。独立实体机器人项目未改动。
- **PASS：**独立 Windows CI 在 `68a4f86` 通过 89 个 TypeScript / 34 个 Rust 测试并上传原生 NSIS 安装包。缓存隔离修复后，更名工作区的独立执行通过，包括 [main 执行 38207262944](https://github.com/Btkkgo/OrdiBot/actions/runs/38207262944)。编译与界面验收分别记录。
- 实施期间生产 Chat/远程请求：**0**。

## Partial / 部分验证

macOS 被动感知取得真实应用名；实测窗口标题未取得，降级为仅应用元数据。提醒节流/过滤/去重及元数据附件边界有回归/源码覆盖；菜单栏入口及全局快捷键恢复为 **NOT VERIFIED**。CUA 合成快捷键尝试未展开 Chat，尚无确定原生原因；点击 Edge 恢复可用。Windows 界面/上下文验收为 **NOT RUN**。英文界面本地化待办。

## Blocked / 暂缓

真实 Chat、多轮、取消/错误、截图视觉与托管 Agent 服务验收为 **NOT RUN / OWNER DEFERRED**，等待用户在本地配置凭据与账户能力。代码/fixture 不能证明生产服务可用。请勿将 Key 发到公开记录或聊天。

## Designed / 设计边界

只有正式托管电脑任务 API 才算原生 Agent 集成。Meta Muse 与 Grok Bot 仅保留外部入口，未验证原生任务契约。不显示暂停、虚构时间线或假任务结果。

## Planned / 后续

用真实平台证据处理原生恢复及 Windows 11 交互验收。公开主线集成与已验证 release 构建记录已完成；构建记录标识未变化的 `68a4f86` 运行时代码。

## Not Started / 未开始

Windows 11 交互/上下文/API 与真实生产服务验收。商业签名/公证、自由巡游宠物、金融产品与本地自主电脑引擎不在范围内。

## Next / 下一步

先使用本地助手，准备好后仅在 Models 中配置 Key 再验收真实 API。参见[基线](PRODUCT_BASELINE.zh-CN.md)、[迁移](ordibot/MIGRATION.zh-CN.md)、[服务证据](ordibot/PROVIDERS.zh-CN.md)与[路线图](open-source/ROADMAP.zh-CN.md)。Issue #17 保持开启，跟踪未验证项。
