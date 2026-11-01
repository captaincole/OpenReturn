import { describe, expect, it } from "vitest";
import { splitRange } from "../../../src/refdocs/chunk.js";

describe("splitRange", () => {
  it("leaves a short range alone", () => {
    expect(splitRange("short text.", 0, 11)).toEqual([[0, 11]]);
  });

  it("cuts at a sentence end, keeps text verbatim, covers everything", () => {
    const sentence = "This sentence is about forty characters. ";
    const text = sentence.repeat(60); // ~2,460 chars
    const pieces = splitRange(text, 0, text.length, 1200);
    expect(pieces.length).toBeGreaterThan(1);
    for (const [from, to] of pieces) {
      expect(to - from).toBeLessThanOrEqual(1200);
      expect(text.slice(from, to).trimEnd().endsWith(".")).toBe(true);
    }
    const joined = pieces.map(([from, to]) => text.slice(from, to)).join("");
    expect(joined.replace(/\s/g, "")).toBe(text.replace(/\s/g, ""));
  });

  it("falls back to a line end, then a hard cut", () => {
    const lines = "x".repeat(50) + "\n";
    const t1 = lines.repeat(40);
    for (const [from, to] of splitRange(t1, 0, t1.length, 500))
      expect(to - from).toBeLessThanOrEqual(500);
    const t2 = "y".repeat(3000);
    expect(splitRange(t2, 0, 3000, 1200)).toEqual([
      [0, 1200],
      [1200, 2400],
      [2400, 3000],
    ]);
  });
});
