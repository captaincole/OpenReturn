import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseEcfrParts } from "../../../src/law/parseEcfr.js";
import { MAX_BLOCK_CHARS } from "../../../src/refdocs/chunk.js";

/*
 * Fixtures are cut from the eCFR XML of 26 CFR as of 2025-12-31 (ecfr.gov,
 * public domain): whole sections, except § 1.469-5T (Examples 1 and 2 only)
 * and § 1.408A-4 (Q&A-1 and Q&A-2 only). part.xml is the wrapper; sections
 * go in {{SECTIONS}}. The short paragraphs written inline below are copied
 * from other sections of the same file.
 */

const FIXTURES = join(__dirname, "fixtures", "ecfr");
const fixture = (name: string) => readFileSync(join(FIXTURES, name), "utf8");

const SECTION_FILES = [
  "s301.6011-1.xml",
  "s1.42-2-reserved.xml",
  "s1.358-3-table.xml",
  "s1.42-1-range.xml",
  "s1.469-5T.xml",
  "s1.408A-4-qa.xml",
];

const DOC = "cfr-26-2025";
const SEC = `${DOC}::sec::`;
const wrap = (sections: string) => fixture("part.xml").replace("{{SECTIONS}}", sections);
const parsed = parseEcfrParts([wrap(SECTION_FILES.map(fixture).join("\n"))], DOC);

type Block = (typeof parsed.blocks)[number];
const meta = (row: Block) =>
  row.metadata as { citation: string; path: string[]; headings: string[] };
const block = (id: string, from = parsed) => {
  const found = from.blocks.find((row) => row.blockId === `${SEC}${id}`);
  if (!found) throw new Error(`no block ${id}`);
  return found;
};
const blockIdsOf = (slug: string, from = parsed) =>
  from.blocks
    .filter((row) => row.sectionId === `${SEC}${slug}`)
    .map((row) => row.blockId.slice(`${SEC}${slug}::`.length));

/** One section made of the given paragraphs, as eCFR prints them. */
const oneSection = (number: string, paragraphs: string[]) =>
  parseEcfrParts(
    [
      wrap(
        `<DIV8 N="${number}" TYPE="SECTION"><HEAD>&#xA7; ${number} Test section.</HEAD>${paragraphs.join("\n")}</DIV8>`,
      ),
    ],
    DOC,
  );

describe("parseEcfrParts: rows", () => {
  it("makes a row for the part, the subject group and each section, parent-linked", () => {
    const rows = parsed.sections.map((row) => [row.sectionId, row.parentSectionId]);
    expect(rows.slice(0, 3)).toEqual([
      [`${SEC}pt1`, null],
      [`${SEC}pt1-sgecfr0test0group`, `${SEC}pt1`],
      [`${SEC}s301.6011-1`, `${SEC}pt1-sgecfr0test0group`],
    ]);
    expect(parsed.sections[0].heading).toBe("PART 1—INCOME TAXES");
  });

  it("gives a section the slug of its number, lower case, and its heading as printed", () => {
    const row = parsed.sections.find((section) => section.sectionId === `${SEC}s1.469-5t`);
    expect(row?.heading).toBe("§ 1.469-5T Material participation (temporary).");
  });

  it("skips a reserved section and counts it", () => {
    expect(parsed.sections.some((row) => row.sectionId.includes("s1.42-2"))).toBe(false);
    expect(parsed.stats.reservedSections).toBe(1);
    expect(parsed.stats.regSections).toBe(5);
  });
});

