# 操作日志

## 2025-09-22 本地社区节点重装

1. 在项目目录执行 `npm link`，将 `@302ai/n8n-nodes-302ai-chat` 重新注册为全局包。
2. 清理旧的软链接与安装目录（`~/.n8n/node_modules`、`~/.n8n/nodes/node_modules`、全局 `@302ai` 等），避免重复加载。
3. 在 `C:\Users\fengc\.n8n\custom` 下运行 `npm link @302ai/n8n-nodes-302ai-chat`，创建新的软链接。
4. 确认 `community-packages.json` 为空且数据库 `installed_packages` 无旧记录，防止社区包重复注册。
5. 移除历史全局包 `n8n-nodes-302.ai`、`@fengcch/n8n-nodes-302ai-chat`，避免旧版本被加载。
6. 安装后如需修改节点源码，记得在项目内 `npm run build` 再重复第 3 步刷新链接。

## 2025-09-22 显示名称统一

1. 将节点与凭证中所有显示文案统一为 “302.AI”。
2. 重新执行 `npm run build` 生成更新后的 `dist` 输出。
3. 可手动运行 `n8n start`，在 UI 中验证节点与凭证显示为 “302.AI”。
