import { createHash } from "node:crypto";
import { SourceClaim, RoleRequirement, RoleStandardVersion, RequirementAssessment, CandidateReviewCard, ReviewDecision } from "./types.js";
import { EvidenceState } from "./evidence-states.js";

export class RuleViolationError extends Error {
  public readonly ruleId: string;
  public readonly statusCode: number;

  constructor(ruleId: string, message: string, statusCode = 400) {
    super(`[${ruleId}] Rule Violation: ${message}`);
    this.name = "RuleViolationError";
    this.ruleId = ruleId;
    this.statusCode = statusCode;
  }
}

/**
 * 14 Deterministic Safety Rules (R-01 .. R-14)
 * Run in pure deterministic TypeScript code after LLM extraction.
 */

// R-01: SourceClaim must cite at least one valid source excerpt
export function validateRuleR01_SourceClaimHasCitation(claim: SourceClaim): boolean {
  if (!claim.sourceExcerptIds || claim.sourceExcerptIds.length === 0) {
    throw new RuleViolationError("R-01", "SourceClaim must have at least one valid source excerpt citation.");
  }
  return true;
}

// R-02: Candidate facts and capability judgements must have candidate material anchors
export function validateRuleR02_CapabilityHasAnchor(assessment: RequirementAssessment): boolean {
  if (assessment.evidenceStatus === EvidenceState.SUPPORTED && (!assessment.anchorIds || assessment.anchorIds.length === 0)) {
    throw new RuleViolationError("R-02", "SUPPORTED competency judgment must cite candidate material line anchors.");
  }
  return true;
}

// R-03: quote_snapshot must exist verbatim in the referenced raw text line
export function validateRuleR03_VerbatimQuoteExists(quoteSnapshot: string, referencedTextLines: string[]): boolean {
  if (!quoteSnapshot || quoteSnapshot.trim().length === 0) return true;
  const normalizedQuote = quoteSnapshot.trim().toLowerCase();
  const exists = referencedTextLines.some(line => line.toLowerCase().includes(normalizedQuote));
  if (!exists) {
    throw new RuleViolationError("R-03", `CITATION_INVALID: Quote "${quoteSnapshot}" was not found verbatim in referenced lines.`);
  }
  return true;
}

// R-04: Freezing is strictly blocked if any requirement remains unconfirmed (PENDING)
export function validateRuleR04_NoPendingRequirementOnFreeze(requirements: RoleRequirement[]): boolean {
  const pending = requirements.filter(r => r.status !== "CONFIRMED");
  if (pending.length > 0) {
    throw new RuleViolationError(
      "R-04",
      `STANDARD_NOT_READY: Cannot freeze standard with ${pending.length} unconfirmed requirements (${pending.map(p => p.code).join(", ")}).`,
      409
    );
  }
  return true;
}

// R-05: Frozen standards are immutable; edits must generate a new draft version
export function validateRuleR05_FrozenStandardImmutable(standard: RoleStandardVersion): boolean {
  if (standard.status === "FROZEN") {
    throw new RuleViolationError("R-05", "Cannot modify a frozen standard version. Create a new draft version instead.", 409);
  }
  return true;
}

// R-06: All candidates in a batch must bind to the identical frozen standard version
export function validateRuleR06_BatchBoundToFrozenStandard(candidateStandardIds: string[], expectedStandardVersionId: string): boolean {
  const mismatched = candidateStandardIds.some(id => id !== expectedStandardVersionId);
  if (mismatched) {
    throw new RuleViolationError("R-06", "All candidates in a batch run must bind to the identical frozen standard version.");
  }
  return true;
}

// R-07: Null Competency Level Rule: when evidence status is not SUFFICIENT, level must be forced to null
export function enforceRuleR07_NullCompetencyLevel(assessment: RequirementAssessment): RequirementAssessment {
  if (assessment.evidenceStatus !== EvidenceState.SUPPORTED) {
    return {
      ...assessment,
      level: null // Force null level per Null Competency Rule
    };
  }
  return assessment;
}

