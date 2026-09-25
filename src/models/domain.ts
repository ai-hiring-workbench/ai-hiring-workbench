import { z } from "zod";

export const EvidenceStatusSchema = z.enum([
  "SUFFICIENT",
  "PARTIAL",
  "MATERIAL_INSUFFICIENT",
  "NO_EVIDENCE",
  "CONFLICTING"
]);

export const StudentEvidenceStatusSchema = z.enum([
  "SUPPORTED",
  "PARTIAL",
  "MATERIAL_INSUFFICIENT",
  "NO_EVIDENCE"
]);

export const StandardStatusSchema = z.enum([
  "DRAFT",
  "PENDING_CONFIRMATION",
  "FROZEN",
  "SUPERSEDED"
]);

export const NumberedLineSchema = z.object({
  lineId: z.string().regex(/^L\d{3,}$/),
  rawText: z.string()
});

export const EvidenceAnchorSchema = z.object({
  id: z.string().min(1),
  materialId: z.string().min(1),
  lineIds: z.array(z.string()).min(1),
  quoteSnapshot: z.string().min(1)
});

export const RequirementAssessmentSchema = z.object({
  requirementId: z.string().min(1),
  evidenceStatus: EvidenceStatusSchema,
  level: z.string().nullable(),
  reasons: z.array(z.string()),
  anchorIds: z.array(z.string())
});

export const StudentRubricResultSchema = z.object({
  requirementCode: z.string().min(1),
  status: StudentEvidenceStatusSchema,
  anchorIds: z.array(z.string()),
  reason: z.string()
});

export const StudentEvidenceReportSchema = z.object({
  standardVersionId: z.string().min(1),
  rubricResults: z.array(StudentRubricResultSchema),
  interviewPrompts: z.array(z.string()),
  admissionProbability: z.null()
});

export type RequirementAssessment = z.infer<typeof RequirementAssessmentSchema>;
export type StudentEvidenceReport = z.infer<typeof StudentEvidenceReportSchema>;
