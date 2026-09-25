# Contribution Guide

## 开始前

1. 从 `main` 拉取最新代码；
2. 每项工作使用独立分支，例如 `feat/hr-rubric-freeze`；
3. 不提交真实姓名、联系方式、原始简历、访问密钥或未获授权的数据；
4. 产品规则、字段或 Eval 口径变更必须同步更新 `docs/`。

## 本地检查

```bash
npm install
npm run typecheck
npm test
npm run build
npm run eval:mock
```

`npm run eval:mock` 只检查合同，不证明模型效果。真实数据与 Gold 未就绪前，`npm run eval:holdout` 应明确返回 `BLOCKED`。

## Pull Request 最低要求

- 说明改动解决的具体问题；
- 标注影响 HR 端、学生端、共享核心或 Eval；
- 给出实际运行过的验证命令与结果；
- 若修改字段或业务规则，列出兼容性影响；
- 不把 Mock、单元测试或接口可用误写成业务效果已验证。
