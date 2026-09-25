import { z } from "zod";

export const TaskClarifyRequestSchema = z.object({
  projectId: z.string().min(1),
  managerPrompt: z.string().min(10),
  department: z.string().min(1).optional()
});

export const SourceMatrixRequestSchema = z.object({
  sourceIds: z.array(z.string().min(1)).min(1)
});

export const StandardFreezeRequestSchema = z.object({
  confirmedBy: z.string().min(1),
  requirementStatuses: z.array(
    z.object({
      requirementId: z.string().min(1),
      status: z.enum(["CONFIRMED", "PENDING", "REJECTED"])
    })
  ).min(1)
});

export const CandidateBatchEvaluateRequestSchema = z.object({
  batchId: z.string().min(1),
  standardVersionId: z.string().min(1)
});

export const StudentEvaluateRequestSchema = z.object({
  standardVersionId: z.string().min(1),
  consent: z.literal(true),
  resumeText: z.string().min(20)
});
