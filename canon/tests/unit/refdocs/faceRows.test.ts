import { describe, expect, it } from "vitest";
import { cleanFaceLine, faceRows, isFaceNoise } from "../../../src/refdocs/face/faceRows.js";
import { linesFromPositions } from "../../../src/refdocs/face/pageLines.js";

describe("faceRows", () => {
  it("joins a wrapped label and drops the dot leaders and the box number", () => {
    expect(
      faceRows([
        "5 Selling price including mortgages and other debts. Don’t include interest 5",
        "6 Mortgages, debts, and other liabilities the buyer assumed or took the property",
        "subject to (see instructions) . . . . . . . . . . . . . . . . . 6",
        "7 Subtract line 6 from line 5 . . . . . . . . . . . . . . . . . 7",
      ]),
    ).toEqual([
      "5 Selling price including mortgages and other debts. Don’t include interest",
      "6 Mortgages, debts, and other liabilities the buyer assumed or took the property subject to (see instructions)",
      "7 Subtract line 6 from line 5",
    ]);
  });

  it("keeps a sentence period before the leaders and the Yes No boxes", () => {
    expect(
      faceRows([
        "13 Enter federal AGI from federal Form 1040 or 1040-SR, line 11b. . . 13",
        "28 Did the related party resell the property? . . . . . Yes No",
      ]),
    ).toEqual([
      "13 Enter federal AGI from federal Form 1040 or 1040-SR, line 11b.",
      "28 Did the related party resell the property? Yes No",
    ]);
  });

  it("joins a wrap that starts with a capital into a numbered row that has not reached its box", () => {
    expect(
      faceRows([
        "21 Payments received during year (see instructions).",
        "Don’t include interest, whether stated or unstated . 21",
        "22 Add lines 20 and 21 . . . . . 22",
      ]),
    ).toEqual([
      "21 Payments received during year (see instructions). Don’t include interest, whether stated or unstated",
      "22 Add lines 20 and 21",
    ]);
  });

  it("gives sub-lines their own rows and strips their lettered box", () => {
    expect(
      faceRows([
        "25 Basis of like-kind property received. See instructions",
        "a Basis of like-kind section 1250 property received . . . . 25a",
        "b Basis of like-kind section 1245 property received . . 25b",
      ]),
    ).toEqual([
      "25 Basis of like-kind property received. See instructions",
      "a Basis of like-kind section 1250 property received",
      "b Basis of like-kind section 1245 property received",
    ]);
  });

  it("strips the box of a line written with a space before its letter", () => {
    expect(faceRows(["5 a Did you use Form 4972 after 1986? . . . . . 5a"])).toEqual([
      "5 a Did you use Form 4972 after 1986?",
    ]);
  });

  it("keeps title lines apart and joins only a lowercase wrap into an unnumbered row", () => {
    expect(
      faceRows([
        "Form 6252",
        "Installment Sale Income",
        "If both lines 9 and 10 are “No,” go to Part III. If both lines are “No” and this is not",
        "the year of the exchange, stop here.",
      ]),
    ).toEqual([
      "Form 6252",
      "Installment Sale Income",
      "If both lines 9 and 10 are “No,” go to Part III. If both lines are “No” and this is not the year of the exchange, stop here.",
    ]);
  });

  it("drops FTB cents boxes and joins a wrap that starts with a part reference", () => {
    expect(
      faceRows([
        "14 California adjustments – subtractions. Enter the amount from Schedule CA (540),",
        "Part I, line 27, column B . . . . . . . . . . . . • 14 . 00",
        "Part II Installment Sale Income. Complete this part for the year of sale.",
      ]),
    ).toEqual([
      "14 California adjustments – subtractions. Enter the amount from Schedule CA (540), Part I, line 27, column B",
      "Part II Installment Sale Income. Complete this part for the year of sale.",
    ]);
  });

  it("drops running heads, footers and lines with no words", () => {
    expect(isFaceNoise("Form 8824 (2025) Page 2")).toBe(true);
    expect(isFaceNoise("Schedule D (Form 1040) 2025 Page 2")).toBe(true);
    expect(isFaceNoise("7501253 FTB 3805E 2025 Side 1")).toBe(true);
    expect(
      isFaceNoise("For Paperwork Reduction Act Notice, see the instructions. Cat. No. 12311A"),
    ).toBe(true);
    expect(isFaceNoise(". . . . . . 12 . 00")).toBe(true);
    expect(isFaceNoise("Form 6252")).toBe(false);
  });

  it("keeps a number that is not the row's own box", () => {
    expect(cleanFaceLine("18 Contract price. Add line 7 and line 17", new Set(["18"]))).toEqual({
      text: "18 Contract price. Add line 7 and line 17",
      closed: false,
    });
  });
});

describe("linesFromPositions", () => {
  const item = (str: string, left: number, baseline: number) => ({
    str,
    x: left,
    y: baseline,
    width: str.length * 5,
  });

  it("reads top to bottom, then left to right, whatever the stream order", () => {
    const items = [
      item("7", 500, 600),
      item("7 Subtract line 6 from line 5", 40, 600),
      item("6 Mortgages", 40, 620),
    ];
    expect(linesFromPositions(items)).toEqual(["6 Mortgages", "7 Subtract line 6 from line 5 7"]);
  });

  it("starts a new line at a wide gap before a line label", () => {
    const items = [item("Income", 10, 500), item("1a Total amount from Form(s) W-2", 100, 500)];
    expect(linesFromPositions(items)).toEqual(["Income", "1a Total amount from Form(s) W-2"]);
  });

  it("leaves out empty items", () => {
    expect(linesFromPositions([item(" ", 10, 10), item("Yes", 20, 10)])).toEqual(["Yes"]);
  });
});
