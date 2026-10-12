# OrdiBot 当前状态

[English](CURRENT_STATUS.md) | [简体中文](CURRENT_STATUS.zh-CN.md)

更新于 2026-10-12 · [Issue #17](https://github.com/Btkkgo/OrdiBot/issues/17) · G1–G5 本地交付及 G6.1 外观验收；完整 V1 仍为 **NEEDS_VALIDATION**。

## Implemented / 已实现

Hidden、Edge、Chat、Agent 四态，左右停靠与垂直位置记忆，可关闭且有节流/去重/过滤的仅元数据提醒，原创小角色与深色窄 Chat，同一运行时中的扩展 Agent 工作台，模型/偏好表单，主动剪贴板/应用/截图附件，本地历史，流式 Model Gateway 与托管 OpenAI Agent 适配器。金融采集、交易与 Android 运行时已退出活跃默认构建；历史资产与数据保留。

## Verified / 已验证

- **PASS：**全部 refs 恢复备份、原有未跟踪文件归档、SQLite 备份/完整性及逻辑一致；原有未跟踪文件哈希保留。
- **PASS：**89 个 TypeScript、34 个 Rust 测试（活跃默认成员），类型检查，前端/原生构建，公开安全与空白检查。独立代码审查发现重试/过滤两处缺陷；两项回归均先失败、修复后通过，复核认可修复。
- **PASS：**真实 macOS release 启动；Edge 默认启动与点击展开；Chat/Agent 切换及 Chat 尺寸恢复；Chat/Edge 拖动；左右停靠、垂直位置及偏好重启持久化；主动剪贴板附件与移除；真实前台应用元数据；真实提醒点击附加元数据；此前 `68a4f86` release 的录屏授权刷新后，截图预览、取消不附加、确认附件与移除通过。缺少模型配置时显示真实错误，不生成假回复。
- **PASS：**同一 GitHub 仓库已更名为 [Btkkgo/OrdiBot](https://github.com/Btkkgo/OrdiBot)：身份 `R_kgDOUib6fw`、139 Stars 和更名时全部远程 Git refs 保持一致。main 的五个分叉提交通过受控本地合并保留；[PR #18](https://github.com/Btkkgo/OrdiBot/pull/18) 已合并，公开 main 包含 `68a4f86`。独立实体机器人项目未改动。
- **PASS：**独立 Windows CI 在 `68a4f86` 通过 89 个 TypeScript / 34 个 Rust 测试并上传原生 NSIS 安装包。缓存隔离修复后，更名工作区的独立执行通过，包括 [main 执行 38207262944](https://github.com/Btkkgo/OrdiBot/actions/runs/38207262944)。编译与界面验收分别记录。
- 实施期间生产 Chat/远程请求：**0**。

## 补充边缘入口修订

- **PASS：**边缘入口改为裁切探头，展开 Chat 保留完整原创角色并跟随记忆的纵向比例。已在修订版 release 实测左右展开、收起回到探头，以及提醒点击附加元数据并直接编辑输入。
- 输入框上方固定导引卡单独显示已接受的应用/标题，区别于被动最新元数据，提供主动文字/截图入口；附加富内容后隐藏。独立审查发现初始位置会被长历史滚动隐藏，移到历史滚动区外后已解决。
- **PASS：**89 个 TypeScript 测试、类型检查、前端及签名原生构建。已验证的运行时构建记录标识 `60f23d1`，重启该 release 后仍保留右侧停靠与垂直位置。原生适配器未变化。新 Windows 两次执行（[分支](https://github.com/Btkkgo/OrdiBot/actions/runs/38210164089)、[PR](https://github.com/Btkkgo/OrdiBot/actions/runs/38210230779)）均通过测试、类型检查及原生 NSIS 打包，新安装包已下载。此前实测 Rust 总数为 34；新执行原始日志因传输超时未取回。生产请求继续为 0。
- **PASS：**用户完成系统认证后，仅移除旧 OrdiBot 录屏条目并登记确切的当前应用包，已复核当前 `60f23d1` release 截图。真实预览、取消不附加、确认生成截图附件及移除全部通过。截图未发给模型或公开记录，其他权限保留；未重新构建已验证的程序。

## G6.1 外观与语言

[Issue #20](https://github.com/Btkkgo/OrdiBot/issues/20)：活跃界面类型安全字典（每种语言 251 键）、14px 系统字体与五档字号、五种强调色/三种背景、即时外观预览/重置及兼容原生字段已实现并验证。**PASS：**99 个 TypeScript / 37 个 Rust 测试、类型检查、前端/签名原生构建、真实 Mac 中英切换、全部预设、130% Chat/Agent/Settings 排版、真实保存拒绝错误、重置、重启持久化及 Edge 回归。与私有恢复副本比较，原配置值/历史/停靠/窗口尺寸一致。独立[分支](https://github.com/Btkkgo/OrdiBot/actions/runs/38236081002)及 [PR Windows CI](https://github.com/Btkkgo/OrdiBot/actions/runs/38236236446)通过。运行时构建记录为 `f5cb3fe`，[PR #21](https://github.com/Btkkgo/OrdiBot/pull/21)，详见[验收与原生截图](ordibot/G6_1_ACCEPTANCE.zh-CN.md)。Windows 实际字体/上下文仍 NOT VERIFIED，真实服务 OWNER DEFERRED，无生产调用或新增 Agent 能力，完整 V1 仍 NEEDS_VALIDATION。

## Partial / 部分验证

macOS 被动感知取得真实应用名；实测窗口标题未取得，降级为仅应用元数据。提醒节流/过滤/去重及元数据附件边界有回归/源码覆盖；菜单栏入口及全局快捷键恢复为 **NOT VERIFIED**。CUA 合成快捷键尝试未展开 Chat，尚无确定原生原因；点击 Edge 恢复可用。Windows 界面/上下文验收为 **NOT RUN**。G6.1 活跃界面语言/外观在 Mac 原生验收通过。

## Blocked / 暂缓

真实 Chat、多轮、取消/错误、截图视觉与托管 Agent 服务验收为 **NOT RUN / OWNER DEFERRED**，等待用户在本地配置凭据与账户能力。代码/fixture 不能证明生产服务可用。请勿将 Key 发到公开记录或聊天。

## Designed / 设计边界

只有正式托管电脑任务 API 才算原生 Agent 集成。Meta Muse 与 Grok Bot 仅保留外部入口，未验证原生任务契约。不显示暂停、虚构时间线或假任务结果。

## Planned / 后续

用真实平台证据处理原生恢复及 Windows 11 交互验收。原主线迁移已完成。补充界面修订已有已验证的 release 构建记录、新 Windows CI 及当前二进制真实截图验收。纯文档收尾复用已验证的运行时，不再重新构建。

## Not Started / 未开始

Windows 11 交互/上下文/API 与真实生产服务验收。商业签名/公证、自由巡游宠物、金融产品与本地自主电脑引擎不在范围内。

## Next / 下一步

先使用本地助手，准备好后仅在 Models 中配置 Key 再验收真实 API。参见[基线](PRODUCT_BASELINE.zh-CN.md)、[迁移](ordibot/MIGRATION.zh-CN.md)、[服务证据](ordibot/PROVIDERS.zh-CN.md)与[路线图](open-source/ROADMAP.zh-CN.md)。Issue #17 保持开启，跟踪未验证项。

## G7.1A 安全 Model Gateway 基础

[Issue #24](https://github.com/Btkkgo/OrdiBot/issues/24)：已实现 Provider/完整端点凭据绑定及安全存储可信身份信封、不可变槽暂存与原子配置提交、本地 Chat 无凭据、禁止重定向和显式参数策略。**PASS**：105 项 TypeScript / 47 项活跃 Rust 测试、类型检查、保留源码编译兼容和独立审查。Mac 原生 release/签名在 `c5a204e` 上 PASS；同一代码提交的独立 Windows [分支](https://github.com/Btkkgo/OrdiBot/actions/runs/38269809980) / [PR CI](https://github.com/Btkkgo/OrdiBot/actions/runs/38269996025) 均 PASS。[PR #25](https://github.com/Btkkgo/OrdiBot/pull/25) 为 OPEN。详见 [G7.1A 矩阵](ordibot/G7_1A_ACCEPTANCE.zh-CN.md)。旧共享 Chat Key 保留但需主动重新输入；本轮未打开或修改既有凭据和用户数据。生产调用 **0**；真实 Chat/Vision/Remote Agent **NOT RUN / OWNER DEFERRED**。

本分支起点为 main `061d217`。[G6.2 PR #23](https://github.com/Btkkgo/OrdiBot/pull/23) 仍 OPEN，未自动合并，其原生证据保持独立。Issue #17、#22 保持 OPEN。Windows GUI 及新程序 GUI/系统凭据验收 NOT RUN。下一步：审核独立 PR；真实调用等待明确 G7.1B 批准。不自动合并或真实测试。
