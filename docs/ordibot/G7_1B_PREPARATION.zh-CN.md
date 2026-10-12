# G7.1B 原生验收与首次 Chat 准备

[English](G7_1B_PREPARATION.md) | [简体中文](G7_1B_PREPARATION.zh-CN.md)

2026-10-12 UTC。**PREPARATION ONLY，生产 Provider 请求 0。** 未合并、提交、推送、关闭 Issue、读取真实 Key、请求 Ollama 或操作 Remote Agent。本报告仅保存在本地，等待所有者授权公开；不追溯改写 G7.1A 历史验收。

## 基线与合并建议

- 最新 main 为 `061d217a8043f5508ec2a7cc8244e7bb196476e1`；本地分支 `codex/ordibot-g7-1a`，HEAD `4ed310fb110619859dda9b7c074745a0074347b3`。保留既有未跟踪工作及独立实体机器人项目。未修改产品源代码、依赖或数据库。
- [PR #23](https://github.com/Btkkgo/OrdiBot/pull/23)：OPEN，对当前 main 为 MERGEABLE/CLEAN，head `842054d`。11 个文件仅为文档、两张证据图和计划，没有产品、依赖、结构或安全边界变化。GitHub Review 和未解决审查线程均为空，不等于审核批准。当前 head 无关联检查；[独立 Windows dispatch](https://github.com/Btkkgo/OrdiBot/actions/runs/38257016271) 在 `350d2ca` 上 PASS，后续提交仅修改文档。须保留 G6.2 原生关闭/最小化/窗口标题缺口、Windows GUI NOT RUN 和服务 OWNER DEFERRED。
- [PR #25](https://github.com/Btkkgo/OrdiBot/pull/25)：OPEN，对当前 main 为 MERGEABLE/CLEAN，head `4ed310f`。[最新独立 Windows PR CI](https://github.com/Btkkgo/OrdiBot/actions/runs/38270756265) 在当前精确 head 上 SUCCESS：TypeScript、Rust、类型检查、NSIS 构建与上传。GitHub Review/线程为空；此前工程审查作为独立证据。
- 只读 merge-tree 检查发现四份共同文档：两份 Current Status 能文本合并，两份 `docs/devlog/2026-10-12*` 存在实际冲突。各自对 main 的 CLEAN 不证明两 PR 之间无冲突。

建议：#23 可以作为所有者批准后的文档收尾合并，继续保留 V1 未完成项及 Issue #17/#22。先按仓库受控本地 noreply 身份流程合并 #23，再向 #25 分支追加普通 main 合并；保留两阶段 DevLog，双语核对 Current Status，更新 PR #23 的当前状态。不 rebase、不强推。对结果 head 重跑针对性测试、类型、安全/diff 和 Windows CI，核对 Mac 源码指纹；若运行时代码变化，重建并重验相关原生项。再次审核 #25 后，单独取得其合并授权。**本轮没有执行任何合并或推送。**

## Mac 原生验收矩阵

使用已有 G7.1A 原生 release，代码提交 `c5a204e`，程序 SHA-256 `aa5f87f6ec9d284d0ea86a950f570aa9edb0d4f46f54cb91e829ec10921df9b8`；本轮重新核对哈希与严格临时签名。没有重建或更改系统权限。

启动前私有备份原配置，备份权限 0600。临时标记配置只使用保留的 `.invalid` 地址及专用 loopback Fixture，只创建新 UUID 测试凭据槽，不读取、覆盖或删除既有槽。测试 Remote 指针阻止旧 Remote Key 回退；没有提交任务。正常退出后恢复原配置的字节、SHA、权限及时间戳；应用保持退出。私有备份和新暂存槽继续留在本机。

| 验收项 | 结果 | 实际证据与限制 |
| --- | --- | --- |
| 原生启动、正常退出、重启 | PASS | 启动为 Edge；原生 Command-Q 后进程消失；同一包重启恢复设置。 |
| 配置保存与恢复 | PASS | 测试 Provider、Endpoint、Model、256 输出、standard、关闭 Vision 均持久化并重启显示。 |
| macOS Keychain 写入/读取 | PASS | Models 原生密码框写入新槽；重启后原生 UI 读到凭据。使用当前凭据/存储代码的辅助程序仅读取标记的新测试槽，输出匹配布尔值，不输出凭据。 |
| Provider / Endpoint 隔离 | PASS | 更换 Provider 后 Key 不再有效，切回旧 Provider 也不自动恢复。重新输入测试 Key 后修改 Endpoint，再次失效。 |
| loopback 不携带云端 Authorization | PASS | 原生 Chat 向专用 127.0.0.1 Fixture 发出一次 `/v1/chat/completions` POST：无 Authorization、无附件、仅受控测试文本、standard、256 输出。两段模拟 SSE 在界面显示明确标记 LOCAL FIXTURE 的答案，不是实际 AI 验收。 |
| 配置持久化失败 | PASS | 仅将 Fixture 目标暂时替换为空目录，让原子重命名失败。UI 显示真实错误、不显示已保存；返回 Models 仍为之前已提交身份/凭据，前后辅助检查一致。新的无引用槽保留。 |
| 原生 Keychain 写入失败 | NOT RUN | 未诱导系统写入拒绝，不把自动化失败 Fixture 当作原生证据。 |
| Edge / Chat / 空 Agent 导航 | PASS | 收起保留 Edge，点击恢复含 Fixture 对话的 Chat；空 Agent 工作台可进入并返回 Chat/Models，不提交远程任务。 |
| 停靠边缘、垂直位置、Chat 尺寸 | PASS | 边缘和垂直值、586×951 保存尺寸保持稳定。 |
| 原始绝对窗口坐标完全不变 | FAIL | 最终原生 Fixture 坐标与原始保存坐标不同。现有 `position_chat_at_edge` 按工作区和停靠位置计算坐标；本次变化的确切原因 NOT VERIFIED。没有改动产品；结束后原配置连同原坐标完整恢复。这不证明 G7.1A 引入回归。 |
| 既有数据保留 | PASS | 原配置字节/哈希/权限/时间戳恢复，测试全程空任务历史未变，没有删除旧凭据或备份。 |
| 非空历史的原生回归 | NOT VERIFIED | 原存储聊天/任务均为零；Fixture 对话能保存，但不能证明非空旧历史迁移验收。 |
| Windows 11 GUI | NOT RUN | CI 只证明构建与测试。 |
| 真实 Chat / Vision / Remote Agent | NOT RUN / OWNER DEFERRED | 生产请求 0，未发送附件或远程任务。 |

本地证据在忽略目录 `target/ordibot-g71b-native-evidence/`，包括安全的 Keychain 比较、本地请求布尔记录、恢复结果、测试日志；私有存储副本不得暂存或上传。UI 动作另有本任务工具轨迹。

## 测试与调用前门禁

- 本轮 `npm test`：105 PASS（桌面 96 + contracts 9）；`cargo test --locked --offline`：47 项活跃测试 PASS（Gateway 26 + 桌面 21）；`npm run typecheck`：PASS。复用代码未变的 G7.1A 原生包，重新验证哈希/签名，不宣称本轮重新构建。
- 公开仓库安全扫描、已跟踪 diff、新双语文档链接/格式检查 PASS。四份新本地报告/DevLog 未提交、未公开，已跟踪文件保持不变。
- 源码边界：`companion_credentials.rs::chat_key_for/save_settings`、`companion_store.rs::persist`、`companion_commands.rs::build_request/chat_send`、`openai_compatible.rs::build_chat_request/ChatStreamNormalizer/request_builder`。保持禁止重定向，活跃原生 Chat 路径没有自动重试。
- 待批准、**没有实际应用**的配置：OpenAI；`https://api.openai.com/v1`；POST `https://api.openai.com/v1/chat/completions`；`gpt-4.1-mini-2025-04-14`；standard；关闭 Vision；每次最多输出 256。官方[模型文档](https://developers.openai.com/api/docs/models/gpt-4.1-mini)列出该快照、Chat Completions 和 streaming。[Chat 参考](https://developers.openai.com/api/reference/resources/chat)说明 temperature 与输出字段；`max_tokens` 已弃用且不支持 o 系列。对本非推理模型的兼容是文档预期，不是账户/API 实测 PASS。
- 账户模型权限、余额、适用服务档位和真实连通性：**NOT VERIFIED**，需所有者本地检查。本轮未发起认证模型列表或其他 Provider 请求。
- 256 输出已通过原生 Fixture 序列化检查。当前输入限制为 40 条历史和单条大小，没有小额输入 Token 闸门。未来必须新建受控对话，无旧历史/附件；输入预算须包括系统提示和前轮回复。
- 当前 UI **没有三次请求硬计数器或美元预算闸门**。未来操作须维护记录，逐次请求，将失败/未知结果也计为已消耗次数，不点重试，最多三次且首次错误即停止。这属于操作流程限制。硬计数器需另行批准实现和回归后才能用于真实调用。
- Streaming 请求未设置 `stream_options.include_usage`；解析器要求存在 choice，原生事件循环只处理正文/完成/错误。Token 用量、request ID、返回 model ID、延迟尚未保存或展示；只增加 include_usage 会在官方空 choices 用量块上失败。精确用量需要另行批准最小修改，或所有者在本机账户查看；否则用量/实际费用记 NOT VERIFIED，不追加 API 请求补取指标。

## 待授权实际流程与费用

在所有者明确批准并解决/接受上述限制后：

1. 所有者本地确认账户权限和余额，并亲自在 Models 输入云端 Key；核对完整绑定端点、模型、参数和关闭 Vision。
2. 新 Chat，无上下文/附件：`Reply with ORBIT-READY only.` 记录一次尝试、墙钟延迟、可见流式和完成/失败。
3. 同一 Chat：`What exact token did you reply with?` 记录第二次尝试，检查是否反映前轮。
4. 新 Chat：`What is 2 + 2? Reply in five words or fewer.` 记录第三次。此前出现错误则提前结束，不重试、不额外制造错误请求。不附加私人历史、截图、剪贴板、文件、工具或 Agent 任务。

记录尝试序号、配置模型与可获得的返回模型、结果、流式观察、耗时、安全错误、用量是否可获得及估算费用。以上文本和记录仅为计划，没有执行真实请求。

官方 [GPT-4.1 mini 价格](https://developers.openai.com/api/docs/models/gpt-4.1-mini)：标准价格下每百万未缓存输入 Token $0.40，输出 $1.60。**假设每次输入不超过 1,000 Token**，三次均输出满 256 Token，约 **$0.0024288**；这是条件估算，不是已实施的输入上限。768 输出 Token 单项为 $0.0012288。适用档位、实际输入和账单可能不同；取消/失败也不证明零费用。**USD 0.10 仍是用户提出的费用上限，不是程序硬预算。**

需要所有者分别决定：#23 及协调后 #25 的合并/推送；批准最小用量/计数改动还是接受所述流程限制；账户准备和本地 Key 输入；最后明确批准指定模型/端点、无附件/Agent、最多三次尝试、256 输出及费用预期。仅批准准备阶段不授权真实调用。Issue #17/#22 保持 OPEN。本阶段到此停止。
