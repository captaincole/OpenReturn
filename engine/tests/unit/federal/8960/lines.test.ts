/* Source: 2025 Form 8960, line 12 ("If zero or less, enter -0-"). */

import { describe, expect, it } from "vitest";
import { netInvestmentIncome } from "../../../../src/federal/8960/lines.js";

describe("Form 8960 line 12", () => {
  it.each([
    // label, line 8, line 11, line 12
    ["income over deductions", 60000, 192, 59808],
    ["a capped loss bigger than interest", -2000, undefined, 0],
    ["deductions bigger than income", 500, 900, 0],
  ] as Array<[string, number, number | undefined, number]>)("%s", (_, line8, line11, expected) => {
    expect(netInvestmentIncome(line8, line11)).toBe(expected);
  });
});
