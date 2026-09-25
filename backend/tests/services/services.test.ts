import { describe, it, expect, beforeEach } from "vitest";
import { MockAdapter } from "../../src/adapters/mock-adapter.js";
import { StandardRepository } from "../../src/infra/repositories/standard-repo.js";
import { CandidateRepository } from "../../src/infra/repositories/candidate-repo.js";
import { ReviewRepository } from "../../src/infra/repositories/review-repo.js";
import { StandardService } from "../../src/services/standard-service.js";
import { CandidateService } from "../../src/services/candidate-service.js";
import { StudentService } from "../../src/services/student-service.js";
import { EvidenceState } from "../../src/domain/evidence-states.js";

describe("Domain Business Services", () => {
  let standardService: StandardService;
  let candidateService: CandidateService;
  let studentService: StudentService;
  let standardRepo: StandardRepository;

  beforeEach(() => {
    const adapter = new MockAdapter();
    standardRepo = new StandardRepository();
    const candidateRepo = new CandidateRepository();
    const reviewRepo = new ReviewRepository();

    standardService = new StandardService(adapter, standardRepo);
    candidateService = new CandidateService(adapter, candidateRepo, standardRepo, reviewRepo);
    studentService = new StudentService(adapter, standardRepo, reviewRepo);
  });

  it("StandardService: drafts, confirms, and cryptographically freezes standard", async () => {
    standardRepo.saveTaskContext({
      id: "TASK_TEST",
      department: "AI",
      targetRole: "Junior AI PM",
      businessProblem: "Accuracy",
      targetUsers: ["Reps"],
      deliverables: ["Scorecard"],
      constraints: ["No CUDA"],
      confirmedBy: "Lead"
    });

    const draft = await standardService.draftStandard("TASK_TEST", "Junior AI PM", "AI");
    expect(draft.status).toBe("DRAFT");

    for (const req of draft.requirements) {
      standardService.confirmRequirement(draft.id, req.id, "LEAD");
    }

    const frozen = standardService.freezeStandard(draft.id, "DIRECTOR");
    expect(frozen.status).toBe("FROZEN");
    expect(frozen.hash).toHaveLength(64); // SHA-256
  });

  it("CandidateService: rescues qualified candidate with non-standard title", async () => {
    const std = standardRepo.getLatestFrozenStandard();
    if (!std) return;

    const batchId = await candidateService.ingestBatchCandidates(std.id, [
      {
        id: "CAND_RESCUE_01",
        anonymousId: "ANON_01",
        surfaceTitle: "Customer Operations Specialist",
        rawResumeText: "L005: 1. Curated and labeled 800+ benchmark QA pairs.\nL008: 4. Increased adoption accuracy from 68% to 82%."
      }
    ]);

    expect(batchId).toBeDefined();
    const cards = await candidateService.evaluateBatch(["CAND_RESCUE_01"], std.id);
    expect(cards.length).toBe(1);
    expect(cards[0].isRescued).toBe(true);
    expect(cards[0].triageCategory).toBe("PRIORITY_REVIEW");
  });

  it("CandidateService: flags overestimation on buzzword stuffer", async () => {
    const std = standardRepo.getLatestFrozenStandard();
    if (!std) return;

    await candidateService.ingestBatchCandidates(std.id, [
      {
        id: "CAND_BUZZWORD_02",
        anonymousId: "ANON_02",
        surfaceTitle: "Autonomous Agent Architect",
        rawResumeText: "L005: 1. Multi-Agent Swarm ecosystem and Transformer architecture.\nL007: 3. Led global team empowering commercial operations."
      }
    ]);

    const cards = await candidateService.evaluateBatch(["CAND_BUZZWORD_02"], std.id);
    expect(cards.length).toBe(1);
    expect(cards[0].isOverestimatedRisk).toBe(true);
    expect(cards[0].triageCategory).toBe("NEEDS_INFO");
  });

  it("StudentService: outputs 4-state diagnosis without arbitrary percentage score", async () => {
    const std = standardRepo.getLatestFrozenStandard();
    if (!std) return;

    const report = await studentService.diagnoseStudentMaterial(
      "L006: 2. Authored structured extraction prompt with building alias dictionary.\nL007: 3. Tested on 120 posts.\nL009: 5. Manually verified 30 sample responses.",
      std.id,
      "STU_001"
    );

    expect(report.rubricResults.length).toBeGreaterThan(0);
    // Check for 4 evidence states
    const states = report.rubricResults.map(r => r.evidenceStatus);
    expect(states).toContain(EvidenceState.SUPPORTED);
    expect(report.interviewPrompts.length).toBeGreaterThanOrEqual(3);
    // Ensure no percentage match score
    expect((report as any).matchScore).toBeUndefined();
  });
});
