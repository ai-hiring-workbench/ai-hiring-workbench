import { describe, expect, it } from "vitest";
import {
  canFreezeStandard,
  enforceNullLevel,
  quoteExistsInLines
} from "../src/core/safety-rules.js";

describe("safety rules", () => {
  it("blocks a standard with pending requirements", () => {
    expect(canFreezeStandard([
      { status: "CONFIRMED" },
      { status: "PENDING" }
    ])).toBe(false);
  });

  it("forces level to null when evidence is insufficient", () => {
    expect(enforceNullLevel({
      requirementId: "AIPM-AP1",
      evidenceStatus: "MATERIAL_INSUFFICIENT",
      level: "L3",
      reasons: ["missing validation"],
      anchorIds: []
    }).level).toBeNull();
  });

  it("checks quote snapshots against selected lines", () => {
    expect(quoteExistsInLines(
      "built an evaluation set",
      ["L002"],
      [
        { lineId: "L001", rawText: "context" },
        { lineId: "L002", rawText: "I built an evaluation set and reviewed failures." }
      ]
    )).toBe(true);
  });
});
