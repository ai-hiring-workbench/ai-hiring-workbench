# Frontend API & Integration Master Guide

> **Target Directory:** `main project file/docs/frontend-api-integration.md`  
> **Status:** Living Document (Actively Maintained & Updatable)  
> **Backend Base URL:** `http://127.0.0.1:3000/api/v1`  
> **Architecture:** Dual Experience, Single Intelligence Core (HR Port + Student Port)

---

## 1. Document Version & Change Tracking Ledger

This ledger tracks all API contracts, frontend environment keys, and endpoint schema updates.

| Version | Date (UTC) | Author | Changes & Updates | Compatibility |
| :---: | :---: | :---: | :--- | :---: |
| **v1.0.0** | 2026-09-25 | Antigravity AI | Initial release: Full dual-port API directory, Vite env template, and TypeScript interfaces | Backend v1.0.0 |

---

## 2. Frontend Environment Keys Template (`.env.local`)

Place this file in your frontend root directory (`main project file/frontend/.env.local`).

```bash
# ==============================================================================
# 1. Backend API Endpoint
# ==============================================================================
VITE_API_BASE_URL=http://127.0.0.1:3000/api/v1

# ==============================================================================
# 2. Supabase Client Configuration (Public Keys Only)
# ==============================================================================
# Your Supabase Project URL (from Supabase Dashboard -> Project Settings -> API)
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Public anonymous client key (SAFE to expose in frontend browser code)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key

# Storage Bucket for direct PDF/DOCX resume file uploads
VITE_SUPABASE_STORAGE_BUCKET=resumes
```

### ⚠️ Critical Security Rules for Frontend Integration:
1. **NEVER expose `DEEPSEEK_API_KEY` on the frontend**: The frontend never calls DeepSeek directly. All AI analysis, claim extraction, and evidence reasoning must route through the backend Fastify server.
2. **NEVER expose `SUPABASE_SERVICE_ROLE_KEY` on the frontend**: Only use `VITE_SUPABASE_ANON_KEY`. The `service_role` key bypasses all Row Level Security and is reserved exclusively for the backend.
3. **Strict Rule R-11**: The frontend UI is prohibited from displaying arbitrary percentage scores (e.g. "82% Match") or admission probabilities. It must render the **4 Discrete Evidence States** (`SUPPORTED`, `PARTIAL`, `MATERIAL_INSUFFICIENT`, `NO_EVIDENCE`).

---

## 3. Complete API Endpoint Directory

All endpoints are prefixed with `/api/v1`.

### 3.1 HR Port Endpoints (Standard Formulation & Candidate Omission Review)

#### A. Ingest & Clarify Business Demand
* **Endpoint**: `POST /api/v1/tasks/clarify`
* **Request Body**:
  ```json
  {
    "department": "AI Application Incubation",
    "targetRole": "Junior / Intern AI Application Product Manager",
    "rawDescription": "Our customer support team needs an intern to curate badcase datasets, write prompt templates, and measure answer accuracy."
  }
  ```
* **Response** (`200 OK`):
  ```json
  {
    "id": "TASK_1740000000",
    "department": "AI Application Incubation",
    "targetRole": "Junior / Intern AI Application Product Manager",
    "businessProblem": "Customer support copilot has 25% hallucination rate; lack dedicated person to curate badcases.",
    "targetUsers": ["Internal support reps", "External customers"],
    "deliverables": ["300 QA benchmark dataset", "5 prompt templates", "Weekly accuracy dashboard"],
    "constraints": ["No model training / CUDA required", "Strong Excel/JSON data cleaning"],
    "openQuestions": ["What is the target adoption rate?"]
  }
  ```

#### B. Ingest Source Documents
* **Endpoint**: `POST /api/v1/sources/ingest`
* **Request Body**:
  ```json
  {
    "type": "INTERNAL_ROUGH_JD",
    "title": "Lead Rough Notes",
    "publisher": "Tech Lead",
    "date": "2026-09-01",
    "rawText": "Needs to understand LLMs, ideally has used ChatGPT or Claude. Analyze badcases and tweak prompts."
  }
  ```
* **Response** (`201 Created`):
  ```json
  {
    "document": { "id": "SRC_1740000000", "title": "Lead Rough Notes" },
    "claims": [
      {
        "id": "CLM_SRC_1",
        "claimType": "REQUIREMENT",
        "statement": "Candidate should understand LLMs.",
        "quoteSnapshot": "Needs to understand LLMs, ideally has used ChatGPT or Claude."
      }
    ]
  }
  ```

#### C. Cross-Source Claim Matrix & Conflict Adjudication
* **Endpoint**: `POST /api/v1/sources/matrix`
* **Response** (`200 OK`): Returns claim matrix and detected contradictions across sources.

#### D. Draft Standard
* **Endpoint**: `POST /api/v1/standards/draft`
* **Request Body**:
  ```json
  {
    "taskContextId": "TASK_1740000000",
    "roleName": "Junior / Intern AI Application Product Manager",
    "department": "AI Application Incubation"
  }
  ```

#### E. Cryptographically Freeze Standard
* **Endpoint**: `POST /api/v1/standards/:id/freeze`
* **Request Body**:
  ```json
  {
    "confirmedBy": "HR_DIRECTOR_NAME"
  }
  ```
* **Response** (`200 OK`): Returns immutable standard with `SHA-256` snapshot hash and generated search expressions.
* **Error** (`409 Conflict`): If any requirement remains unconfirmed (`PENDING`), returns `409 STANDARD_NOT_READY` (Rule R-04).

