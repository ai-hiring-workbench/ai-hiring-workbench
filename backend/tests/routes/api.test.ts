import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { buildApp } from "../../src/server.js";
import { MockAdapter } from "../../src/adapters/mock-adapter.js";
import { StandardRepository } from "../../src/infra/repositories/standard-repo.js";

describe("Fastify REST API Routes End-to-End", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp(new MockAdapter());
    await app.ready();

    const stdRepo = new StandardRepository();
    stdRepo.saveStandard({
      id: "STD_DEFAULT_FROZEN",
      version: 1,
      status: "FROZEN",
      roleName: "Junior AI PM",
      department: "AI Incubation",
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      confirmedBy: "LEAD_SYS",
      frozenAt: new Date().toISOString(),
      requirements: [
        {
          id: "REQ_AIPM_01",
          code: "AIPM-AP1",
          name: "Prompt Engineering & In-Context Constraint Design",
          definition: "Authored structured system prompts.",
          evidenceRequired: "Candidate materials must show authored prompt templates.",
          status: "CONFIRMED"
        },
        {
          id: "REQ_AIPM_04",
          code: "AIPM-AP4",
          name: "Quantitative Metric Evaluation & Iteration",
          definition: "Designing gold evaluation scorecards.",
          evidenceRequired: "Verifiable comparative scores or benchmark datasets.",
          status: "CONFIRMED"
        }
      ]
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns ok", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health"
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("ok");
  });

  it("POST /api/v1/tasks/clarify structures business input", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/tasks/clarify",
      payload: {
        department: "AI Incubation",
        targetRole: "Junior AI PM",
        rawDescription: "Need someone to evaluate chatbot accuracy and tune prompt templates."
      }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.businessProblem).toBeDefined();
    expect(body.deliverables.length).toBeGreaterThan(0);
  });

  it("POST /api/v1/sources/ingest parses source document", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/sources/ingest",
      payload: {
        type: "INTERNAL_ROUGH_JD",
        title: "Team Notes",
        publisher: "Lead",
        date: "2026-09-01",
        rawText: "Needs to understand LLMs, ideally has used ChatGPT or Claude. Analyze badcases."
      }
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.document.id).toBeDefined();
    expect(body.claims.length).toBeGreaterThan(0);
  });

  it("POST /api/v1/student/diagnose returns 4-state diagnostic report", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/student/diagnose",
      payload: {
        rawResumeText: "L006: 2. Authored structured extraction prompt.\nL007: 3. Tested on 120 posts.\nL009: 5. Manually verified 30 sample responses.",
        consentGiven: true
      }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.rubricResults.length).toBeGreaterThan(0);
    expect(body.interviewPrompts.length).toBeGreaterThanOrEqual(3);
    // Strict R-11 assertion: no matchScore or admissionProbability
    expect(body.matchScore).toBeUndefined();
    expect(body.admissionProbability).toBeUndefined();
  });

  it("POST /api/v1/decisions enforces HR_USER actor (R-10)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/decisions",
      payload: {
        candidateId: "CAND_01",
        standardVersionId: "STD_01",
        decision: "ADVANCE_TO_INTERVIEW",
        actor: "AI_ROBOT", // Invalid actor -> must fail validation
        actorId: "AI",
        note: "Passed"
      }
    });
    expect(res.statusCode).toBe(400);
  });
});
