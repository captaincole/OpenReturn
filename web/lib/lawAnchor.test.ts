import { describe, expect, it } from "vitest";
import { anchorCandidates, anchorSegments, findLawAnchor, hashAnchor } from "./lawAnchor";

describe("anchorCandidates", () => {
  it("drops one level at a time", () => {
    expect(anchorCandidates("g-1-A")).toEqual(["g-1-A", "g-1", "g"]);
    expect(anchorCandidates("g")).toEqual(["g"]);
    expect(anchorCandidates("")).toEqual([]);
  });

  it("keeps a -dup2 with its number", () => {
    expect(anchorSegments("b-4-dup2-A")).toEqual(["b", "4-dup2", "A"]);
    expect(anchorCandidates("b-4-dup2-A")).toEqual(["b-4-dup2-A", "b-4-dup2", "b"]);
  });

  it("drops a -cont or a -p2 as its own step, back to its unit", () => {
    expect(anchorCandidates("k-2-E-cont")).toEqual(["k-2-E-cont", "k-2-E", "k-2", "k"]);
    expect(anchorCandidates("b-1-F-iii-p2")).toEqual([
      "b-1-F-iii-p2",
      "b-1-F-iii",
      "b-1-F",
      "b-1",
      "b",
    ]);
  });
});

describe("findLawAnchor", () => {
  const ids = ["g", "g-1", "g-2", "g-3", "k-2", "k-2-E-i", "k-2-E-ii", "k-2-E-cont"];

  it("lands on the block itself", () => {
    expect(findLawAnchor("g-1", ids)).toBe("g-1");
    expect(findLawAnchor("k-2-E-cont", ids)).toBe("k-2-E-cont");
  });

  it("lands on the parent block of a packed subdivision", () => {
    expect(findLawAnchor("g-1-A", ids)).toBe("g-1");
    expect(findLawAnchor("g-1-A-ii", ids)).toBe("g-1");
  });

  it("lands on the first block inside a unit whose heading runs into it", () => {
    expect(findLawAnchor("k-2-E", ids)).toBe("k-2-E-i");
  });

  it("never mistakes a second unit numbered alike for the first", () => {
    const repeated = ["b", "b-4", "b-4-A", "b-4-dup2"];
    expect(findLawAnchor("b-4-dup2-C", repeated)).toBe("b-4-dup2");
    expect(findLawAnchor("b-4-B", ["b", "b-4-dup2"])).toBe("b");
  });

  it("answers null when nothing on the page matches", () => {
    expect(findLawAnchor("z-1", ids)).toBeNull();
    expect(findLawAnchor("", ids)).toBeNull();
  });
});

describe("hashAnchor", () => {
  it("reads the hash without # and decodes it", () => {
    expect(hashAnchor("#g-1-A")).toBe("g-1-A");
    expect(hashAnchor("#a%2D1")).toBe("a-1");
    expect(hashAnchor("")).toBe("");
    expect(hashAnchor("#%E0%A4%A")).toBe("");
  });
});
