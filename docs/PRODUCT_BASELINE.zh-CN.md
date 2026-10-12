# OrdiBot V1 产品基线

[English](PRODUCT_BASELINE.md) | [简体中文](PRODUCT_BASELINE.zh-CN.md)

2026-10-12 生效。用户已确认的 OrdiBot V1 方向替代历史金融、Android 自主操作与独立桌面宠物定义。当前范围为 **Your Desktop AI Companion**：Chat Window、Context Assistant、Remote Agent Workspace。

Chat 为深色小型悬浮窗口，使用 Chat/Context/Agent/History/Models/Settings 窄导航、柔白文字、圆角输入和窗口旁的小型原创二维角色。角色与 Chat 一起移动、收起。Agent 在同一原生窗口展开深色工作台，使用克制的紫色渐变、真实状态和可折叠服务记录；切回 Chat 恢复窗口位置与尺寸。独立宠物运行时、金融 Dashboard、本地自主电脑操作引擎和自建云端虚拟机不在范围内。

上下文按用户意愿获取：优先复制文字，其次确认截图，再按平台能力主动获取前台应用/窗口元数据。不持续监控；权限缺失时降级为复制文字或手动附件。附件属于不可信源材料。模型不得声称访问未收到的屏幕或文件。

普通对话复用 Model Gateway 与 OpenAI-compatible API。配置包括 Provider、Base URL、系统安全存储的 API Key、Model ID、视觉能力和输出限制。默认直接回答实际问题，普通问题优先 1–3 句话，未要求时不独立研究。提供 Concise/Normal/Detailed。流式回复、取消、超时、重试错误须明确；生产入口无模拟回答。

远程电脑任务交给具有正式接口的托管服务。普通模型聊天或打开服务网站不能代表电脑 Agent 接入。状态、记录、批准和结果必须来自服务，只显示支持的控制。首个 OpenAI 适配器支持公开只读浏览器任务和网站来源批准，不支持登录或自定义工具执行。提交结果不明确时不自动重复。用户应在本地核查权限、最新价格和账户限额。

macOS Apple Silicon 优先交付，Windows 独立编译与测试。允许本地 ad-hoc 签名；Apple Developer、公证、App Store 和商业发行不在范围。中文沟通与当前界面；重要公开记录英文主版配套中文。英文界面本地化待办。

保留原仓库、refs、Stars、Issues/PRs、私有 SQLite、密钥与独立实体机器人项目。同一个仓库更名 OrdiBot，不重建、不重写历史。新产品存储明确保留旧命名空间；退役代码可恢复，但不进入默认原生/前端运行时。

**验收边界：**用户已决定本地配置密钥后再进行 Chat/视觉/托管 Agent 真实 API 验收。继续 UI、本地能力和适配器测试，不将 G2/G3 标记为完整通过。Windows 编译与交互/API 验收分别记录。参见[当前状态](CURRENT_STATUS.zh-CN.md)。
