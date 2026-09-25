# 团队协作规范 | Team Collaboration Guidelines

面向团队成员的开发流程、分支管理与提交规范。  
*Development workflow, branch management, and PR guidelines for all contributors.*

---

## 1. 分支规范 / Branching Strategy

从最新的 `main` 分支拉取自己的任务分支，禁止直接向 `main` 推送未评审代码：  
*Always branch off latest `main`. Pushing unreviewed code directly to `main` is strictly prohibited:*

* **新功能 / Features:** `feat/<task-name>`
* **问题修复 / Bug Fixes:** `fix/<issue-name>`
* **文档更新 / Documentation:** `docs/<doc-name>`
* **评测与数据 / Benchmark & Eval:** `eval/<task-name>`

---

## 2. 开发与验证流程 / Workflow & Verification

1. **领取任务 / Claim Issue:** 明确交付物与验收标准后再开始。  
   *Clarify deliverables and acceptance criteria before coding.*
2. **本地验证 / Local Verification:** 提交代码前，确保本地通过编译检查与测试：  
   *Before opening a PR, ensure all checks pass:*
   ```bash
   cd backend
   npm run build   # 验证 TypeScript 编译无报错 / Verify zero compile errors
   npm test        # 运行自动化单元测试 / Run automated test suites
   ```
3. **接口变更对齐 / Sync API Changes:** 若涉及字段或路由变更，需提前更新 `docs/` 并通知前后端队友。  
   *If modifying API schemas or routes, update docs and notify teammates beforehand.*

---

## 3. Pull Request 提交要求 / PR Checklist

提交 PR 时需清晰说明以下内容：  
*Every Pull Request description must clearly outline:*

- [ ] **问题描述 / Problem:** 解决了什么具体需求或问题。  
      *What problem does this PR solve?*
- [ ] **改动目录 / Changes:** 修改了哪些核心目录与文件。  
      *Which directories and files were modified?*
- [ ] **验证结果 / Verification:** 本地测试输出与运行截图。  
      *Proof of passing tests and local verification results.*
- [ ] **无敏感信息 / Security Check:** 确认没有包含任何 API Key、真实个人简历或未授权资料。  
      *Confirmed zero API keys, raw resumes, or private PII included.*

---

## 4. 数据与合规底线 / Data & Compliance Boundaries

* **数据脱敏 / Privacy:** 严禁将真实姓名、电话、邮箱上传至 Git 历史；示例数据仅使用合成或完全脱敏材料。  
  *Never commit real candidate names, phones, emails, or raw resumes.*
* **密钥安全 / Secret Safety:** API Key 仅保存在本地 `.env`，已被 `.gitignore` 保护，严禁入库。  
  *API keys must remain strictly in local `.env` and never be committed.*
* **人机边界 / Human in the Loop:** AI 输出仅作为辅助复核建议，用人经理与 HR 拥有最终裁决权。  
  *AI provides review assistance only; humans hold final hiring authority.*
