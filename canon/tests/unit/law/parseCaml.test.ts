import { describe, expect, it } from "vitest";
import { leadingNumbers } from "../../../src/law/camlEntries.js";
import { MAX_BLOCK_CHARS } from "../../../src/refdocs/chunk.js";
import { parsedCalifornia } from "./caFixture.js";

/*
 * The fixtures are real sections of the Revenue and Taxation Code, cut from
 * the Legislature's 2025 session archive (see caFixture.ts).
 */

const parsed = parsedCalifornia();
const DOC = "ca-rtc-2025";
const SEC = `${DOC}::sec::`;

type Block = (typeof parsed.blocks)[number];
const meta = (row: Block) =>
  row.metadata as { citation: string; path: string[]; headings: string[] };
const block = (id: string) => {
  const found = parsed.blocks.find((row) => row.blockId === `${SEC}${id}`);
  if (!found) throw new Error(`no block ${id}`);
  return found;
};
const blockIdsOf = (slug: string) =>
  parsed.blocks
    .filter((row) => row.sectionId === `${SEC}${slug}`)
    .map((row) => row.blockId.slice(`${SEC}${slug}::`.length));
const row = (slug: string) =>
  parsed.sections.find((section) => section.sectionId === `${SEC}${slug}`);

describe("parseCaExtract: rows", () => {
  it("makes a row for each level with a section under it, parent-linked, in the code's order", () => {
    const levels = parsed.sections
      .filter((section) => !section.heading.startsWith("§"))
      .map((section) => [section.headingSlug, section.parentSectionId, section.heading]);
    expect(levels).toEqual([
      ["div2", null, "DIVISION 2. OTHER TAXES"],
      ["div2-pt10", `${SEC}div2`, "PART 10. PERSONAL INCOME TAX"],
      ["div2-pt10-ch1", `${SEC}div2-pt10`, "CHAPTER 1. General Provisions and Definitions"],
      ["div2-pt10-ch2", `${SEC}div2-pt10`, "CHAPTER 2. Imposition of Tax"],
      ["div2-pt10-ch3", `${SEC}div2-pt10`, "CHAPTER 3. Computation of Taxable Income"],
      ["div2-pt10-ch3-art6", `${SEC}div2-pt10-ch3`, "ARTICLE 6. Deductions"],
      [
        "div2-pt10-ch6",
        `${SEC}div2-pt10`,
        "CHAPTER 6. Accounting Periods and Methods of Accounting",
      ],
    ]);
    expect(parsed.stats).toMatchObject({ emptyLevels: 1, codeSections: 7, unplaced: 0 });
  });

  it("heads a section with its number and its history note", () => {
    expect(row("s17014")).toMatchObject({
      parentSectionId: `${SEC}div2-pt10-ch1`,
      heading: "§ 17014. (Amended by Stats. 1994, Ch. 1243, Sec. 4. Effective September 30, 1994.)",
    });
  });

  it("keeps each version of a number as its own row, and names the version", () => {
    expect(parsed.stats.versioned).toEqual({ "17552.3": 2 });
    expect(row("s17552.3")?.heading).toContain(
      "§ 17552.3. Version 1 of 2. (Added by Stats. 2002, Ch. 34",
    );
    expect(row("s17552.3-v2")?.heading).toContain(
      "§ 17552.3. Version 2 of 2. (Added by Stats. 2002, Ch. 35",
    );
    expect(meta(block("s17552.3-v2::a")).headings[0]).toMatch(
      /^Version 2 of 2: Added by Stats\. 2002, Ch\. 35/,
    );
    expect(meta(block("s17552.3-v2::a")).citation).toBe("Cal. Rev. & Tax. Code § 17552.3(a)");
  });
});

describe("parseCaExtract: blocks", () => {
  it("cites each block and starts its search text with the levels above the section", () => {
    const resident = block("s17014::a");
    expect(meta(resident)).toMatchObject({
      citation: "Cal. Rev. & Tax. Code § 17014(a)",
      path: ["a"],
      headings: [],
    });
    expect((resident.contextualizedText ?? "").split("\n")[0]).toBe(
      "Cal. Rev. & Tax. Code § 17014(a) — PERSONAL INCOME TAX › General Provisions and Definitions",
    );
    expect(resident.text).toContain(
      "(1) Every individual who is in this state for other than a temporary or transitory purpose.",
    );
  });

  it("splits a subdivision over the cap into its paragraphs, with the lead as a chapeau", () => {
    expect(blockIdsOf("s17014")).toEqual(["a", "b", "c", "d", "d-1", "d-2", "d-3", "d-4"]);
    expect(block("s17014::d-2").contextualizedText ?? "").toContain(
      "› (d)\nFor any taxable year beginning",
    );
  });

  it("writes run-in numbers together, as a citation does, and a table row by row", () => {
    const rates = block("s17041::a");
    expect(rates.text.startsWith("(a)(1) There shall be imposed for each taxable year")).toBe(true);
    expect(rates.text).toContain("Not over $3,650 | 1% of the taxable income");
    expect(meta(block("s17041::i-1")).citation).toBe("Cal. Rev. & Tax. Code § 17041(i)(1)");
  });

  it("tells a letter after (h) from a clause, and a subclause from a letter after (H)", () => {
    const ids = blockIdsOf("s17054");
    expect(ids).toContain("i");
    expect(ids).toContain("d-2-A");
    const clauses = block("s17054::d-2-A").text;
    expect(clauses.startsWith("(2)(A)(i) For taxable years")).toBe(true);
    expect(clauses).toContain("\n(ii) For taxable years");
    expect(clauses).toContain("\n(I) The identifying number");
    expect(block("s17275.4::a-1").text).toContain("(I) Criminal Complaint #1:19-cr-10116.");
    expect(block("s17275.4::a-1").text).toContain("(J) Criminal Complaint");
  });

  it("makes a section with no numbers one block", () => {
    expect(blockIdsOf("s17001")).toEqual(["text"]);
  });

  it("keeps every block within the cap", () => {
    expect(Math.max(...parsed.blocks.map((row) => row.text.length))).toBeLessThanOrEqual(
      MAX_BLOCK_CHARS,
    );
  });
});

describe("leadingNumbers", () => {
  it("reads each number before a space, and stops at words", () => {
    expect(leadingNumbers("(a) (1) There shall be imposed")).toEqual({
      tokens: ["a", "1"],
      body: "There shall be imposed",
    });
    expect(leadingNumbers("(B)(i) For")).toEqual({ tokens: [], body: "(B)(i) For" });
    expect(leadingNumbers("(Notwithstanding) text")).toEqual({
      tokens: [],
      body: "(Notwithstanding) text",
    });
    expect(leadingNumbers("For purposes of (a)")).toEqual({
      tokens: [],
      body: "For purposes of (a)",
    });
  });
});
