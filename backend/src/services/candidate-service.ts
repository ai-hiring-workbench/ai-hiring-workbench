import { createHash } from "node:crypto";
import { ModelAdapter } from "../adapters/model-adapter.js";
import { CandidateRepository } from "../infra/repositories/candidate-repo.js";
import { StandardRepository } from "../infra/repositories/standard-repo.js";
import { ReviewRepository } from "../infra/repositories/review-repo.js";
import {
  Candidate,
  CandidateMaterial,
  CandidateReviewCard,
  ReviewTriageCategory,
  ReviewDecision
} from "../domain/types.js";
import { EvidenceState } from "../domain/evidence-states.js";
import {
  validateRuleR02_CapabilityHasAnchor,
  validateRuleR03_VerbatimQuoteExists,
  validateRuleR06_BatchBoundToFrozenStandard,
  enforceRuleR07_NullCompetencyLevel,
  validateRuleR08_AntiOverestimationAttribution,
  validateRuleR10_HumanDecisionOnly
} from "../domain/rules.js";

export class CandidateService {
  constructor(
    private modelAdapter: ModelAdapter,
    private candidateRepo: CandidateRepository,
    private standardRepo: StandardRepository,
    private reviewRepo: ReviewRepository
  ) {}

  async ingestBatchCandidates(
    standardVersionId: string,
    candidatesData: Array<{ id: string; anonymousId: string; surfaceTitle: string; rawResumeText: string }>
  ): Promise<string> {
    const standard = this.standardRepo.getStandard(standardVersionId);
    if (!standard || standard.status !== "FROZEN") {
      throw new Error(`Standard ${standardVersionId} must be FROZEN before candidate review.`);
    }

    const batchId = `BATCH_${Date.now()}`;

    for (const c of candidatesData) {
      const candidate: Candidate = {
        id: c.id,
        anonymousId: c.anonymousId,
        sourceType: "BATCH_UPLOAD",
        createdAt: new Date().toISOString()
      };
      this.candidateRepo.saveCandidate(candidate);

      // Line numbering: prefix every non-empty line with L001, L002...
      const rawLines = c.rawResumeText.split("\n");
      const textLines = rawLines.map((line, idx) => {
        const lineNum = `L${String(idx + 1).padStart(3, "0")}`;
        return line.startsWith("L") ? line : `${lineNum}: ${line}`;
      });

      const inputHash = createHash("sha256").update(c.rawResumeText).digest("hex");
      const material: CandidateMaterial = {
        id: `MAT_${c.id}`,
        candidateId: c.id,
        type: "RESUME_TEXT",
        version: 1,
        inputHash,
        textLines,
        parseStatus: "PARSED"
      };
      this.candidateRepo.saveMaterial(material);
    }

    return batchId;
  }

  async evaluateBatch(batchCandidateIds: string[], standardVersionId: string): Promise<CandidateReviewCard[]> {
    const standard = this.standardRepo.getStandard(standardVersionId);
    if (!standard || standard.status !== "FROZEN") {
      throw new Error(`Standard ${standardVersionId} must be FROZEN.`);
    }

    // Rule R-06
    validateRuleR06_BatchBoundToFrozenStandard(batchCandidateIds.map(() => standardVersionId), standardVersionId);

    const cards: CandidateReviewCard[] = [];

    for (const candidateId of batchCandidateIds) {
      const candidate = this.candidateRepo.getCandidate(candidateId);
      const material = this.candidateRepo.getMaterial(candidateId);
      if (!candidate || !material) continue;

      // AI-6: Extract facts
      const facts = await this.modelAdapter.extractCandidateFacts(candidate.id, material.textLines);

      // AI-7: Link evidence against frozen standard
      let assessments = await this.modelAdapter.linkEvidence(
        candidate.id,
        material.textLines,
        facts.projectEpisodes,
        facts.taskRecords,
        standard.requirements
      );

      // Enforce Deterministic Safety Rules
      assessments = assessments.map(a => {
        // R-02
        validateRuleR02_CapabilityHasAnchor(a);
        // R-07
        let enforced = enforceRuleR07_NullCompetencyLevel(a);
        // R-08
        const episodeText = facts.projectEpisodes.map(e => `${e.problem} ${e.personalAction} ${e.artifact}`).join(" ");
        enforced = validateRuleR08_AntiOverestimationAttribution(enforced, episodeText);
        return enforced;
      });

      // Triage Classification
      const supportedCount = assessments.filter(a => a.evidenceStatus === EvidenceState.SUPPORTED).length;
      const partialCount = assessments.filter(a => a.evidenceStatus === EvidenceState.PARTIAL).length;
      const hasCoreSupported = assessments.some(
        a => (a.requirementCode === "AIPM-AP4" || a.requirementCode === "AIPM-AP1") && a.evidenceStatus === EvidenceState.SUPPORTED
      );
      const hasOverestimationAlert = assessments.some(a => a.reasons.includes("CONTRIBUTION_UNCLEAR"));

      let triageCategory: ReviewTriageCategory = "NOT_SUPPORTED";
      let triageReason = "";
      let isRescued = false;
      let isOverestimatedRisk = false;

      if (hasOverestimationAlert) {
        triageCategory = "NEEDS_INFO";
        triageReason = "Candidate resume contains buzzwords lacking verifiable individual execution (Rule R-08 Overestimation Defense).";
        isOverestimatedRisk = true;
      } else if (hasCoreSupported && supportedCount >= 2) {
        triageCategory = "PRIORITY_REVIEW";
        triageReason = "Candidate possesses verified personal execution in core requirements (AIPM-AP4 / AP1). Rescued from conventional ATS filters.";
        isRescued = true;
      } else if (supportedCount >= 1 || partialCount >= 2) {
        triageCategory = "STANDARD_REVIEW";
        triageReason = "Candidate meets basic requirements for standard human review.";
      } else {
        triageCategory = "NOT_SUPPORTED";
        triageReason = "No transferable AI application execution evidence found in material.";
      }

      const card: CandidateReviewCard = {
        candidateId: candidate.id,
        anonymousId: candidate.anonymousId,
        standardVersionId,
        triageCategory,
        triageReason,
        isRescued,
        isOverestimatedRisk,
        assessments,
        taskRecords: facts.taskRecords,
        projectEpisodes: facts.projectEpisodes,
        generatedAt: new Date().toISOString()
      };

      this.reviewRepo.saveReviewCard(card);
      cards.push(card);
    }

    return cards;
  }

  recordDecision(decision: ReviewDecision): void {
    // Rule R-10: Only HR_USER can record human decisions
    validateRuleR10_HumanDecisionOnly(decision);
    this.reviewRepo.saveDecision(decision);
  }

  getReviewCard(candidateId: string): CandidateReviewCard | null {
    return this.reviewRepo.getReviewCard(candidateId);
  }

  listReviewCards(standardVersionId?: string): CandidateReviewCard[] {
    return this.reviewRepo.listReviewCards(standardVersionId);
  }
}
