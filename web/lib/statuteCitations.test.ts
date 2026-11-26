import { describe, expect, it } from "vitest";
import type { AskCitation } from "./ask";
import { isLawBlockId } from "./law";
import { citedPassage, sideLabel, statuteHref } from "./statuteCitations";

const LAW = "usc-26-2025::sec::s461::l-3-B";
const IRS = "irs-461-inst-2025::sec::line-3::b01";

const cited: AskCitation = {
  n: 1,
  blockId: IRS,
  docId: "irs-461-inst-2025",
  documentTitle: "Instructions for Form 461",
  format: "pdf",
  sectionHeading: "Line 3",
  pageNum: 2,
  quote: "are not included",
};

describe("isLawBlockId", () => {
  it("is true for a statute block only", () => {
    expect(isLawBlockId(LAW)).toBe(true);
    expect(isLawBlockId(IRS)).toBe(false);
    expect(isLawBlockId("ca-540-inst-2025::sec::line-32::b01")).toBe(false);
  });
});

describe("statuteHref", () => {
  it("links a statute block to its section page, and nothing else", () => {
    expect(statuteHref(LAW)).toBe("/library/law/461#l-3-B");
    expect(statuteHref(IRS)).toBeNull();
  });
});

describe("a conflict's side", () => {
  it("shows the statute citation, the cited document, or the block id", () => {
    const statute = { blockId: LAW, quote: "q", citation: "26 U.S.C. § 461(l)(3)(B)" };
    expect(sideLabel(statute, [cited])).toBe("26 U.S.C. § 461(l)(3)(B)");
    expect(sideLabel({ blockId: IRS, quote: "q" }, [cited])).toBe("Instructions for Form 461");
    expect(sideLabel({ blockId: "irs-pub-225-2025::sec::x::b01", quote: "q" }, [cited])).toBe(
      "irs-pub-225-2025::sec::x::b01",
    );
  });

  it("finds the answer's citation of the same block", () => {
    expect(citedPassage({ blockId: IRS, quote: "q" }, [cited])).toBe(cited);
    expect(citedPassage({ blockId: LAW, quote: "q" }, [cited])).toBeUndefined();
  });
});
