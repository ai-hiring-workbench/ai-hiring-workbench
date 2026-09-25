# AI Hiring Workbench

面向新兴岗位招聘的双端 AI 工作台仓库骨架。

> 当前状态：**scaffold / contract implemented**。仓库已经包含可运行 API 骨架、Schema、确定性安全规则、SQLite DDL、Mock Eval 入口和 CI；尚未接入真实模型、真实招聘数据或执行正式 Eval。

## 产品定义

当企业准备招聘一个不熟悉或快速变化的岗位时，帮助 HR 和用人经理把模糊业务需求转成经过人工确认、来源可追溯的招聘标准，再用同一标准复核简历，找出可能被关键词筛选遗漏的候选人。

同一智能底座还提供学生端：学生选择已发布的冻结标准，上传本人材料，查看逐要求证据状态、材料缺口和面试准备问题。学生端不输出录取概率。

## 架构原则

**Dual Experience, Single Intelligence Core｜双端体验、单一智能底座。**

- HR 端生产、冻结并使用岗位标准；
- 学生端只消费已发布的冻结标准；
- 两端共用证据模型、AI 合同和安全规则；
- 两端原始数据隔离；
- AI 不冻结标准，也不决定面试、淘汰或录用。

## 当前已经实现

- Fastify 应用与健康检查；
- API 路由骨架；
- Zod 核心领域 Schema；
- 文档行号和 SHA-256 标准化；
- 引用、证据不足、冻结版本、学生端录取概率等安全规则；
- SQLite Schema；
- Mock Eval 清单；
- Vitest 单元测试；
- GitHub Actions CI。

## 当前没有实现

- 真实模型接入；
- PDF／DOCX 解析；
- 完整业务页面；
- 真实 SQLite Repository；
- 授权招聘数据和独立 Gold；
- holdout 运行和效果指标；
- 生产部署。

## 快速开始

```bash
npm install
copy .env.example .env
npm run dev
```

访问：

```text
GET http://127.0.0.1:3000/health
GET http://127.0.0.1:3000/api/v1/meta
```

运行检查：

```bash
npm run typecheck
npm test
npm run eval:mock
```

`npm run eval:holdout` 当前会主动失败，因为真实数据、Gold 和冻结配置尚不存在。这是预期行为。

## 仓库结构

```text
.
├─ .github/workflows/ci.yml
├─ data/
│  ├─ public/
│  └─ private/                 # Git 忽略，不提交真实候选人材料
├─ docs/
│  ├─ architecture.md
│  ├─ api-contract.md
│  └─ eval-status.md
├─ eval/
│  ├─ datasets/
│  ├─ reports/
│  └─ eval.ts
├─ src/
│  ├─ ai/
│  ├─ api/routes/
│  ├─ core/
│  ├─ db/
│  ├─ models/
│  ├─ app.ts
│  └─ index.ts
└─ tests/
```

## 数据安全

- 不要提交真实姓名、电话、邮箱、简历原文或企业内部资料；
- `data/private/` 默认被 Git 忽略；
- 示例数据必须是获得授权并脱敏的数据，或明确标注的合成 Fixture；
- 不要把 API Key 写入代码、测试和 Git 历史。

## Eval 状态

Eval 方法和接口已定义，但正式 Eval **尚未执行**。详见 [docs/eval-status.md](docs/eval-status.md)。

## License

当前仓库尚未选择开源许可证。在确认数据、代码和赛事提交策略前，不默认授予外部使用许可。
