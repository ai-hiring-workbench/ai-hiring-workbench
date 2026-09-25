import { createHash } from "node:crypto";
import { ModelAdapter } from "../adapters/model-adapter.js";
import { StandardRepository } from "../infra/repositories/standard-repo.js";
import { ReviewRepository } from "../infra/repositories/review-repo.js";
import { StudentEvidenceReport } from "../domain/types.js";
import { EvidenceState } from "../domain/evidence-states.js";
import {
  validateRuleR03_VerbatimQuoteExists,
  enforceRuleR07_NullCompetencyLevel,
  validateRuleR11_NoAdmissionProbability
} from "../domain/rules.js";

export class StudentService {
  constructor(
    private modelAdapter: ModelAdapter,
    private standardRepo: StandardRepository,
    private reviewRepo: ReviewRepository
  ) {}

  async diagnoseStudentMaterial(
    rawResumeText: string,
    standardVersionId?: string,
    studentId = `STU_${Date.now()}`
  ): Promise<StudentEvidenceReport> {
    // Resolve standard: use provided or latest published frozen standard
    const standard = standardVersionId
      ? this.standardRepo.getStandard(standardVersionId)
      : this.standardRepo.getLatestFrozenStandard();

    if (!standard || standard.status !== "FROZEN") {
      throw new Error("Student self-service diagnosis must evaluate against a published FROZEN standard.");
    }

    const anonymousId = `STU_ANON_${createHash("sha256").update(studentId).digest("hex").slice(0, 8)}`;

    // Text segmentation into stable lines
    const rawLines = rawResumeText.split("\n");
    const textLines = rawLines.map((line, idx) => {
      const lineNum = `L${String(idx + 1).padStart(3, "0")}`;
      return line.startsWith("L") ? line : `${lineNum}: ${line}`;
    });

    // AI-6: Extract facts
    const facts = await this.modelAdapter.extractCandidateFacts(studentId, textLines);

    // AI-7: Link evidence against frozen standard
    let rawAssessments = await this.modelAdapter.linkEvidence(
      studentId,
      textLines,
      facts.projectEpisodes,
      facts.taskRecords,
      standard.requirements
    );

    // Enforce Rule R-07 and construct 4-state rubric results
    const rubricResults = standard.requirements.map(req => {
      const found = rawAssessments.find(a => a.requirementCode === req.code || a.requirementId === req.id);
      let status = found ? found.evidenceStatus : EvidenceState.NO_EVIDENCE;
      let level = found ? found.level : null;
      let reasons = found ? found.reasons : "Unmentioned in provided material (Null Competency).";
      let lineIds = found ? found.anchorIds : [];
      let quoteSnapshot = "";

      if (lineIds.length > 0) {
        const quotedLine = textLines.find(l => lineIds.some(id => l.startsWith(id)));
        quoteSnapshot = quotedLine ? quotedLine.replace(/^L\d+:\s*/, "") : "";
      }

      // Enforce Null Competency Level (R-07)
      if (status !== EvidenceState.SUPPORTED) {
        level = null;
      }

      let gapGuidance: string | undefined;
      if (status === EvidenceState.PARTIAL) {
        gapGuidance = "Add specific quantifiable outcomes or clarify your personal contribution vs. team efforts.";
      } else if (status === EvidenceState.MATERIAL_INSUFFICIENT) {
        gapGuidance = "Include a dedicated project episode detailing your methodology, evaluation metrics, and tools used.";
      }

      return {
        requirementCode: req.code,
        requirementName: req.name,
        evidenceStatus: status,
        level,
        lineIds,
        quoteSnapshot,
        reasons,
        gapGuidance
      };
    });

    // AI-8: Synthesize targeted interview questions
    const assessmentsForQuestions = rubricResults.map(r => ({
      requirementId: r.requirementCode,
      requirementCode: r.requirementCode,
      evidenceStatus: r.evidenceStatus,
      level: r.level as any,
      reasons: r.reasons,
      ruleIds: [],
      anchorIds: r.lineIds
    }));

    const interviewPrompts = await this.modelAdapter.synthesizeInterviewPrompts(
      standard.roleName,
      assessmentsForQuestions,
      textLines
    );

    const reportId = `REP_${Date.now()}`;
    const report: StudentEvidenceReport = {
      id: reportId,
      studentId,
      anonymousId,
      standardVersionId: standard.id,
      rubricResults,
      interviewPrompts,
      runId: `RUN_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    // Strict Rule R-11: Ensure no admission probability or percentage score is attached
    validateRuleR11_NoAdmissionProbability(report as any);

    this.reviewRepo.saveStudentReport(report);
    return report;
  }

  getStudentReport(reportId: string): StudentEvidenceReport | null {
    return this.reviewRepo.getStudentReport(reportId);
  }
}
