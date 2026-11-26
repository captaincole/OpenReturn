import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseUslmTitle } from "../../../src/law/parseUslm.js";
import { MAX_BLOCK_CHARS } from "../../../src/refdocs/chunk.js";

/*
 * Fixtures are cut from the official USLM XML of Title 26 (uscode.house.gov,
 * public domain): each keeps one section, with only the units on the path to
 * the part under test. title.xml is the wrapper; sections go in {{PART_I}}.
 */

const FIXTURES = join(__dirname, "fixtures");
const fixture = (name: string) => readFileSync(join(FIXTURES, name), "utf8");

const SECTION_FILES = [
  "s1-j-2-A.xml",
  "s4-repealed.xml",
  "s36B-b-3-B-ii-I-aa.xml",
  "s139H.xml",
  "s168-k-2-E.xml",
  "s170-b-1-F-iii.xml",
  "s469-g.xml",
  "s501-c-12-A.xml",
  "s1202-b-4.xml",
];

const DOC = "usc-26-2025";
const SEC = `${DOC}::sec::`;
const xml = fixture("title.xml").replace("{{PART_I}}", SECTION_FILES.map(fixture).join("\n"));
const parsed = parseUslmTitle(xml, DOC);

const block = (id: string) => {
  const found = parsed.blocks.find((row) => row.blockId === `${SEC}${id}`);
  if (!found) throw new Error(`no block ${id}`);
  return found;
};
const blockIdsOf = (slug: string) =>
  parsed.blocks
    .filter((row) => row.sectionId === `${SEC}${slug}`)
    .map((row) => row.blockId.slice(`${SEC}${slug}::`.length));
const section = (slug: string) => parsed.sections.find((row) => row.sectionId === `${SEC}${slug}`);

describe("parseUslmTitle: structure rows", () => {
  it("makes one row for each level above a section, with a slug from its identifier", () => {
    const structure = parsed.sections.slice(0, 4).map((row) => [row.sectionId, row.heading]);
    expect(structure).toEqual([
      [`${SEC}sta`, "Subtitle A—Income Taxes"],
      [`${SEC}sta-ch1`, "CHAPTER 1—NORMAL TAXES AND SURTAXES"],
      [`${SEC}sta-ch1-scha`, "Subchapter A—Determination of Tax Liability"],
      [`${SEC}sta-ch1-scha-pti`, "PART I—TAX ON INDIVIDUALS"],
    ]);
  });

  it("links each row to its parent", () => {
    expect(section("sta")?.parentSectionId).toBeNull();
    expect(section("sta-ch1")?.parentSectionId).toBe(`${SEC}sta`);
    expect(section("sta-ch1-scha-pti")?.parentSectionId).toBe(`${SEC}sta-ch1-scha`);
    expect(section("s469")?.parentSectionId).toBe(`${SEC}sta-ch1-scha-pti`);
  });

  it("gives a Code section its number and catchline as the heading", () => {
    expect(section("s469")?.heading).toBe("§ 469. Passive activity losses and credits limited");
    expect(section("s36b")?.headingSlug).toBe("s36b");
  });

  it("skips a repealed part and a repealed section, and counts them", () => {
    expect(section("sta-ch1-scha-ptv")).toBeUndefined();
    expect(section("s4")).toBeUndefined();
    expect(parsed.stats).toMatchObject({
      structureRows: 4,
      codeSections: 8,
      skippedSections: 1,
      skippedByStatus: { repealed: 1 },
      skippedStructureRows: 1,
      sectionsWithStatutoryNotes: 2,
      blocks: parsed.blocks.length,
    });
  });

  it("keeps every range inside the canonical text, all on page 1", () => {
    for (const row of parsed.sections) {
      expect(row.firstPage).toBe(1);
      expect(row.charEnd).toBeGreaterThanOrEqual(row.charStart);
    }
    const s469 = section("s469")!;
    expect(parsed.canonicalText.slice(s469.charStart).startsWith(s469.heading)).toBe(true);
    for (const row of parsed.blocks.filter((item) => item.sectionId === s469.sectionId)) {
      expect(row.charStart).toBeGreaterThanOrEqual(s469.charStart);
      expect(row.charEnd).toBeLessThanOrEqual(s469.charEnd);
    }
  });
});