#### F. Batch Ingest Resumes for HR Omission Review
* **Endpoint**: `POST /api/v1/candidates/batch-ingest`
* **Request Body**:
  ```json
  {
    "standardVersionId": "STD_FROZEN_ID",
    "candidates": [
      {
        "id": "CAND_01",
        "anonymousId": "ANON_01",
        "surfaceTitle": "Customer Operations Specialist",
        "rawResumeText": "L001: Profile ... \nL005: Curated 800+ QA pairs."
      }
    ]
  }
  ```

#### G. Execute Batch Evaluation & Omission Triage
* **Endpoint**: `POST /api/v1/candidates/batch-evaluate`
* **Request Body**:
  ```json
  {
    "batchId": "BATCH_ID",
    "standardVersionId": "STD_FROZEN_ID"
  }
  ```
* **Response** (`200 OK`): Returns review cards with triage categories:
  - `PRIORITY_REVIEW`: Rescued qualified candidates (False Negatives).
  - `NEEDS_INFO`: Buzzword stuffers lacking personal execution (Overestimation Defense).
  - `STANDARD_REVIEW`: Standard matches.
  - `NOT_SUPPORTED`: No transferable AI evidence.

#### H. Record HR Human Decision
* **Endpoint**: `POST /api/v1/decisions`
* **Request Body**:
  ```json
  {
    "candidateId": "CAND_01",
    "standardVersionId": "STD_FROZEN_ID",
    "decision": "ADVANCE_TO_INTERVIEW",
    "actor": "HR_USER",
    "actorId": "HR_MANAGER_ID",
    "note": "Rescued candidate verified with strong prompt engineering evidence."
  }
  ```

---

### 3.2 Student Port Endpoints (Self-Service Evidence Diagnosis)

#### A. Run Student Resume Evidence Diagnosis
* **Endpoint**: `POST /api/v1/student/diagnose`
* **Request Body**:
  ```json
  {
    "rawResumeText": "L001: [Profile] Alex Zhang\nL006: 2. Authored structured extraction prompt with dictionary constraints.\nL007: 3. Tested on 120 posts.\nL009: 5. Manually verified 30 sample responses.",
    "standardVersionId": "STD_FROZEN_ID",
    "consentGiven": true
  }
  ```
* **Response** (`200 OK`):
  ```json
  {
    "id": "REP_1740000000",
    "studentId": "STU_1740000000",
    "anonymousId": "STU_ANON_a1b2c3d4",
    "standardVersionId": "STD_FROZEN_ID",
    "rubricResults": [
      {
        "requirementCode": "AIPM-AP1",
        "requirementName": "Prompt Engineering & Constraints",
        "evidenceStatus": "SUPPORTED",
        "level": "PROFICIENT",
        "lineIds": ["L006"],
        "quoteSnapshot": "2. Authored structured extraction prompt with dictionary constraints.",
        "reasons": "Constructed structured extraction prompts with explicit dictionary constraints."
      },
      {
        "requirementCode": "AIPM-AP2",
        "requirementName": "Badcase Curation",
        "evidenceStatus": "PARTIAL",
        "level": null,
        "lineIds": ["L007"],
        "quoteSnapshot": "3. Tested on 120 posts.",
        "gapGuidance": "Add specific quantifiable outcomes or clarify your personal contribution."
      },
      {
        "requirementCode": "AIPM-AP4",
        "requirementName": "Quantitative Metric Evaluation",
        "evidenceStatus": "MATERIAL_INSUFFICIENT",
        "level": null,
        "lineIds": ["L009"],
        "quoteSnapshot": "5. Manually verified 30 sample responses.",
        "gapGuidance": "Include a dedicated project episode detailing your evaluation metrics."
      }
    ],
    "interviewPrompts": [
      "In your project, you manually inspected 30 samples. If scaling to 5,000 inquiries, how would you design an automated evaluation metric like Precision or Recall?",
      "When you identified recurring errors, what steps did you take to categorize root causes?"
    ],
    "createdAt": "2026-09-25T02:00:00.000Z"
  }
  ```

#### B. Fetch Saved Diagnosis Report
* **Endpoint**: `GET /api/v1/student/reports/:id`

---

## 4. Frontend TypeScript Types (Copy Directly to Frontend Code)

```typescript
// types/api.ts

export type EvidenceState = "SUPPORTED" | "PARTIAL" | "MATERIAL_INSUFFICIENT" | "NO_EVIDENCE";

export type ReviewTriageCategory = "PRIORITY_REVIEW" | "NEEDS_INFO" | "STANDARD_REVIEW" | "NOT_SUPPORTED";

export interface RubricResult {
  requirementCode: string;
  requirementName: string;
  evidenceStatus: EvidenceState;
  level: string | null;
  lineIds: string[];
  quoteSnapshot: string;
  reasons: string;
  gapGuidance?: string;
}

export interface StudentEvidenceReport {
  id: string;
  studentId: string;
  anonymousId: string;
  standardVersionId: string;
  rubricResults: RubricResult[];
  interviewPrompts: string[];
  createdAt: string;
}

export interface CandidateReviewCard {
  candidateId: string;
  anonymousId: string;
  standardVersionId: string;
  triageCategory: ReviewTriageCategory;
  triageReason: string;
  isRescued: boolean;
  isOverestimatedRisk: boolean;
  assessments: Array<{
    requirementCode: string;
    evidenceStatus: EvidenceState;
    level: string | null;
    reasons: string;
    anchorIds: string[];
  }>;
  generatedAt: string;
}
```

---

## 5. Direct Supabase Storage File Upload Helper

For direct browser-to-bucket uploads of candidate PDF/Word files:

```typescript
// lib/supabase-storage.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "resumes";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadResumeToStorage(file: File): Promise<{ storageKey: string; publicUrl: string }> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `resumes/${fileName}`;

  const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file);

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return { storageKey: data.path, publicUrl: publicData.publicUrl };
}
```
