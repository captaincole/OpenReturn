/*
 * Form 8833 layout (federal/8833/lines.ts): the 25 rows of line 6 and the two
 * address boxes. The form has no arithmetic, so the tests are limits: every
 * word prints once, in order; no row is wider than its box; the 25th row is
 * the last one; text that needs a 26th is an overflow.
 */

import { describe, expect, it } from "vitest";
import {
  FULL_ROW_CHARACTERS,
  LINE_6_ROWS,
  ROW_1_CHARACTERS,
  countryOfResidenceAddress,
  explanationRows,
  line6Of,
  unitedStatesAddress,
} from "../../../../src/federal/8833/lines.js";

const words = (text: string) => text.split(/\s+/).filter((word) => word !== "");

/* A text of `count` words of `size` letters each. */
const wordsText = (count: number, size: number) =>
  Array.from({ length: count }, () => "x".repeat(size)).join(" ");

describe("Form 8833 line 6 rows", () => {
  /*
   * UConn VITA sample "Form 8833 CHINA STUDENT 5000" (a filled 2019 form of a
   * resident alien student, Article 20(c)): its line 6 statement, as printed
   * over eight rows. Text only, no amounts depend on the year.
   */
  const VITA_SAMPLE =
    "I AM A FULL-TIME F-1 STUDENT WHO FIRST ENTERED THE U.S. ON TO BEGIN STUDIES IN THE U.S.. " +
    "MY STUDENT WAGE INCOME IS EXEMPT FROM U.S. INCOME TAX, UP TO $5,000, FOR AS LONG AS I " +
    "MAINTAIN MY STUDENT STATUS. I HAVE MET THE SUBSTANTIAL PRESENCE TEST AND AM CONSIDERED A " +
    "RESIDENT ALIEN FOR TAX PURPOSES. I AM CLAIMING EXEMPTION OF WAGES IN THE AMOUNT OF $5,000 " +
    'UNDER THE U.S./CHINA TREATY ARTICLE 20(c). THIS TREATY HAS AN "EXCEPTION TO THE SAVINGS ' +
    'CLAUSE" WHICH ALLOWS TREATY BENEFITS EVEN IF THE TAXPAYER IS ELIGIBLE TO FILE AS A ' +
    "RESIDENT ALIEN FOR TAX PURPOSES AND THE TREATY ELIGIBILITY PERIOD HAS NOT EXPIRED.";

  it("UConn VITA sample: the statement fits the form, every word in order", () => {
    const line6 = line6Of(VITA_SAMPLE);
    expect(line6.kind).toBe("rows");
    const rows = line6.kind === "rows" ? line6.rows : [];
    expect(rows.length).toBeLessThanOrEqual(LINE_6_ROWS);
    expect(words(rows.join(" "))).toEqual(words(VITA_SAMPLE));
  });

  it("row 1 is shorter than the full rows; no row is wider than its box", () => {
    const rows = explanationRows(wordsText(80, 6));
    expect(rows[0].length).toBeLessThanOrEqual(ROW_1_CHARACTERS);
    rows.slice(1).forEach((row) => expect(row.length).toBeLessThanOrEqual(FULL_ROW_CHARACTERS));
    // Eight words of 6 letters and 7 spaces make 55 characters: exactly row 1's width.
    expect(rows[0]).toBe(wordsText(8, 6));
  });

  it("a word that does not fit starts the next row", () => {
    const rows = explanationRows(`${"a".repeat(50)} ${"b".repeat(10)}`);
    expect(rows).toEqual(["a".repeat(50), "b".repeat(10)]);
  });

  it("a word longer than a whole row is cut at the row's width", () => {
    const rows = explanationRows("c".repeat(200));
    expect(rows).toEqual(["c".repeat(55), "c".repeat(115), "c".repeat(30)]);
  });

  it("a line break starts a new row; empty paragraphs and extra spaces take no room", () => {
    expect(explanationRows("First  part.\n\n\nSecond\tpart.\r\nThird.")).toEqual([
      "First part.",
      "Second part.",
      "Third.",
    ]);
  });

  it("an empty explanation has no rows", () => {
    expect(explanationRows("   \n ")).toEqual([]);
  });

  it("25 rows fit; a 26th row is an overflow that names the rows needed", () => {
    const paragraphs = (count: number) => Array.from({ length: count }, () => "Row.").join("\n");
    const fits = line6Of(paragraphs(25));
    expect(fits.kind === "rows" && fits.rows.length).toBe(25);
    expect(line6Of(paragraphs(26))).toEqual({ kind: "overflow", rowsNeeded: 26 });
  });

  it("the rows hold every character of the words, and only those", () => {
    const text = wordsText(300, 9);
    const rows = explanationRows(text);
    expect(rows.join(" ")).toBe(text);
  });
});

describe("Form 8833 addresses", () => {
  const home = { street: "1 Elm St", city: "Austin", state: "TX", zip: "78701" };

  it("the U.S. address: street, then city, state and ZIP code", () => {
    expect(unitedStatesAddress(home)).toBe("1 Elm St\nAustin, TX 78701");
    expect(unitedStatesAddress({ ...home, apt: "Apt 3" })).toBe("1 Elm St Apt 3\nAustin, TX 78701");
  });

  it("the country of residence adds the country, not abbreviated", () => {
    expect(countryOfResidenceAddress(home)).toBe("1 Elm St\nAustin, TX 78701\nUnited States");
  });

  it("an address with a part missing prints nothing", () => {
    expect(unitedStatesAddress({ ...home, zip: undefined })).toBeUndefined();
    expect(countryOfResidenceAddress({ ...home, street: "" })).toBeUndefined();
  });
});
