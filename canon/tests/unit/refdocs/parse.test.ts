/*
 * Heading detection and block ids. Synthetic one-page docs; each test pins
 * one rule. Real-doc behavior is measured by re-ingest stats, not here.
 */

import { describe, expect, it } from "vitest";
import { parseDoc, type ParserStyle } from "../../../src/refdocs/parse.js";

function parse(text: string, style: ParserStyle = "irs") {
  return parseDoc(text, [{ pageNum: 1, charStart: 0, charEnd: text.length }], {
    docId: "doc",
    style,
  });
}
const headings = (text: string, style?: ParserStyle) =>
  parse(text, style).sections.map((s) => s.heading);

describe("parseDoc headings", () => {
  it("run-in line heading keeps its body in the block", () => {
    const d = parse("Intro text here.\nLine 4. If any of your trades had a loss, enter it.\n");
    expect(d.sections.map((s) => s.heading)).toContain("Line 4");
    expect(d.blocks.some((b) => b.text.startsWith("If any of your trades"))).toBe(true);
  });

  it("run-in line lists and parts", () => {
    const h = headings("Intro.\nLines 2 and 16. Enter your QBI.\nPart I. Use a separate Part I.\n");
    expect(h).toEqual(expect.arrayContaining(["Lines 2 and 16", "Part I"]));
  });

  it("prose heading after a sentence end, followed by body", () => {
    expect(headings("Intro sentence.\nPurpose of Form\nUse this form to figure it.\n")).toContain(
      "Purpose of Form",
    );
  });

  it("rejects a wrapped bullet line (previous line has no period)", () => {
    const h = headings(
      "Intro.\n• Schedule D, Special Rules for Patrons of\nAgricultural or Horticultural Cooperatives\nmore body text here.\n",
    );
    expect(h).not.toContain("Agricultural or Horticultural Cooperatives");
  });

  it("rejects table cells, Yes/No answers, dates and See-references", () => {
    const h = headings(
      "Intro.\nSuspended\nUtilized 2018\nRemaining\n(1,000)\n" +
        "Done.\nYes No\nthen body.\nDone.\nApril 15, 2025\nbody.\nDone.\nSee Sales and Exchanges Between\nrelated persons.\n",
    );
    expect(h).toEqual(["(Preamble)"]);
  });

  it("FTB: 'Line 1 – <sentence>' splits; 'Line 2a – Title' stays whole", () => {
    const d = parse(
      "Intro.\nLine 1 – Enter your 2025 tax liability from the return.\nLine 2a – Alimony Received\nBody.\n",
      "ftb",
    );
    const h = d.sections.map((s) => s.heading);
    expect(h).toEqual(expect.arrayContaining(["Line 1", "Line 2a – Alimony Received"]));
    expect(d.blocks.some((b) => b.text.startsWith("Enter your 2025 tax liability"))).toBe(true);
  });

  it("drops running headers and footers", () => {
    const h = headings(
      "FTB 5805 Instructions 2025 Page 1\nIntro.\nInstructions for Form 8995-A (2025) 5\nMore.\n",
      "ftb",
    );
    expect(h).toEqual(["(Preamble)"]);
  });
});

describe("block ids", () => {
  it("are section-anchored and numbered within the section", () => {
    const d = parse("Intro.\nLine 4. First line body.\nMore body.\n");
    const ids = d.blocks.map((b) => b.blockId);
    expect(ids).toContain("doc::sec::line-4::b01");
    expect(ids).toContain("doc::sec::preamble::b01");
  });
});
