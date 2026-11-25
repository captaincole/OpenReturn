import { describe, expect, it } from "vitest";
import { MAX_BLOCK_CHARS } from "../../../src/refdocs/chunk.js";
import { PAGE_SEPARATOR, type PageSlice } from "../../../src/refdocs/extract.js";
import { instructionsOffset, type FacePage } from "../../../src/refdocs/face/detectFace.js";
import { mergeFace } from "../../../src/refdocs/face/mergeFace.js";
import { parseFace } from "../../../src/refdocs/face/parseFace.js";
import { parseDoc } from "../../../src/refdocs/parse.js";

const FORM_LINES = [
  "Form 6252 Installment Sale Income",
  "1 Description of property",
  "Part I Gross Profit and Contract Price. Complete this part for all years.",
  "13 Add lines 10, 11, and 12 . . . . . . 13",
  "14 Subtract line 13 from line 5. If zero or less, don’t complete the rest of this form . . 14",
  "Part II Installment Sale Income. Complete this part for all years.",
  "19 Gross profit percentage. Divide line 16 by line 18 . . . 19",
];

describe("parseFace", () => {
  it("makes a header section and one section per part, marked as the form face", () => {
    const face = parseFace([{ pageNum: 1, lines: FORM_LINES }], "irs-6252-form-2025");
    expect(face.sections.map((section) => [section.headingSlug, section.heading])).toEqual([
      ["face-header", "Form face: header"],
      ["face-part-i", "Form face: Part I Gross Profit and Contract Price"],
      ["face-part-ii", "Form face: Part II Installment Sale Income"],
    ]);
    expect(face.blocks[1]).toMatchObject({
      blockId: "irs-6252-form-2025::sec::face-part-i::b01",
      blockType: "form_face",
      text:
        "Part I Gross Profit and Contract Price. Complete this part for all years.\n" +
        "13 Add lines 10, 11, and 12\n" +
        "14 Subtract line 13 from line 5. If zero or less, don’t complete the rest of this form",
    });
    for (const block of face.blocks) {
      expect(face.text.slice(block.charStart, block.charEnd)).toBe(block.text);
    }
  });

  it("splits a long part between rows and keeps the part as each block's section", () => {
    const rows = Array.from(
      { length: 40 },
      (_, i) =>
        `${i + 1} Enter the amount of item number ${i + 1} from the worksheet in the instructions`,
    );
    const face = parseFace([{ pageNum: 1, lines: ["Part I Items", ...rows] }], "doc");
    expect(face.blocks.length).toBeGreaterThan(2);
    for (const block of face.blocks) {
      expect(block.sectionId).toBe("doc::sec::face-part-i");
      expect(block.text.length).toBeLessThanOrEqual(MAX_BLOCK_CHARS);
      for (const row of block.text.split("\n")) {
        expect(["Part I Items", ...rows]).toContain(row);
      }
    }
  });

  it("gives a form with no parts one section per page", () => {
    const face = parseFace(
      [
        { pageNum: 1, lines: ["1a Total amount from Form(s) W-2 . . . 1a"] },
        { pageNum: 2, lines: ["11b Amount from line 11a . . . 11b"] },
      ],
      "doc",
    );
    expect(face.sections.map((section) => section.heading)).toEqual([
      "Form face: page 1",
      "Form face: page 2",
    ]);
    expect(face.text).toBe(
      `1a Total amount from Form(s) W-2${PAGE_SEPARATOR}11b Amount from line 11a`,
    );
  });

  it("does not take a slug the instructions already use", () => {
    const face = parseFace(
      [{ pageNum: 1, lines: ["Part I Items", "1 Enter it"] }],
      "doc",
      new Set(["face-part-i"]),
    );
    expect(face.sections[0].headingSlug).toBe("face-part-i-2");
  });
});

describe("instructionsOffset", () => {
  it("finds the line that starts the instructions", () => {
    const text = "13 Add lines 11 and 12\nGeneral Instructions\nPurpose of form.";
    expect(instructionsOffset(text)).toBe(text.indexOf("General Instructions"));
    expect(instructionsOffset("1 Description of property\n2 Date sold")).toBeNull();
  });
});

/* A two-page PDF as extractPdf returns it: the form, then its instructions. */
function combinedDoc(page1: string, page2: string): { canonicalText: string; pages: PageSlice[] } {
  const canonicalText = page1 + PAGE_SEPARATOR + page2;
  const start2 = page1.length + PAGE_SEPARATOR.length;
  return {
    canonicalText,
    pages: [
      { pageNum: 1, charStart: 0, charEnd: page1.length },
      { pageNum: 2, charStart: start2, charEnd: canonicalText.length },
    ],
  };
}

describe("mergeFace", () => {
  const facePage1 = FORM_LINES.join("\n");
  const instructions =
    "General Instructions\nPurpose of Form\nUse Form 6252 to report income.\nLine 14\nEnter the gain.";

  it("keeps every instruction block's id and text and replaces the face blocks", () => {
    const raw = combinedDoc(facePage1, instructions);
    const prose = parseDoc(raw.canonicalText, raw.pages, { docId: "doc" });
    const face: FacePage[] = [
      { pageNum: 1, faceChars: facePage1.length, wholePage: true, lines: FORM_LINES },
    ];
    const merged = mergeFace(raw, prose, face, "doc");

    const onPage2 = prose.blocks.filter((block) => block.pageNum === 2);
    for (const block of onPage2) {
      expect(merged.blocks.find((kept) => kept.blockId === block.blockId)?.text).toBe(block.text);
    }
    const onPage1 = merged.blocks.filter((block) => block.pageNum === 1);
    expect(onPage1.every((block) => block.blockType === "form_face")).toBe(true);
    for (const block of merged.blocks) {
      expect(merged.canonicalText.slice(block.charStart, block.charEnd)).toBe(block.text);
    }
    expect(merged.sections[0].headingSlug).toBe("face-header");
    expect(merged.sections.map((section) => section.ordinal)).toEqual(
      merged.sections.map((_, i) => i),
    );
  });

  it("splits a page whose instructions start below the form", () => {
    const page1 = `${facePage1}\n${instructions}`;
    const raw = combinedDoc(page1, "Line 19\nDivide line 16 by line 18.");
    const prose = parseDoc(raw.canonicalText, raw.pages, { docId: "doc" });
    const face: FacePage[] = [
      { pageNum: 1, faceChars: instructionsOffset(page1)!, wholePage: false, lines: FORM_LINES },
    ];
    const merged = mergeFace(raw, prose, face, "doc");

    expect(
      merged.blocks.some((block) => block.text.includes("Use Form 6252 to report income.")),
    ).toBe(true);
    expect(
      merged.blocks.some(
        (block) => block.blockType !== "form_face" && block.text.includes("13 Add lines"),
      ),
    ).toBe(false);
    for (const block of merged.blocks) {
      expect(merged.canonicalText.slice(block.charStart, block.charEnd)).toBe(block.text);
    }
    const firstInstruction = merged.blocks.find((block) => block.blockType !== "form_face");
    expect(merged.pages[0].charEnd).toBeGreaterThan(firstInstruction!.charStart);
  });
});
