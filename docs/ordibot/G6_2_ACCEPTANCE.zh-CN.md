# G6.2 V1 验收与加固

[English](G6_2_ACCEPTANCE.md) | [简体中文](G6_2_ACCEPTANCE.zh-CN.md)

2026-10-12 · [#22](https://github.com/Btkkgo/OrdiBot/issues/22) · 父 [#17](https://github.com/Btkkgo/OrdiBot/issues/17) 保持开启。基线 main `061d217`。本轮是验证任务，不代表完整 V1 通过。

## 结果定义

PASS：实际执行通过。FAIL：实际执行未达标准。NOT VERIFIED：已尝试或有代码证据，但未取得验收证据。NOT RUN：未执行。OWNER DEFERRED：用户明确暂缓，执行仍为 NOT RUN。组件/CI 与原生/真实 Provider 分开记录。

## Mac 矩阵（进行中）

| 项目 | 结果 | 证据 / 边界 |
| --- | --- | --- |
| G6.1 实际进程/构建记录/签名 | PASS | 当前 release 匹配 f5cb3fe 与 d3fa54b4… 程序；本地签名验证通过。 |
| Edge 点击/收起 | PASS | 原生探头展开 Chat，收起后探头保留。 |
| 菜单栏 | NOT VERIFIED | 工具无法读取 SystemUIServer，已请求用户操作。 |
| 全局快捷键 | NOT VERIFIED | 设置显示注册成功。向 OrdiBot/Finder 注入 Cmd+Shift+Space 未见恢复，已请求物理按键；尚无确认代码根因。 |
| 关闭/最小化/Agent/重启恢复 | NOT VERIFIED | 已检查原生 Window 菜单，完整恢复流程待验证。 |
| 当前二进制截图预览/取消/确认/移除 | NOT VERIFIED | 截图返回取消/权限错误，无附加；需用户系统授权刷新。旧 V1 二进制验收单列历史证据。 |
| 测试/类型检查 | PASS | 新执行 99 TypeScript / 37 Rust，类型检查通过。 |
| Mac release 重建 | NOT RUN | 等待最终原生构建及程序记录。 |

## Windows 矩阵

| 项目 | 结果 | 证据 / 边界 |
| --- | --- | --- |
| 真实 Windows 11 GUI 环境 | NOT RUN | 当前工具仅 macOS，未发现运行/安装的 Windows VM；未提供远程 Windows GUI。 |
| 中英文、五档字体、15 种主题组合 | NOT RUN | 必须真实 Windows GUI；不用 Mac 或测试代替。 |
| Chat/Agent/Settings、Edge 停靠/上下文 | NOT RUN | 必须真实 Windows GUI，不模拟验收。 |
| 新独立 Windows CI 原生安装包 | NOT RUN | 等待分支 workflow dispatch；构建证据单列。 |

## Provider 矩阵

| 项目 | 执行 | 决定 |
| --- | --- | --- |
| 真实 Chat / 流式 / 取消 / 错误 | NOT RUN | OWNER DEFERRED |
| Vision / 截图模型回复 | NOT RUN | OWNER DEFERRED |
| Remote Agent 提交 / 状态 / 审批 / 结果 | NOT RUN | OWNER DEFERRED |

不读取或使用生产凭据，生产 Provider 调用 0，不新增 Agent。原数据库/备份/凭据及独立机器人项目保留。私有配置副本仅本地保存。G6.1 验收单独保留。
