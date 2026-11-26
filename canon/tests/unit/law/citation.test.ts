import { describe, expect, it } from "vitest";
import {
  formatCitation,
  parseLawTarget,
  printsPath,
  resolvePath,
  sectionIdOf,
  subdivisionsOf,
  type PathBlock,
} from "../../../src/law/citation.js";

describe("parseLawTarget", () => {
  it.each([
    ["469", "469", []],
    ["469(g)", "469", ["g"]],
    ["469(g)(1)(A)", "469", ["g", "1", "A"]],
    ["§ 469(g)(1)", "469", ["g", "1"]],
    ["§469 (g)", "469", ["g"]],
    ["26 U.S.C. § 469(g)(1)", "469", ["g", "1"]],
    ["IRC 1202(b)", "1202", ["b"]],
    ["Section 36B(b)(3)", "36B", ["b", "3"]],
    ["1400Z–2(a)", "1400Z-2", ["a"]],
  ])("reads %s", (input, section, path) => {
    expect(parseLawTarget(input)).toEqual({ kind: "citation", section, path });
  });

  it("takes a block id as it is", () => {
    expect(parseLawTarget(" usc-26-2025::sec::s469::g-1 ")).toEqual({
      kind: "block",
      blockId: "usc-26-2025::sec::s469::g-1",
    });
  });

  it.each(["", "passive activity", "469(g", "469(g)x", "469()"])("refuses %j", (input) => {
    expect(parseLawTarget(input)).toBeNull();
  });
});

describe("parseLawTarget: regulations", () => {
  it.each([
    ["1.469-5T", "1.469-5T", []],
    ["1.469-5T(a)(1)", "1.469-5T", ["a", "1"]],
    ["26 CFR 1.469-5T(a)", "1.469-5T", ["a"]],
    ["26 C.F.R. § 1.469-5T(a)(1)(ii)", "1.469-5T", ["a", "1", "ii"]],
    ["Treas. Reg. § 1.1031(a)-1(b)", "1.1031(a)-1", ["b"]],
    ["1.401(a)(9)-1", "1.401(a)(9)-1", []],
    ["301.6103(h)(4)-1(a)", "301.6103(h)(4)-1", ["a"]],
    ["1.408A-4, Q&A-1(b)", "1.408A-4", ["Q&A-1", "b"]],
    ["1.408A-4 Q&A-2", "1.408A-4", ["Q&A-2"]],
  ])("reads %s", (input, section, path) => {
    expect(parseLawTarget(input)).toEqual({ kind: "regulation", section, path });
  });

  it("keeps a bare number with no dot a Code section", () => {
    expect(parseLawTarget("1031")).toEqual({ kind: "citation", section: "1031", path: [] });
  });

  it("takes a regulation block id as it is", () => {
    expect(parseLawTarget("cfr-26-2025::sec::s1.469-5t::a-1-ii")).toEqual({
      kind: "block",
      blockId: "cfr-26-2025::sec::s1.469-5t::a-1-ii",
    });
  });

  it.each(["1.", "1.469-5T(a", "1.469-5T(a)x"])("refuses %j", (input) => {
    expect(parseLawTarget(input)).toBeNull();
  });

  it("spells the row id and the citation of a regulation", () => {
    expect(sectionIdOf("cfr-26-2025", "1.469-5T")).toBe("cfr-26-2025::sec::s1.469-5t");
    expect(sectionIdOf("cfr-26-2025", "1.1031(a)-1")).toBe("cfr-26-2025::sec::s1.1031(a)-1");
    expect(formatCitation("1.469-5T", ["a", "1"])).toBe("26 CFR § 1.469-5T(a)(1)");
    expect(formatCitation("1.408A-4", ["Q&A-1", "b"])).toBe("26 CFR § 1.408A-4, Q&A-1(b)");
    expect(formatCitation("469", ["h", "2"])).toBe("26 U.S.C. § 469(h)(2)");
  });
});

describe("sectionIdOf", () => {
  it("spells the section row id the parser writes", () => {
    expect(sectionIdOf("usc-26-2025", "469")).toBe("usc-26-2025::sec::s469");
    expect(sectionIdOf("usc-26-2025", "36B")).toBe("usc-26-2025::sec::s36b");
    expect(sectionIdOf("usc-26-2025", "1400Z-2")).toBe("usc-26-2025::sec::s1400z-2");
  });
});

// The shape of § 469(g) in the parsed title: (g)'s lead, then (1) packed whole with its (A)–(C).
const S469: PathBlock[] = [
  { blockId: "g", path: ["g"], text: "(g) Dispositions.—If during the taxable year…" },
  {
    blockId: "g-1",
    path: ["g", "1"],
    text: "(1) Fully taxable transaction\n(A) In general.—If all gain…\n(i) any loss…\n(B) Related party.—If…",
  },
  {
    blockId: "g-2",
    path: ["g", "2"],
    text: "(2) Disposition by death.—If…\n(A) paragraph (1)(A) shall…",
  },
  { blockId: "h", path: ["h"], text: "(h) Material participation.—" },
  { blockId: "h-1", path: ["h", "1"], text: "(1) In general.—A taxpayer…" },
];
const ids = (blocks: PathBlock[]) => blocks.map((block) => block.blockId);

describe("resolvePath", () => {
  it("returns the whole section for an empty path, in order", () => {
    expect(ids(resolvePath(S469, []))).toEqual(["g", "g-1", "g-2", "h", "h-1"]);
  });

  it("returns a subdivision with every block inside it", () => {
    expect(ids(resolvePath(S469, ["g"]))).toEqual(["g", "g-1", "g-2"]);
    expect(ids(resolvePath(S469, ["g", "2"]))).toEqual(["g-2"]);
  });

  it("returns the parent block that packs a subdivision with no block of its own", () => {
    expect(ids(resolvePath(S469, ["g", "1", "A"]))).toEqual(["g-1"]);
    expect(ids(resolvePath(S469, ["g", "1", "A", "i"]))).toEqual(["g-1"]);
  });

  it("finds nothing for a subdivision the parent does not print", () => {
    expect(resolvePath(S469, ["g", "1", "D"])).toEqual([]);
    expect(resolvePath(S469, ["k"])).toEqual([]);
  });
});

describe("printsPath", () => {
  it("finds each number at a line start or after its parent's number", () => {
    expect(printsPath("(c) List.—\n(12)(A) Benevolent…", ["12", "A"])).toBe(true);
    expect(printsPath("(B) see subparagraph (A) above", ["A"])).toBe(false);
  });
});

describe("subdivisionsOf", () => {
  it("lists the next level down once each", () => {
    expect(subdivisionsOf("469", [], S469)).toEqual(["26 U.S.C. § 469(g)", "26 U.S.C. § 469(h)"]);
    expect(subdivisionsOf("469", ["g"], S469)).toEqual([
      "26 U.S.C. § 469(g)(1)",
      "26 U.S.C. § 469(g)(2)",
    ]);
  });
});
