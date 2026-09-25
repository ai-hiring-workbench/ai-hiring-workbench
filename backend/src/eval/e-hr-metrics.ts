import { CandidateReviewCard } from "../domain/types.js";

export interface EhrBenchmarkResult {
  totalCandidates: number;
  qualifiedCandidatesWithNonStandardTitle: number;
  rescuedCandidatesCount: number;
  rescueRecallRate: number; // Target >= 80%
  buzzwordStufferCount: number;
  flaggedOverestimationCount: number;
  antiOverestimationPrecision: number; // Target >= 75%
  totalCitations: number;
  validLineCitations: number;
  lineCitationGroundingRate: number; // Strict 100%
  passed: boolean;
}

export function evaluateEhrMetrics(
  cards: CandidateReviewCard[],
  groundTruth: Array<{ id: string; isQualified: boolean; hasNonStandardTitle: boolean; isBuzzwordStuffer: boolean }>
): EhrBenchmarkResult {
  let qualifiedNonStandard = 0;
  let rescued = 0;
  let buzzwordTotal = 0;
  let flaggedOverestimation = 0;
  let totalCitations = 0;
  let validLineCitations = 0;

  for (const card of cards) {
    const truth = groundTruth.find(g => g.id === card.candidateId);
    if (!truth) continue;

    if (truth.isQualified && truth.hasNonStandardTitle) {
      qualifiedNonStandard++;
      if (card.triageCategory === "PRIORITY_REVIEW" || card.isRescued) {
        rescued++;
      }
    }

    if (truth.isBuzzwordStuffer) {
      buzzwordTotal++;
      if (card.triageCategory === "NEEDS_INFO" || card.isOverestimatedRisk) {
        flaggedOverestimation++;
      }
    }

    // Verify citations
    for (const assessment of card.assessments) {
      if (assessment.anchorIds && assessment.anchorIds.length > 0) {
        totalCitations += assessment.anchorIds.length;
        // Verify line identifier format (L001 .. Lxxx)
        const valid = assessment.anchorIds.filter(id => /^L\d+$/.test(id)).length;
        validLineCitations += valid;
      }
    }
  }

  const rrr = qualifiedNonStandard > 0 ? (rescued / qualifiedNonStandard) * 100 : 100;
  const aop = buzzwordTotal > 0 ? (flaggedOverestimation / buzzwordTotal) * 100 : 100;
  const lcgr = totalCitations > 0 ? (validLineCitations / totalCitations) * 100 : 100;

  return {
    totalCandidates: cards.length,
    qualifiedCandidatesWithNonStandardTitle: qualifiedNonStandard,
    rescuedCandidatesCount: rescued,
    rescueRecallRate: rrr,
    buzzwordStufferCount: buzzwordTotal,
    flaggedOverestimationCount: flaggedOverestimation,
    antiOverestimationPrecision: aop,
    totalCitations,
    validLineCitations,
    lineCitationGroundingRate: lcgr,
    passed: rrr >= 80 && aop >= 75 && lcgr === 100
  };
}