describe("parseEcfrParts: the outline", () => {
  it("cites a simple section's paragraphs", () => {
    expect(blockIdsOf("s301.6011-1")).toEqual(["a", "b"]);
    expect(meta(block("s301.6011-1::b")).citation).toBe("26 CFR § 301.6011-1(b)");
  });

  it("rebuilds the levels of § 1.469-5T from flat paragraphs", () => {
    expect(blockIdsOf("s1.469-5t").slice(0, 9)).toEqual([
      "a",
      "a-1",
      "a-2",
      "a-3",
      "a-4",
      "a-5",
      "a-6",
      "a-7",
      "b-1",
    ]);
    expect(meta(block("s1.469-5t::a-1")).citation).toBe("26 CFR § 1.469-5T(a)(1)");
    expect(block("s1.469-5t::a-1").text).toBe(
      "(1) The individual participates in the activity for more than 500 hours during such year;",
    );
  });

  it("splits a paragraph that opens several levels, and runs a bare heading into its child", () => {
    expect(block("s1.469-5t::b-1").text).toBe(
      "(b) Facts and circumstances—\n(1) In general. [Reserved]",
    );
    expect(meta(block("s1.469-5t::b-2-i")).path).toEqual(["b", "2", "i"]);
    expect(block("s1.469-5t::b-2-i").text.startsWith("(2) Certain participation")).toBe(true);
  });

  it("reads italic numbers as the fifth level: (f)(2)(ii)(B)(1)", () => {
    const text = block("s1.469-5t::f-2-ii").text;
    expect(text).toContain("\n(1) Studying and reviewing financial statements");
    expect(text).toContain("\n(3) Monitoring the finances");
  });

  it("tells the letter (i) after (h) from the roman (i) after a lead that opens a list", () => {
    expect(meta(block("s1.469-5t::i")).citation).toBe("26 CFR § 1.469-5T(i)");
    expect(meta(block("s1.469-5t::e-3-i")).citation).toBe("26 CFR § 1.469-5T(e)(3)(i)");
    expect(blockIdsOf("s1.469-5t")).toContain("j");
  });

  it("leaves a range at its last number: (a)-(g) [Reserved], then (h), (i), (j)", () => {
    expect(blockIdsOf("s1.42-1")).toEqual(["a", "h", "i", "j"]);
    expect(block("s1.42-1::a").text.startsWith("(a)-(g) [Reserved].")).toBe(true);
  });
});

describe("parseEcfrParts: text with no number", () => {
  it("keeps each example as a block under its paragraph", () => {
    expect(blockIdsOf("s1.469-5t").slice(-3)).toEqual(["k", "k-ex1", "k-ex2"]);
    const example = block("s1.469-5t::k-ex1");
    expect(meta(example).citation).toBe("26 CFR § 1.469-5T(k)");
    expect(example.text.startsWith("Example 1.\nA, a calendar year individual")).toBe(true);
  });

  it("prints a table row by row, cells joined by ' | '", () => {
    const example = block("s1.358-3::b-ex1").text;
    expect(example).toContain("Adjusted basis of property transferred | $100,000");
    expect(example).toContain("Basis of Corporation X stock to A | 75,000");
  });

  it("leaves out source citations and authority notes", () => {
    expect(parsed.canonicalText).not.toContain("T.D. 9");
    expect(parsed.canonicalText).not.toContain("26 U.S.C. 7805");
  });
});

describe("parseEcfrParts: questions and answers", () => {
  it("makes each Q&A a unit whose answer numbers start again", () => {
    expect(blockIdsOf("s1.408a-4")).toEqual([
      "text",
      "qa1",
      "qa1-a",
      "qa1-b",
      "qa1-c",
      "qa1-d",
      "qa2",
      "qa2-a",
      "qa2-b",
    ]);
    expect(meta(block("s1.408a-4::qa2-b")).citation).toBe("26 CFR § 1.408A-4, Q&A-2(b)");
    expect(block("s1.408a-4::qa1-a").text.startsWith("A-1. (a) Yes.")).toBe(true);
  });
});

