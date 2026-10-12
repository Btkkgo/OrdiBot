# G7.1A 安全 Model Gateway 验收

[English](G7_1A_ACCEPTANCE.md) | [简体中文](G7_1A_ACCEPTANCE.zh-CN.md)

2026-10-12 · [Issue #24](https://github.com/Btkkgo/OrdiBot/issues/24)。基于 main `061d217`；[G6.2 PR #23](https://github.com/Btkkgo/OrdiBot/pull/23) 仍为 OPEN、未合并，不视为 main 已验证证据。Issue #17、#22 保持 OPEN。

## 安全修复

- Chat 凭据绑定规范化 Provider 名称和完整规范 URL（协议、主机、有效端口及完整 API 基础路径）。模型 ID 和参数变化不改变凭据身份。修改 Provider/端点会清除当前绑定；切回旧地址不会自动恢复旧 Key。
- 新 Chat 凭据槽在系统安全存储内包含可信身份与密钥信封。可编辑 JSON 仅保存身份及 UUID 槽指针；伪造 JSON 身份并保留旧槽不能将旧密钥绑定到新地址。此边界不防御已能修改系统凭据存储或以用户身份执行任意代码的攻击者。
- 不导入或覆盖旧共享 Chat Key；云端使用前须在 Models 主动重新输入。旧 Remote 凭据继续走隔离的固定 Provider 路径。本轮未读取或修改既有凭据。
- loopback 模式（localhost 及末尾点、IPv4 127/8、IPv6 回环与映射回环）不读取 Chat Key。即使调用 Gateway 时传入 Key，也不添加 Authorization。UI 禁用本地 Chat Key 输入；原生保存拒绝本地 Chat Key。仅 loopback 允许明文 HTTP，拒绝 URL 内凭据、查询及片段。
- Chat 完整/流式请求及 Remote HTTP 客户端禁止所有重定向。HTTPS 云端端点仍需用户信任；保留 TLS 验证，不自动迁移端点或重定向兜底。
- 保存先暂存新不可变 Chat/Remote 槽，再原子持久化配置与绑定指针，成功后才更新内存。首次/第二次凭据写入及 JSON 持久化失败均保留已提交配置和旧槽。失败或中断可能遗留未引用的**新**槽；保留而不自动使用，不执行删除既有凭据的清理。UI 显示真实保存错误，修改 Provider/端点清空未保存 Chat Key，保存期间禁用编辑。
- 三种显式参数策略：standard 发送 temperature + max_tokens；completion 不发 temperature、使用 max_completion_tokens；no-temperature 不发 temperature、使用 max_tokens。它们只控制请求形状，不证明真实模型兼容。旧配置/请求默认 standard；两处保留旧请求构造仅增加默认字段以保持可编译，不启动旧运行时。

## 验收矩阵

| 项目 | 结果 | 证据与边界 |
| --- | --- | --- |
| 凭据隔离及 JSON 篡改 | PASS | 内存凭据 Fixture 覆盖 Provider/主机/端口/路径变化、可信信封校验、不采用旧共享 Chat Key、本地不读槽。 |
| 保存失败及恢复 | PASS | 首次/第二次槽写入和缺失父目录持久化失败保留旧状态；临时配置重载保留绑定及参数；JSON 不包含 Fixture 密钥。未打开既有用户数据。 |
| HTTP 安全 | PASS | 真实 loopback HTTP Fixture 拒绝 307，目标未被访问；仅构造云端请求检查 Authorization，本地变体不带认证。不建立云端连接。 |
| 参数兼容 | PASS | 请求策略仅发送一个 token 字段并按策略省略 temperature；设置传递策略。仅协议形状验证。 |
| TypeScript | PASS | npm test：105 项（desktop 96 + contracts 9），包括原有 G6.1 语言/主题/排版/生命周期回归。 |
| Rust | PASS | cargo test --locked：47 项默认活跃成员测试（Gateway 26 + native desktop 21）。 |
| 保留源码兼容 | PASS | cargo check --locked -p agent-runtime -p ordinconn-app --offline；仅编译，不启动旧运行时。 |
| 类型检查 | PASS | npm run typecheck。 |
| 独立审查 | PASS | 安全及兼容问题修复后复核，无剩余阻塞项。 |
| Mac 原生构建/签名 | NOT RUN | 等待当前分支构建。 |
| Windows 独立 CI | NOT RUN | 等待当前分支运行；CI 不等于 GUI 验收。 |
| 新二进制 Mac GUI / 原生凭据操作 | NOT RUN | 本轮保护既有凭据，未执行；原有 G6.1 证据保持历史边界。 |
| Windows 11 GUI | NOT RUN | 未使用真实 Windows GUI。 |
| 真实 Chat / Vision / Remote Agent | NOT RUN / OWNER DEFERRED | 生产 Provider 调用 **0**；也未请求真实 Ollama 或执行远程任务。 |

未修改依赖、旧数据库、备份、历史记录、原创宠物素材或独立实体机器人项目，未删除任何历史数据。原生测试仅使用临时目录和内存凭据槽；自动测试不证明真实 API 可用或系统凭据集成已通过。旧 G6.1 原生 UI 验收不改写为新 G7.1A 程序 PASS。

## G7.1B 所需授权

需用户明确批准 Provider、完整端点、模型及限定真实测试范围。Key 仅在本地输入，不发送到聊天或公开记录。云端调用前批准请求数、token 及费用上限，并核实现行价格和账户能力。本地 Ollama 也需要明确测试授权。Chat 授权不包含截图/Vision、Remote Agent、权限变更或合并 PR；流式取消仍可能产生服务端计费。本任务在这些操作前停止。
