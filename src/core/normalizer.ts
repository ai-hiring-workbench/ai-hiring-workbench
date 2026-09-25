import { createHash } from "node:crypto";

export interface NumberedLine {
  lineId: string;
  rawText: string;
}

export interface NormalizedDocument {
  lines: NumberedLine[];
  sha256: string;
}

export function normalizeDocument(raw: string): NormalizedDocument {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n").map((rawText, index) => ({
    lineId: `L${String(index + 1).padStart(3, "0")}`,
    rawText
  }));

  return {
    lines,
    sha256: createHash("sha256").update(normalized, "utf8").digest("hex")
  };
}
