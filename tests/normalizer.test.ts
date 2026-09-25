import { describe, expect, it } from "vitest";
import { normalizeDocument } from "../src/core/normalizer.js";

describe("normalizeDocument", () => {
  it("creates stable one-indexed line ids", () => {
    const result = normalizeDocument("first line\nsecond line");

    expect(result.lines).toEqual([
      { lineId: "L001", rawText: "first line" },
      { lineId: "L002", rawText: "second line" }
    ]);
    expect(result.sha256).toHaveLength(64);
  });

  it("normalizes CRLF before hashing", () => {
    expect(normalizeDocument("a\r\nb").sha256).toBe(normalizeDocument("a\nb").sha256);
  });
});
