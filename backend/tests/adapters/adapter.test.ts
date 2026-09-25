import { describe, it, expect } from "vitest";
import { MockAdapter } from "../../src/adapters/mock-adapter.js";
import { DeepSeekAdapter } from "../../src/adapters/deepseek-adapter.js";

describe("Model Adapter Layer", () => {
  it("MockAdapter clarifies task into structured context", async () => {
    const adapter = new MockAdapter();
    const result = await adapter.clarifyTask("AI Dept", "Junior AI PM", "Need an intern to tune prompts");
    expect(result.businessProblem).toBeDefined();
    expect(result.deliverables.length).toBeGreaterThan(0);
    expect(result.constraints.length).toBeGreaterThan(0);
  });

  it("MockAdapter extracts claims with valid quote snapshots", async () => {
    const adapter = new MockAdapter();
    const claims = await adapter.extractClaims({
      id: "S1",
      type: "INTERNAL_ROUGH_JD",
      title: "Rough Notes",
      publisher: "Lead",
      date: "2026-09-01",
      inputHash: "abc",
      textLines: ["Needs to understand LLMs, ideally has used ChatGPT or Claude."]
    });
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].sourceExcerptIds.length).toBeGreaterThan(0);
    expect(claims[0].quoteSnapshot).toBeDefined();
  });

  it("DeepSeekAdapter initializes with default model settings", () => {
    const adapter = new DeepSeekAdapter();
    expect(adapter).toBeDefined();
  });

  it("MockAdapter extracts facts with stable line anchors", async () => {
    const adapter = new MockAdapter();
    const facts = await adapter.extractCandidateFacts("CAND_RESCUE_01", [
      "L005: 1. Curated and labeled 800+ benchmark QA pairs.",
      "L006: 2. Authored 3 core prompt templates with few-shot examples."
    ]);
    expect(facts.taskRecords.length).toBeGreaterThan(0);
    expect(facts.taskRecords[0].anchorIds.length).toBeGreaterThan(0);
  });
});
