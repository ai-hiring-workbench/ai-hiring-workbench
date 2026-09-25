import { EvidenceStateType } from "./evidence-states.js";

// ==========================================
// 1. Role Standard Entities
// ==========================================
export type StandardStatus = "DRAFT" | "PENDING_CONFIRMATION" | "FROZEN" | "SUPERSEDED";

export interface EnterpriseTaskContext {
  id?: string;
  department: string;
  targetRole: string;
  businessProblem: string;
  targetUsers: string[];
  deliverables: string[];
  constraints: string[];
  openQuestions?: string[];
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface SourceDocument {
  id: string;
  type: "INTERNAL_ROUGH_JD" | "INDUSTRY_BENCHMARK" | "TEAM_CONSTRAINTS" | "OTHER";
  title: string;
  publisher: string;
  date: string;
  inputHash: string;
  textLines: string[];
}

export interface SourceClaim {
  id: string;
  sourceId: string;
  claimType: "REQUIREMENT" | "DELIVERABLE" | "CONSTRAINT" | "PREFERENCE";
  statement: string;
  sourceExcerptIds: string[];
  quoteSnapshot: string;
  hasContradiction?: boolean;
  contradictionNote?: string;
}

export interface RoleRequirement {
  id: string;
  code: string; // e.g. AIPM-AP1
  name: string;
  definition: string;
  evidenceRequired: string;
  status: "DRAFT" | "PENDING" | "CONFIRMED";
  confirmedBy?: string;
}

export interface RoleStandardVersion {
  id: string;
  version: string;
  status: StandardStatus;
  roleName: string;
  department: string;
  requirements: RoleRequirement[];
  hash: string; // SHA-256 snapshot
  confirmedBy: string;
  frozenAt?: string;
  supersededBy?: string;
}

export interface SearchExpressionSet {
  id: string;
  standardVersionId: string;
  titleTerms: string[];
  taskTerms: string[];
  skillTerms: string[];
  exclusionTerms: string[];
  booleanQuery: string;
  humanEdited: boolean;
}

// ==========================================
// 2. Candidate & Material Entities
// ==========================================
export interface Candidate {
  id: string;
  anonymousId: string;
  sourceType: "BATCH_UPLOAD" | "STUDENT_SELF_SERVICE";
  createdAt: string;
}

export interface CandidateMaterial {
  id: string;
  candidateId: string;
  type: "RESUME_PDF" | "RESUME_DOCX" | "RESUME_TEXT" | "PROJECT_REPORT";
  version: number;
  inputHash: string;
  storageKey?: string; // Supabase Storage key
  textLines: string[]; // ['L001: ...', 'L002: ...']
  parseStatus: "PARSED" | "FAILED";
}

export interface CandidateEvidenceAnchor {
  id: string;
  materialId: string;
  lineIds: string[]; // e.g. ['L005', 'L008']
  quoteSnapshot: string;
}

export interface TaskRecord {
  id: string;
  action: string;
  object: string;
  deliverable: string;
  metric?: string;
  anchorIds: string[];
}

export interface ProjectEpisode {
  id: string;
  problem: string;
  decision?: string;
  personalAction: string;
  artifact?: string;
  validation?: string;
  iteration?: string;
  anchorIds: string[];
}

export type ReviewTriageCategory = "PRIORITY_REVIEW" | "NEEDS_INFO" | "STANDARD_REVIEW" | "NOT_SUPPORTED";

export interface RequirementAssessment {
  requirementId: string;
  requirementCode: string;
  evidenceStatus: EvidenceStateType;
  level: "PROFICIENT" | "FAMILIAR" | null;
  reasons: string;
  ruleIds: string[];
  anchorIds: string[];
}

export interface CandidateReviewCard {
  candidateId: string;
  anonymousId: string;
  standardVersionId: string;
  triageCategory: ReviewTriageCategory;
  triageReason: string;
  isRescued: boolean;
  isOverestimatedRisk: boolean;
  assessments: RequirementAssessment[];
  taskRecords: TaskRecord[];
  projectEpisodes: ProjectEpisode[];
  generatedAt: string;
}

export interface ReviewDecision {
  id: string;
  candidateId: string;
  standardVersionId: string;
  decision: "ADVANCE_TO_INTERVIEW" | "HOLD_FOR_INFO" | "REJECT";
  actor: "HR_USER"; // Strict Rule R-10: Never AI
  actorId: string;
  timestamp: string;
  note: string;
}

// ==========================================
// 3. Student Self-Service Diagnosis
// ==========================================
export interface StudentEvidenceReport {
  id: string;
  studentId: string;
  anonymousId: string;
  standardVersionId: string;
  rubricResults: {
    requirementCode: string;
    requirementName: string;
    evidenceStatus: EvidenceStateType;
    level: string | null;
    lineIds: string[];
    quoteSnapshot: string;
    reasons: string;
    gapGuidance?: string;
  }[];
  interviewPrompts: string[];
  runId: string;
  createdAt: string;
}