describe("parseUslmTitle: blocks", () => {
  it("gives a section with no subdivisions one block, path text", () => {
    const text = block("s139h::text");
    expect(text.text).toBe(
      "Gross income shall not include any interest received from the Federal Government in connection with an action to recover property seized by the Internal Revenue Service pursuant to section 5317(c)(2) of title 31, United States Code, by reason of a claimed violation of section 5324 of such title.",
    );
    expect(text.metadata).toEqual({
      citation: "26 U.S.C. § 139H",
      path: [],
      headings: [],
      refs: ["/us/usc/t31/s5317/c/2"],
    });
  });

  it("names blocks by citation path and keeps the statute's letter case", () => {
    expect(blockIdsOf("s469")).toEqual(["g", "g-1", "g-2", "g-3"]);
    expect(block("s469::g").text).toBe(
      "(g) Dispositions of entire interest in passive activity.—If during the taxable year a taxpayer disposes of his entire interest in any passive activity (or former passive activity), the following rules shall apply:",
    );
  });

  it("keeps a unit that fits the cap as one block, children and continuation included", () => {
    const g1 = block("s469::g-1");
    expect(g1.text.length).toBeLessThanOrEqual(MAX_BLOCK_CHARS);
    expect(g1.text).toContain(
      "(A) In general.—If all gain or loss realized on such disposition is recognized, the excess of—\n(i) any loss from such activity for such taxable year (determined after the application of subsection (b)), over\n",
    );
    expect(g1.text).toContain(
      "(determined after the application of subsection (b)),\nshall be treated as a loss which is not from a passive activity.\n(B) Subparagraph (A)",
    );
    // The XML has a soft hyphen in "tax­payer"; the text has the word.
    expect(g1.text).toContain("such a relationship to the taxpayer.");
    expect(g1.metadata).toMatchObject({
      citation: "26 U.S.C. § 469(g)(1)",
      path: ["g", "1"],
      headings: [
        "Dispositions of entire interest in passive activity",
        "Fully taxable transaction",
      ],
    });
  });

  it("splits a unit just over the cap into its lead, its children and its continuation", () => {
    const ids = ["k-2-E", "k-2-E-i", "k-2-E-ii", "k-2-E-cont"];
    expect(blockIdsOf("s168").filter((id) => id.startsWith("k-2-E"))).toEqual(ids);
    const pieces = ids.map((id) => block(`s168::${id}`));
    const whole = parsed.canonicalText.slice(pieces[0].charStart, pieces[3].charEnd);
    expect(whole.length).toBeGreaterThan(MAX_BLOCK_CHARS);
    expect(pieces[0].text).toBe("(E) Special rules");
    expect(pieces[3].text).toBe(
      "such property shall be treated as originally placed in service not earlier than the date of such last sale.",
    );
    expect(pieces[3].metadata).toMatchObject({ citation: "26 U.S.C. § 168(k)(2)(E)" });
  });

  it("splits a leaf over the cap between clauses, never mid-word", () => {
    const [first, second] = [block("s170::b-1-F-iii"), block("s170::b-1-F-iii-p2")];
    expect(first.text.length).toBeLessThanOrEqual(MAX_BLOCK_CHARS);
    expect(first.text.startsWith("(iii) a private foundation")).toBe(true);
    expect(first.text.endsWith("attributable to the donor’s contribution;")).toBe(true);
    expect(second.text.startsWith("but this clause shall apply only if")).toBe(true);
    expect(second.text.endsWith("recipients of such corpus.")).toBe(true);
  });

  it("renders a table as one line per row, the header row first", () => {
    expect(block("s1::j").text).toContain(
      "in lieu of the table contained in subsection (a):\nIf taxable income is: | The tax is:\nNot over $19,050 | 10% of taxable income.\nOver $19,050 but not over $77,400 | $1,905, plus 12% of the excess over $19,050.\n",
    );
  });

  it("runs a bare number into its first child, as the Code prints it", () => {
    expect(block("s501::c").text).toContain(
      "subsection (a):\n(12)(A) Benevolent life insurance associations",
    );
  });

  it("gives a repeated number a -dup2 id and leaves out footnote markers", () => {
    expect(blockIdsOf("s1202")).toEqual(["b", "b-4", "b-4-A", "b-4-B", "b-4-dup2"]);
    expect(block("s1202::b-4-dup2").text.startsWith("(4) Inflation adjustment.—")).toBe(true);
    expect(block("s1202::b-4").text.startsWith("(4) Applicable dollar limit.—")).toBe(true);
  });

  it("writes the header line, then the chapeaus above, then the block", () => {
    expect(block("s168::k-2-E-i").contextualizedText).toBe(
      [
        "26 U.S.C. § 168(k)(2)(E)(i) — Accelerated cost recovery system › (k) Special allowance for certain property › (2) Qualified property › (E) Special rules",
        "For purposes of this subsection—",
        block("s168::k-2-E-i").text,
      ].join("\n"),
    );
    expect(block("s469::g-2").contextualizedText?.split("\n").slice(0, 2)).toEqual([
      "26 U.S.C. § 469(g)(2) — Passive activity losses and credits limited › (g) Dispositions of entire interest in passive activity",
      "If during the taxable year a taxpayer disposes of his entire interest in any passive activity (or former passive activity), the following rules shall apply:",
    ]);
  });

  it("makes every block a verbatim slice of the canonical text, with a unique id", () => {
    const ids = parsed.blocks.map((row) => row.blockId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const row of parsed.blocks) {
      expect(row.text).toBe(parsed.canonicalText.slice(row.charStart, row.charEnd));
      expect(row.text.length).toBeLessThanOrEqual(MAX_BLOCK_CHARS);
      expect(row).toMatchObject({ pageNum: 1, blockType: "paragraph", contextualSummary: null });
    }
  });
});

describe("parseUslmTitle: what stays out", () => {
  const OUTSIDE_STATUTE = [
    "Statutory Notes",
    "Editorial Notes",
    "Amendments",
    "Effective Date",
    "Pub. L.",
    "See References in Text",
    "So in original",
    "Section numbers editorially supplied",
    "Normal taxes and surtaxes.",
    "Tax on individuals.",
    "REPEALED",
  ];

  it.each(OUTSIDE_STATUTE)(
    "has no %s text from notes, credits, footnotes or tables of contents",
    (text) => {
      expect(parsed.canonicalText).not.toContain(text);
    },
  );

  it("keeps the words around a footnote", () => {
    expect(block("s36b::b").text).toContain(
      "determined under section 1(c) (relating to unmarried individuals",
    );
  });

  it("fails loudly without a title", () => {
    expect(() => parseUslmTitle("<uscDoc><main></main></uscDoc>", DOC)).toThrow(/no <main><title>/);
  });
});
