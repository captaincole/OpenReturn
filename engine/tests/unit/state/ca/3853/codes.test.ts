/*
 * FTB 3853 Part III codes (src/state/ca/3853/codes.ts): the short coverage gap
 * examples of the instructions, the birth months and column (a).
 */

import { describe, expect, it } from "vitest";
import {
  fullYearCode,
  monthCodes,
  needsMonthsBefore2025,
  type CodeInputs,
} from "../../../../../src/state/ca/3853/codes.js";

const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const except = (...months: number[]) => ALL.filter((month) => !months.includes(month));
const none = ALL.map(() => false);

const codesOf = (inputs: Partial<CodeInputs>, unaffordable = none) =>
  monthCodes({ coveredMonths: [], exemptions: [], ...inputs }, unaffordable)?.map((month) =>
    month.join("+"),
  );

describe("short coverage gap (code C)", () => {
  it("Chris (example-1-4): only the first of two short gaps", () => {
    expect(codesOf({ coveredMonths: except(2, 3, 10, 11) })).toEqual([
      "Z",
      "C",
      "C",
      "Z",
      "Z",
      "Z",
      "Z",
      "Z",
      "Z",
      "X",
      "X",
      "Z",
    ]);
  });

  it("Roger (example-2-4): a day of coverage covers April and July; May and June are a short gap", () => {
    expect(codesOf({ coveredMonths: except(5, 6) })).toEqual([
      "Z",
      "Z",
      "Z",
      "Z",
      "C",
      "C",
      "Z",
      "Z",
      "Z",
      "Z",
      "Z",
      "Z",
    ]);
  });

  it("the instructions' rule: January to March is short, January to April is not", () => {
    expect(
      codesOf({ coveredMonths: except(1, 2, 3), uncoveredMonthsBefore2025: 0 })?.slice(0, 4),
    ).toEqual(["C", "C", "C", "Z"]);
    expect(codesOf({ coveredMonths: except(1, 2, 3, 4) })?.slice(0, 5)).toEqual([
      "X",
      "X",
      "X",
      "X",
      "Z",
    ]);
  });

  it("Sam (example-1-5): December 2024 plus January and February is short", () => {
    expect(
      codesOf({ coveredMonths: except(1, 2), uncoveredMonthsBefore2025: 1 })?.slice(0, 3),
    ).toEqual(["C", "C", "Z"]);
  });

  it("Sam (example-2-5): December 2024 plus January to March is not short", () => {
    expect(
      codesOf({ coveredMonths: except(1, 2, 3), uncoveredMonthsBefore2025: 1 })?.slice(0, 4),
    ).toEqual(["X", "X", "X", "Z"]);
  });

  it("a long first gap leaves the next short gap as the first short gap", () => {
    expect(
      codesOf({ coveredMonths: except(1, 2, 3, 4, 5, 9), uncoveredMonthsBefore2025: 0 }),
    ).toEqual(["X", "X", "X", "X", "X", "Z", "Z", "Z", "C", "Z", "Z", "Z"]);
  });

  it("waits for the 2024 months only when a short gap starts in January", () => {
    const inputs = { coveredMonths: except(1), exemptions: [] };
    expect(needsMonthsBefore2025(inputs)).toBe(true);
    expect(monthCodes(inputs, none)).toBeUndefined();
    expect(needsMonthsBefore2025({ coveredMonths: except(1, 2, 3, 4), exemptions: [] })).toBe(
      false,
    );
    expect(needsMonthsBefore2025({ coveredMonths: except(5), exemptions: [] })).toBe(false);
  });
});

describe("stated, birth and unaffordable months", () => {
  it("Kate (example-3-2): I for January to April, A for October to December, X between", () => {
    const codes = codesOf({
      coveredMonths: [],
      exemptions: [
        { code: "I", months: [1, 2, 3, 4] },
        { code: "A", months: [10, 11, 12] },
      ],
    });
    expect(codes).toEqual(["I", "I", "I", "I", "X", "X", "X", "X", "X", "A", "A", "A"]);
  });

  it("a birth in 2025 gives I through the birth month", () => {
    expect(codesOf({ coveredMonths: except(1, 2, 3), birthMonth: 3 })?.slice(0, 4)).toEqual([
      "I",
      "I",
      "I",
      "Z",
    ]);
  });

  it("an unaffordable month is A and is not part of a gap", () => {
    const unaffordable = none.map((_, index) => index >= 6);
    expect(codesOf({ coveredMonths: [1, 2, 3, 4, 5, 6] }, unaffordable)).toEqual([
      "Z",
      "Z",
      "Z",
      "Z",
      "Z",
      "Z",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
    ]);
  });

  it("two stated codes in a month fill both fields; a third is dropped", () => {
    const codes = codesOf({
      exemptions: [
        { code: "K", months: ALL },
        { code: "F", months: [3] },
        { code: "G", months: [3] },
      ],
    });
    expect(codes?.[2]).toBe("K+F");
    expect(codes?.[0]).toBe("K");
  });

  it("code B covers the whole year whatever months are stated", () => {
    expect(codesOf({ exemptions: [{ code: "B", months: [1] }] })).toEqual(ALL.map(() => "B"));
  });

  it("coverage wins over a stated exemption in the same month", () => {
    expect(codesOf({ coveredMonths: [1], exemptions: [{ code: "F", months: ALL }] })?.[0]).toBe(
      "Z",
    );
  });
});

describe("column (a)", () => {
  it("holds a code that covers the whole year, else nothing", () => {
    expect(fullYearCode(ALL.map(() => ["Z"]))).toBe("Z");
    expect(fullYearCode(ALL.map(() => ["X"]))).toBe("X");
    expect(fullYearCode([["Z"], ...ALL.slice(1).map(() => ["X"])])).toBeUndefined();
    expect(fullYearCode(ALL.map(() => ["K", "F"]))).toBeUndefined();
  });
});
