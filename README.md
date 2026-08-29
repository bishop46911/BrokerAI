# Broker AI Control Room

可演示的保险经纪 AI 双模块：理赔 Copilot 与中介风险预警。

仓库同时提供四个项目级 Codex Skills：知识提案、理赔评测、声明式风险规则和 AI 发布治理。所有 Skill 只生成草稿或证据，必须经过后台审批才能生效。

## 启动

```bash
npm install
npm run dev
```

打开 http://localhost:4177。默认使用确定性演示模式，无需模型密钥或数据库。项目固定使用 4177，以避开本机 Cursor 占用的 3000/3107 端口。

如需启用真实 OpenAI 兼容模型，复制 `.env.example` 为 `.env.local`，设置 `OPENAI_API_KEY`、`OPENAI_BASE_URL` 和 `OPENAI_MODEL`。兼容端点需支持 Chat Completions 的 `json_schema` 响应格式。

可选 PostgreSQL/pgvector：运行 `docker compose up -d`。当前演示数据保存在进程内；`db/schema.sql` 是生产持久化接口的明确迁移基线。

## 验证

```bash
npm test
npm run typecheck
npm run build
```

> 这是合成数据演示系统。AI 不自动判赔、拒赔或认定欺诈；所有输出都需要授权人员确认。

## Skills 与治理审批

Skills 位于仓库根目录 `.agents/skills/`：

- `$broker-claims-knowledge`：把理赔文档转换为带来源与测试的知识提案。
- `$broker-claims-eval`：针对运行中的理赔 Copilot 生成回归评测报告。
- `$broker-risk-rule`：生成白名单指标上的声明式风险规则提案。
- `$broker-ai-governance`：运行测试、类型检查和构建并形成发布建议。

在「治理审批」页面切换模拟角色，完整流程为：开发人员导入并提交 → 合规复核员批准或拒绝 → 管理员启用。角色选择仅用于演示，不是生产身份认证。