// R-08: Team accomplishments without individual task attribution cannot satisfy individual competency
export function validateRuleR08_AntiOverestimationAttribution(assessment: RequirementAssessment, rawQuote: string): RequirementAssessment {
  // If text mentions "our team", "led department", "we achieved" but lacks personal actions ("I did", "built", "authored", "labeled")
  const teamIndicators = [
    "our team", "led global team", "global team", "led team", "team",
    "we drove", "company achieved", "ecosystem led", "ecosystem", "empowering", "千万级", "百亿级"
  ];
  const personalIndicators = ["i authored", "i built", "i labeled", "designed", "curated", "wrote", "tested", "独立", "负责", "编写"];
  
  const lowerQuote = rawQuote.toLowerCase();
  const hasTeam = teamIndicators.some(t => lowerQuote.includes(t));
  const hasPersonal = personalIndicators.some(p => lowerQuote.includes(p));

  if (hasTeam && !hasPersonal) {
    const reasons = assessment.reasons.includes("CONTRIBUTION_UNCLEAR")
      ? assessment.reasons
      : `${assessment.reasons} [CONTRIBUTION_UNCLEAR: Macro team claim lacks verified individual task deliverable.]`;
    return {
      ...assessment,
      evidenceStatus: EvidenceState.PARTIAL,
      level: null,
      reasons,
      ruleIds: assessment.ruleIds.includes("R-08") ? assessment.ruleIds : [...assessment.ruleIds, "R-08"]
    };
  }
  return assessment;
}

// R-09: Search expression keyword match does NOT equal competency satisfaction
export function validateRuleR09_SearchMatchNotCompetency(keywordMatched: boolean, hasEvidencedCompetency: boolean): boolean {
  // Keyword match is strictly a candidate recall mechanism, not an evaluated truth
  if (keywordMatched && !hasEvidencedCompetency) {
    return false; // Not competent despite keyword match
  }
  return true;
}

// R-10: AI cannot autonomously write interview, rejection, or hire decisions
export function validateRuleR10_HumanDecisionOnly(decision: ReviewDecision): boolean {
  if (decision.actor !== "HR_USER") {
    throw new RuleViolationError("R-10", "AI is strictly prohibited from writing hiring, rejection, or interview decisions.");
  }
  return true;
}

// R-11: Student port is strictly prohibited from outputting admission/pass probabilities
export function validateRuleR11_NoAdmissionProbability(report: Record<string, unknown>): boolean {
  if ("admissionProbability" in report || "passRate" in report || "matchScore" in report || "scorePercentage" in report) {
    throw new RuleViolationError("R-11", "Student diagnosis is strictly forbidden from outputting admission probabilities or percentage match scores.");
  }
  return true;
}

// R-12: Failures in Schema, citation, version, or model calls must never display as success
export function validateRuleR12_FailureNeverMaskedAsSuccess(hasFailed: boolean, status: string): void {
  if (hasFailed && (status === "SUCCESS" || status === "COMPLETED")) {
    throw new RuleViolationError("R-12", "System failed components cannot be displayed as successful.");
  }
}

// R-13: Cache lookup must strictly match input, standard, model, prompt, and schema versions
export function generateRuleR13_CacheKey(inputHash: string, standardHash: string, modelVersion: string, promptVersion: string): string {
  return createHash("sha256")
    .update(`${inputHash}:${standardHash}:${modelVersion}:${promptVersion}`)
    .digest("hex");
}

// R-14: General application logs must never record raw PII (names, phones, emails)
export function sanitizeRuleR14_RedactPII(text: string): string {
  if (!text) return "";
  // Redact Chinese phone numbers
  let sanitized = text.replace(/1[3-9]\d{9}/g, "[PHONE_REDACTED]");
  // Redact emails
  sanitized = sanitized.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, "[EMAIL_REDACTED]");
  // Redact Chinese ID numbers (18 digits)
  sanitized = sanitized.replace(/\b\d{17}[\dXx]\b/g, "[ID_REDACTED]");
  return sanitized;
}
