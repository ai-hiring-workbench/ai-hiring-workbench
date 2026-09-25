import { z } from "zod";
import { EvidenceState } from "./evidence-states.js";

// ==========================================
// 1. Task Context Schemas
// ==========================================
export const TaskClarifyRequestSchema = z.object({
  department: z.string().min(1, "Department is required"),
  targetRole: z.string().min(1, "Target role is required"),
  rawDescription: z.string().min(10, "Raw description must be at least 10 characters")
});

export const EnterpriseTaskContextSchema = z.object({
  id: z.string().optional(),
  department: z.string(),
  targetRole: z.string(),
  businessProblem: z.string(),
  targetUsers: z.array(z.string()),
  deliverables: z.array(z.string()),
  constraints: z.array(z.string()),
  openQuestions: z.array(z.string()).optional()
});

export const TaskConfirmRequestSchema = z.object({
  context: EnterpriseTaskContextSchema,
  confirmedBy: z.string().min(1, "ConfirmedBy is required")
});

// ==========================================
// 2. Source Documents & Claims Schemas
// ==========================================
export const SourceIngestRequestSchema = z.object({
  type: z.enum(["INTERNAL_ROUGH_JD", "INDUSTRY_BENCHMARK", "TEAM_CONSTRAINTS", "OTHER"]),
  title: z.string().min(1),
  publisher: z.string().min(1),
  date: z.string(),
  rawText: z.string().min(10)
});

export const SourceClaimSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  claimType: z.enum(["REQUIREMENT", "DELIVERABLE", "CONSTRAINT", "PREFERENCE"]),
  statement: z.string(),
  sourceExcerptIds: z.array(z.string()).min(1, "Claim must cite at least one source excerpt (R-01)"),
  quoteSnapshot: z.string(),
  hasContradiction: z.boolean().optional(),
  contradictionNote: z.string().optional()
});

// ==========================================
// 3. Standards & Freezing Schemas
// ==========================================
export const RoleRequirementSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  definition: z.string(),
  evidenceRequired: z.string(),
  status: z.enum(["DRAFT", "PENDING", "CONFIRMED"]),
  confirmedBy: z.string().optional()
});

export const FreezeStandardRequestSchema = z.object({
  standardId: z.string(),
  confirmedBy: z.string().min(1, "Sign-off user is required to freeze standard (R-04)")
});

export const SearchExpressionSetSchema = z.object({
  id: z.string(),
  standardVersionId: z.string(),
  titleTerms: z.array(z.string()),
  taskTerms: z.array(z.string()),
  skillTerms: z.array(z.string()),
  exclusionTerms: z.array(z.string()),
  booleanQuery: z.string(),
  humanEdited: z.boolean().default(false)
});

// ==========================================
// 4. Candidate Review Schemas
// ==========================================
export const CandidateBatchIngestSchema = z.object({
  standardVersionId: z.string().min(1, "Batch must bind to a frozen standard version (R-06)"),
  candidates: z.array(
    z.object({
      id: z.string(),
      anonymousId: z.string(),
      surfaceTitle: z.string(),
      rawResumeText: z.string().min(10)
    })
  ).min(1, "Candidate batch must contain at least 1 candidate")
});

export const CandidateBatchEvaluateSchema = z.object({
  batchId: z.string(),
  standardVersionId: z.string()
});

export const ReviewDecisionSchema = z.object({
  candidateId: z.string(),
  standardVersionId: z.string(),
  decision: z.enum(["ADVANCE_TO_INTERVIEW", "HOLD_FOR_INFO", "REJECT"]),
  actor: z.literal("HR_USER", {
    errorMap: () => ({ message: "AI cannot write hiring decisions (R-10). Must be HR_USER." })
  }),
  actorId: z.string().min(1),
  note: z.string().default("")
});

// ==========================================
// 5. Student Diagnosis Schemas
// ==========================================
export const StudentDiagnosisRequestSchema = z.object({
  studentId: z.string().optional(),
  standardVersionId: z.string().optional(),
  rawResumeText: z.string().min(20, "Resume text must be at least 20 characters"),
  consentGiven: z.boolean().refine(val => val === true, {
    message: "Candidate consent is required to process diagnostic materials"
  })
});

// Prohibits percentage match score and admission probability (R-11)
export const StudentEvidenceReportSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  anonymousId: z.string(),
  standardVersionId: z.string(),
  rubricResults: z.array(
    z.object({
      requirementCode: z.string(),
      requirementName: z.string(),
      evidenceStatus: z.nativeEnum(EvidenceState),
      level: z.string().nullable(),
      lineIds: z.array(z.string()),
      quoteSnapshot: z.string(),
      reasons: z.string(),
      gapGuidance: z.string().optional()
    })
  ),
  interviewPrompts: z.array(z.string()).max(5),
  runId: z.string(),
  createdAt: z.string()
}).refine(data => {
  // Strict R-11 assertion: object must NOT contain matchScore or admissionProbability
  const anyData = data as Record<string, unknown>;
  return anyData.matchScore === undefined && anyData.admissionProbability === undefined;
}, {
  message: "Student evidence report must not output match scores or admission probabilities (R-11)"
});