describe("parseEcfrParts: blocks", () => {
  it("writes the citation, the italic headings above and the lead it finishes into the search text", () => {
    const context = block("s1.469-5t::a-1").contextualizedText ?? "";
    const [header, lead] = context.split("\n");
    expect(header).toBe(
      "26 CFR § 1.469-5T(a)(1) — Material participation (temporary). › (a) In general",
    );
    expect(lead.startsWith("Except as provided in paragraphs (e) and (h)(2)")).toBe(true);
  });

  it("keeps every block within the cap, but for heading lines run into it", () => {
    const over = parsed.blocks.filter((row) => row.text.length > MAX_BLOCK_CHARS);
    expect(over.map((row) => row.blockId)).toEqual([]);
  });

  it("gives every block a unique id and no model text", () => {
    const ids = parsed.blocks.map((row) => row.blockId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(parsed.blocks.every((row) => row.contextualSummary === null)).toBe(true);
  });
});

describe("parseEcfrParts: the hard cases, from other sections", () => {
  it("ends a heading at a run-in number inside the same italic run (§ 1.25A-5(f))", () => {
    const one = oneSection("1.25A-5", [
      "<P>(a) <I>Educational expenses paid by claimed dependent.</I> Text.</P>",
      "<P>(b) <I>Third party.</I> Text.</P>",
      "<P>(c) <I>Adjustment.</I> Text.</P>",
      "<P>(d) <I>No double benefit.</I> Text.</P>",
      "<P>(e) <I>Timing rules.</I> Text.</P>",
      "<P>(f) <I>Refund of qualified tuition and related expenses&#x2014;(1) Payment and refund of qualified tuition and related expenses in the same taxable year.</I> With respect to any student, the amount is calculated by adding all expenses paid.</P>",
      "<P>(2) <I>Payment in one taxable year and refund in subsequent taxable year.</I> If, in a taxable year, a taxpayer receives a refund.</P>",
    ]);
    expect(blockIdsOf("s1.25a-5", one)).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(
      block("s1.25a-5::f", one)
        .text.split("\n")
        .map((line) => line.slice(0, 4)),
    ).toEqual(["(f) ", "(1) ", "(2) "]);
    expect(one.stats.unplaced).toBe(0);
  });

  it("takes a last (i) after a closed paragraph as the next letter (§ 1.25E-2(h), (i))", () => {
    const one = oneSection("1.25E-2", [
      ..."abcdefg".split("").map((letter) => `<P>(${letter}) <I>Rule.</I> Text.</P>`),
      "<P>(h) <I>Severability.</I> The provisions of this section are separate and severable from one another.</P>",
      "<P>(i) <I>Applicability date.</I> This section applies to previously-owned clean vehicles placed in service after December 31, 2022.</P>",
    ]);
    expect(blockIdsOf("s1.25e-2", one).slice(-3)).toEqual(["g", "h", "i"]);
    expect(one.stats.unplaced).toBe(0);
  });

  it("runs a bare number into its child: (2)(i) (§ 1.1-1(a))", () => {
    const one = oneSection("1.1-1", [
      "<P>(a) <I>General rule.</I> (1) Section 1 of the Code imposes an income tax.</P>",
      "<P>(2)(i) For taxable years beginning on or after January 1, 1964, the tax is the tax imposed by section 1.</P>",
      "<P>(ii) For taxable years beginning after December 31, 1970, the tax imposed by section 1(d).</P>",
    ]);
    expect(blockIdsOf("s1.1-1", one)).toEqual(["a"]);
    const lines = block("s1.1-1::a", one).text.split("\n");
    expect(lines.map((line) => line.slice(0, 12))).toEqual([
      "(a) General ",
      "(1) Section ",
      "(2)(i) For t",
      "(ii) For tax",
    ]);
    expect(one.stats.unplaced).toBe(0);
  });

  it("keeps a number it cannot place in the last sure unit, and counts it", () => {
    // § 1.42-14(d)(3) as printed: the "(" of "(i)" sits inside the italic heading.
    const one = oneSection("1.42-14", [
      "<P>(a) <I>Returned credit</I>&#x2014;(1) <I>In general.</I> Text.</P>",
      "<P>(2) <I>Manner of returning credit&#x2014;(</I> i) <I>Taxpayer notification.</I> After an Agency determines.</P>",
      "<P>(ii) <I>Internal Revenue Service notification.</I> If a credit is returned.</P>",
    ]);
    expect(one.stats.unplaced).toBe(1);
    expect(one.stats.unplacedExamples[0]).toMatchObject({ section: "1.42-14", under: ["a", "2"] });
    const kept = block("s1.42-14::a", one).text.split("\n").at(-1);
    expect(kept).toBe("(ii) Internal Revenue Service notification. If a credit is returned.");
  });
});
