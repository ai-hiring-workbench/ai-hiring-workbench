import type { RequirementAssessment, StudentEvidenceReport } from "../models/domain.js";

export function enforceNullLevel(
  assessment: RequirementAssessment
): RequirementAssessment {
  if (assessment.evidenceStatus !== "SUFFICIENT") {
    return { ...assessment, level: null };
  }

  return assessment;
}

export function canFreezeStandard(
  statuses: Array<{ status: "CONFIRMED" | "PENDING" | "REJECTED" }>
): boolean {
  return statuses.length > 0 && statuses.every(item => item.status === "CONFIRMED");
}

export function quoteExistsInLines(
  quoteSnapshot: string,
  lineIds: string[],
  lines: Array<{ lineId: string; rawText: string }>
): boolean {
  const selected = lines
    .filter(line => lineIds.includes(line.lineId))
    .map(line => line.rawText)
    .join(" ");

  return quoteSnapshot.trim().length > 0 && selected.includes(quoteSnapshot.trim());
}

export function assertStudentReportBoundary(report: StudentEvidenceReport): void {
  if (report.admissionProbability !== null) {
    throw new Error("Student reports must not contain an admission probability.");
  }
}
