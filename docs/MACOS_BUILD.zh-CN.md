# OrdiBot 本地桌面构建

[English](MACOS_BUILD.md) | [简体中文](MACOS_BUILD.zh-CN.md)

从仓库根目录执行 `npm run desktop:build`。`-- --debug` 选择 debug，否则输出 release。构建入口使用当前 OrdiBot 配置，拒绝构建中源码变动，检查原生可执行文件与本地 ad-hoc 签名，注册应用，在被忽略的 `target/ordibot-build-receipts/` 记录源码与可执行文件指纹。

release 版本启动 `target/release/bundle/macos/OrdiBot.app`。重新构建/打开前退出已运行的 OrdiBot，避免应用包替换后旧进程仍使用原可执行文件。验收前核对进程路径与最新构建记录。后续 release 构建替换同一个输出，不创建多份 OrdiBot 应用。

无需 Apple Developer 证书、Team ID、发行 Hardened Runtime、公证、stapling 或 App Store 准备。历史 OrdinConn 应用包/冻结记录、源码、私有数据和 Keychain 保留，新构建入口不清理旧资产。新标识为 `ai.ordibot.desktop`；模型密钥在本地配置，不静默导入旧密钥。

Windows 平台配置选择 NSIS 与原创 OrdiBot `.ico`。独立 Windows CI 执行测试和原生 debug 安装包构建；编译通过不代表 Windows 界面/上下文/API 行为已验收。
