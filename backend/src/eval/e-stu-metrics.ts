import { StudentEvidenceReport } from "../domain/types.js";
import { EvidenceStateType } from "../domain/evidence-states.js";

export interface EstuBenchmarkResult {
  totalRubrics: number;
  matchingEvidenceStates: number;
  diagnosticAgreementRate: number; // Target >= 80%
  hasInterviewQuestions: boolean;
  prohibitedScoresPresent: boolean; // Must be false (Rule R-11)
  passed: boolean;
}

export function evaluateEstuMetrics(
  report: StudentEvidenceReport,
  goldStandard: Array<{ requirementCode: string; expectedStatus: EvidenceStateType }>
): EstuBenchmarkResult {
  let matches = 0;

  for (const rubric of report.rubricResults) {
    const gold = goldStandard.find(g => g.requirementCode === rubric.requirementCode);
    if (gold && gold.expectedStatus === rubric.evidenceStatus) {
      matches++;
    }
  }

  const agreement = goldStandard.length > 0 ? (matches / goldStandard.length) * 100 : 100;
  const hasQuestions = report.interviewPrompts && report.interviewPrompts.length >= 3;

  // Strict check for prohibited percentage score or admission probability (R-11)
  const reportObj = report as any;
  const prohibitedPresent = "matchScore" in reportObj || "admissionProbability" in reportObj || "scorePercentage" in reportObj;

  return {
    totalRubrics: goldStandard.length,
    matchingEvidenceStates: matches,
    diagnosticAgreementRate: agreement,
    hasInterviewQuestions: hasQuestions,
    prohibitedScoresPresent: prohibitedPresent,
    passed: agreement >= 80 && hasQuestions && !prohibitedPresent
  };
}
