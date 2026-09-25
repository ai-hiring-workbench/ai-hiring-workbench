import { describe, it, expect } from "vitest";
import {
  validateRuleR01_SourceClaimHasCitation,
  validateRuleR02_CapabilityHasAnchor,
  validateRuleR03_VerbatimQuoteExists,
  validateRuleR04_NoPendingRequirementOnFreeze,
  validateRuleR05_FrozenStandardImmutable,
  validateRuleR06_BatchBoundToFrozenStandard,
  enforceRuleR07_NullCompetencyLevel,
  validateRuleR08_AntiOverestimationAttribution,
  validateRuleR09_SearchMatchNotCompetency,
  validateRuleR10_HumanDecisionOnly,
  validateRuleR11_NoAdmissionProbability,
  validateRuleR12_FailureNeverMaskedAsSuccess,
  generateRuleR13_CacheKey,
  sanitizeRuleR14_RedactPII,
  RuleViolationError
} from "../../src/domain/rules.js";
import { EvidenceState } from "../../src/domain/evidence-states.js";

describe("Deterministic Safety Rules (R-01 .. R-14)", () => {
  it("R-01: throws if SourceClaim has no source excerpt citations", () => {
    expect(() =>
      validateRuleR01_SourceClaimHasCitation({
        id: "C1",
        sourceId: "S1",
        claimType: "REQUIREMENT",
        statement: "Must know Python",
        sourceExcerptIds: [],
        quoteSnapshot: ""
      })
    ).toThrow(RuleViolationError);
  });

  it("R-02: throws if SUPPORTED competency lacks candidate line anchors", () => {
    expect(() =>
      validateRuleR02_CapabilityHasAnchor({
        requirementId: "REQ1",
        requirementCode: "AIPM-AP1",
        evidenceStatus: EvidenceState.SUPPORTED,
        level: "PROFICIENT",
        reasons: "Good candidate",
        ruleIds: [],
        anchorIds: []
      })
    ).toThrow(RuleViolationError);
  });

  it("R-03: throws if quote_snapshot does not exist in referenced text lines", () => {
    expect(() =>
      validateRuleR03_VerbatimQuoteExists("hallucinated quote", ["L001: real text", "L002: other text"])
    ).toThrow(RuleViolationError);
  });

  it("R-04: throws 409 if freezing a standard with PENDING requirements", () => {
    expect(() =>
      validateRuleR04_NoPendingRequirementOnFreeze([
        { id: "1", code: "AP1", name: "P1", definition: "", evidenceRequired: "", status: "CONFIRMED" },
        { id: "2", code: "AP2", name: "P2", definition: "", evidenceRequired: "", status: "PENDING" }
      ])
    ).toThrow(RuleViolationError);
  });

  it("R-05: throws if attempting to mutate a FROZEN standard", () => {
    expect(() =>
      validateRuleR05_FrozenStandardImmutable({
        id: "STD1",
        version: "v1.0",
        status: "FROZEN",
        roleName: "AI PM",
        department: "AI",
        requirements: [],
        hash: "hash",
        confirmedBy: "HR"
      })
    ).toThrow(RuleViolationError);
  });

  it("R-06: throws if candidate batch has mismatched standard versions", () => {
    expect(() =>
      validateRuleR06_BatchBoundToFrozenStandard(["STD_A", "STD_B"], "STD_A")
    ).toThrow(RuleViolationError);
  });

  it("R-07: forces level to null when evidence is not SUPPORTED", () => {
    const enforced = enforceRuleR07_NullCompetencyLevel({
      requirementId: "REQ1",
      requirementCode: "AIPM-AP1",
      evidenceStatus: EvidenceState.PARTIAL,
      level: "PROFICIENT",
      reasons: "Some work",
      ruleIds: [],
      anchorIds: ["L001"]
    });
    expect(enforced.level).toBeNull();
  });

  it("R-08: flags overestimation and demotes macro team claims without personal execution", () => {
    const demoted = validateRuleR08_AntiOverestimationAttribution(
      {
        requirementId: "REQ1",
        requirementCode: "AIPM-AP1",
        evidenceStatus: EvidenceState.SUPPORTED,
        level: "PROFICIENT",
        reasons: "Good candidate",
        ruleIds: [],
        anchorIds: ["L001"]
      },
      "Our team spearheaded multi-agent ecosystem and company achieved 300% GMV"
    );
    expect(demoted.evidenceStatus).toBe(EvidenceState.PARTIAL);
    expect(demoted.reasons).toContain("CONTRIBUTION_UNCLEAR");
  });

  it("R-09: search keyword match does not equal competency satisfaction", () => {
    const isCompetent = validateRuleR09_SearchMatchNotCompetency(true, false);
    expect(isCompetent).toBe(false);
  });

  it("R-10: throws if decision actor is not HR_USER", () => {
    expect(() =>
      validateRuleR10_HumanDecisionOnly({
        id: "DEC1",
        candidateId: "CAND1",
        standardVersionId: "STD1",
        decision: "ADVANCE_TO_INTERVIEW",
        actor: "AI_SYSTEM" as any,
        actorId: "AI",
        timestamp: new Date().toISOString(),
        note: ""
      })
    ).toThrow(RuleViolationError);
  });

  it("R-11: throws if student report contains matchScore or admissionProbability", () => {
    expect(() =>
      validateRuleR11_NoAdmissionProbability({
        studentId: "STU1",
        matchScore: 82,
        admissionProbability: 0.75
      })
    ).toThrow(RuleViolationError);
  });

  it("R-12: throws if failed component is marked as SUCCESS", () => {
    expect(() =>
      validateRuleR12_FailureNeverMaskedAsSuccess(true, "SUCCESS")
    ).toThrow(RuleViolationError);
  });

  it("R-13: generates deterministic cache key from versions", () => {
    const key1 = generateRuleR13_CacheKey("h1", "std1", "v3", "p1");
    const key2 = generateRuleR13_CacheKey("h1", "std1", "v3", "p1");
    expect(key1).toBe(key2);
  });

  it("R-14: redacts phone numbers and email addresses from text", () => {
    const raw = "Contact Zhang at 13812345678 or test.pm@example.com for interview.";
    const sanitized = sanitizeRuleR14_RedactPII(raw);
    expect(sanitized).not.toContain("13812345678");
    expect(sanitized).not.toContain("test.pm@example.com");
    expect(sanitized).toContain("[PHONE_REDACTED]");
    expect(sanitized).toContain("[EMAIL_REDACTED]");
  });
});
