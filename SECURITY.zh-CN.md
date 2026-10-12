# 安全政策

[English](SECURITY.md) | [简体中文](SECURITY.zh-CN.md)

## 报告漏洞

不要在公开 GitHub Issue 中披露可利用细节、凭据、客户数据、私人账户信息或复现所需的 Secret。

当仓库支持 GitHub 私密漏洞报告时，请使用该功能。如果不可用，只创建一个请求私密报告渠道的公开 Issue；不要包含漏洞细节。

## 敏感材料

不得提交 API Key、Access/Refresh Token、密码、Cookie、Session、私钥、SSH Key、钱包恢复短语、验证码、个人身份记录、银行信息或私有应用 Capture。

## 范围

安全报告可涉及上下文权限绕过、密钥暴露、截图/历史泄露、不安全的托管任务批准、伪造服务状态或公开同步检查绕过。

修复后，项目会记录脱敏后的修复和验证结果。若 Secret 已暴露，公开删除 Commit 不等于完成处置；必须先轮换或撤销该 Secret。
