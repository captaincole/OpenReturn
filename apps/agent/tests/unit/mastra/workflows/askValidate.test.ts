import { describe, expect, it } from "vitest";
import {
  NOT_COVERED_ANSWER,
  validateAnswer,
  type Passage,
} from "../../../../src/mastra/workflows/askTurn/validate";

const passage = (n: number, text: string): Passage => ({
  blockId: `doc::sec::b0${n}`,
  docId: "doc",
  documentTitle: "Doc",
  sectionHeading: "Section",
  pageNum: n,
  text,
});

const passages = [
  passage(1, "Unrelated text."),
  passage(2, "If you have self-only coverage, your maximum contribution is $4,300."),
  passage(3, "If you have family coverage, your maximum contribution is $8,550."),
];

describe("validateAnswer", () => {
  it("renumbers markers by first appearance and keeps verbatim quotes", () => {
    const out = validateAnswer(
      {
        coverage: "covered",
        answer: "Self-only is $4,300 [2]. Family is $8,550 [3]. Again [2].",
        citations: [
          { passage: 2, quote: "your maximum contribution is $4,300" },
          { passage: 3, quote: "your  MAXIMUM contribution is $8,550." },
        ],
        missingDocuments: [],
      },
      passages,
    );
    expect(out.answer).toBe("Self-only is $4,300 [1]. Family is $8,550 [2]. Again [1].");
    expect(out.citations.map((c) => [c.n, c.blockId])).toEqual([
      [1, "doc::sec::b02"],
      [2, "doc::sec::b03"],
    ]);
    expect(out.citations[0].quote).toBe("your maximum contribution is $4,300");
    expect(out.dropped.quotes).toEqual([]);
  });

  it("drops markers for passages that were not retrieved", () => {
    const out = validateAnswer(
      { coverage: "partial", answer: "A [3]. B [9].", citations: [], missingDocuments: [] },
      passages,
    );
    expect(out.answer).toBe("A [1]. B.");
    expect(out.dropped.markers).toEqual([9]);
  });

  it("splits marker lists like [2, 3]", () => {
    const out = validateAnswer(
      { coverage: "covered", answer: "Limits apply [2, 3].", citations: [], missingDocuments: [] },
      passages,
    );
    expect(out.answer).toBe("Limits apply [1][2].");
  });

  it("falls back to the passage text when a quote is not verbatim", () => {
    const out = validateAnswer(
      {
        coverage: "covered",
        answer: "Family is $8,550 [3].",
        citations: [{ passage: 3, quote: "family limit is 8550" }],
        missingDocuments: [],
      },
      passages,
    );
    expect(out.citations[0].quote).toBe(passages[2].text);
    expect(out.dropped.quotes).toEqual([3]);
  });

  it("treats an answer with no valid marker as not covered", () => {
    const out = validateAnswer(
      { coverage: "covered", answer: "You can deduct it.", citations: [], missingDocuments: [] },
      passages,
    );
    expect(out.coverage).toBe("not_covered");
    expect(out.answer).toBe(NOT_COVERED_ANSWER);
    expect(out.dropped.ungrounded).toBe(true);
  });

  it("keeps a not_covered answer's text without markers", () => {
    const out = validateAnswer(
      {
        coverage: "not_covered",
        answer: "Our library does not cover home offices yet [1].",
        citations: [],
        missingDocuments: [" Publication 587 ", ""],
      },
      passages,
    );
    expect(out.answer).toBe("Our library does not cover home offices yet.");
    expect(out.citations).toEqual([]);
    expect(out.missingDocuments).toEqual(["Publication 587"]);
  });
});
