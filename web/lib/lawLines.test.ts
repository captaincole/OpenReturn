import { describe, expect, it } from "vitest";
import { kindsOf, lawLines, lawParts, leadingMarkers } from "./lawLines";

const depths = (path: string[], text: string) => lawLines(path, text).map((line) => line.depth);

// 26 U.S.C. § 469(g)(1), as law.db holds it.
const S469_G_1 = [
  "(1) Fully taxable transaction",
  "(A) In general.—If all gain or loss realized on such disposition is recognized, the excess of—",
  "(i) any loss from such activity for such taxable year, over",
  "(ii) any net income or gain for such taxable year from all other passive activities,",
  "shall be treated as a loss which is not from a passive activity.",
  "(B) Subparagraph (A) not to apply to disposition involving related party.—If the taxpayer…",
  "(C) Income from prior years.—To the extent provided in regulations…",
].join("\n");

describe("leadingMarkers", () => {
  it("reads the numbers that open a line", () => {
    expect(leadingMarkers("(1) Fully taxable transaction")).toEqual(["1"]);
    expect(leadingMarkers("(12)(A) Benevolent life insurance")).toEqual(["12", "A"]);
    expect(leadingMarkers("(2A) Inserted paragraph")).toEqual(["2A"]);
  });

  it("reads no number from words in parentheses", () => {
    expect(leadingMarkers("(other than section 27) shall")).toEqual([]);
    expect(leadingMarkers("shall be treated as a loss")).toEqual([]);
    expect(leadingMarkers("[(1) Repealed. Pub. L. 93–406]")).toEqual([]);
  });
});

describe("kindsOf", () => {
  it("knows the levels a number can be", () => {
    expect(kindsOf("g")).toEqual(["lowerLetter"]);
    expect(kindsOf("12")).toEqual(["digit"]);
    expect(kindsOf("i")).toEqual(["lowerLetter", "lowerRoman"]);
    expect(kindsOf("ii")).toEqual(["lowerRoman", "doubleLower"]);
    expect(kindsOf("I")).toEqual(["upperLetter", "upperRoman"]);
    expect(kindsOf("aa")).toEqual(["doubleLower"]);
    expect(kindsOf("Ab")).toEqual([]);
  });
});

describe("lawLines", () => {
  it("indents each line by the level its number shows", () => {
    expect(depths(["g", "1"], S469_G_1)).toEqual([1, 2, 3, 3, 2, 2, 2]);
  });

  it("starts a block that opens with its parent's heading at the parent's level", () => {
    const text = "(3) Phase-out of exemption\n(A) In general.—In the case of any taxpayer…";
    expect(depths(["i", "3", "A"], text)).toEqual([1, 2]);
  });

  it("reads (i) after (h) as the next subsection, and (i) after (A) as a clause", () => {
    expect(depths([], "(h) Rule one.—Text.\n(i) Rule two.—Text.")).toEqual([0, 0]);
    expect(depths(["a"], "(a) Rule.—\n(A) the first,\n(i) a clause")).toEqual([0, 1, 2]);
    expect(depths(["a"], "(a) Rule.—\n(1) one\n(A) sub\n(I) subclause?")).toEqual([0, 1, 2, 3]);
  });

  it("keeps a second paragraph of one item at that item's level", () => {
    expect(
      depths(["c"], "(c) Defined.—Some text.\nFor purposes of this subsection, more."),
    ).toEqual([0, 0]);
  });

  it("puts a continuation or a second piece at its unit's level", () => {
    expect(depths(["k", "2", "E"], "shall be treated as acquired.")).toEqual([2]);
    expect(depths([], "Gross income shall not include…")).toEqual([0]);
  });

  it("keeps table rows at the level of the line that introduces them", () => {
    const text =
      "(A) Joint returns.—The following table:\nIf taxable income is: | The tax is:\nNot over $19,050 | 10%";
    const lines = lawLines(["j", "2", "A"], text);
    expect(lines.map((line) => [line.depth, line.tableRow])).toEqual([
      [2, false],
      [2, true],
      [2, true],
    ]);
  });

  it("marks where the leading numbers end", () => {
    expect(lawLines(["c", "12"], "(12)(A) Benevolent")[0].markerEnd).toBe(7);
  });
});

describe("lawParts", () => {
  it("groups table rows into one table of cells", () => {
    const parts = lawParts(lawLines(["j"], "(j) Rates:\nIf | Tax\nUnder 10 | 1%\nThen more text"));
    expect(parts.map((part) => part.kind)).toEqual(["line", "table", "line"]);
    expect(parts[1]).toEqual({
      kind: "table",
      depth: 0,
      rows: [
        ["If", "Tax"],
        ["Under 10", "1%"],
      ],
    });
  });
});

// 26 CFR § 1.469-5T(f)(2)(ii), as law.db holds it: the regulations' order is (a)(1)(i)(A), then an italic (1).
const S1_469_5T_F_2_II = [
  "(ii) Participation as an investor—",
  "(A) In general. Work done by an individual in the individual's capacity as an investor…",
  "(B) Work done in individual's capacity as an investor. For purposes of this paragraph (f)(2)(ii), work done by an individual … includes—",
  "(1) Studying and reviewing financial statements or reports on operations of the activity;",
  "(2) Preparing or compiling summaries or analyses of the finances or operations of the activity;",
  "(3) Monitoring the finances or operations of the activity in a non-managerial capacity.",
].join("\n");

describe("lawLines: a regulation block", () => {
  it("indents the regulations' levels with no change to the rule", () => {
    expect(depths(["f", "2", "ii"], S1_469_5T_F_2_II)).toEqual([2, 3, 3, 4, 4, 4]);
  });

  it("indents a Q&A's answer below its question", () => {
    const text =
      "(b) An amount can be converted by any of three methods—\n(1) An amount distributed…";
    expect(depths(["Q&A-1", "b"], text)).toEqual([1, 2]);
  });
});
