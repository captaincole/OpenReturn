/*
 * Form 6478's pure rules. The instructions publish no example with numbers,
 * so these are stated-rule and limit tests.
 */

import { describe, expect, it } from "vitest";
import {
  LAST_YEAR_OF_SALE_OR_USE,
  RATE_PER_GALLON,
  TAX_YEAR,
  line1ColumnCOf,
  line3Of,
  line4Of,
  ownProductionCanQualify,
} from "../../../../src/federal/6478/lines.js";

describe("Form 6478 lines", () => {
  it("the credit ends with fuel sold or used in 2024 (what-s-new::b01, 40(b)(6)(J))", () => {
    expect(LAST_YEAR_OF_SALE_OR_USE).toBe(2024);
    expect(ownProductionCanQualify(2024)).toBe(true);
    expect(ownProductionCanQualify(2025)).toBe(false);
    expect(ownProductionCanQualify(TAX_YEAR)).toBe(false);
  });

  it("line 1 column (c) is gallons × $1.01, whole dollars (specific-instructions::b01)", () => {
    expect(RATE_PER_GALLON).toBe(1.01);
    expect(line1ColumnCOf(2400)).toBe(2424);
    expect(line1ColumnCOf(50)).toBe(51); // 50.50 rounds up
    expect(line1ColumnCOf(49)).toBe(49); // 49.49 rounds down
    expect(line1ColumnCOf(0)).toBe(0);
  });

  it("line 3 rounds each pass-through credit, then adds (row A96)", () => {
    expect(line3Of([600.4, 1200.4])).toBe(1800);
    expect(line3Of([600.5, 1200.5])).toBe(1802);
    expect(line3Of([2474])).toBe(2474);
    expect(line3Of([])).toBe(0);
  });

  it("line 4 is line 2 plus line 3, blank only when both are blank", () => {
    expect(line4Of(undefined, 2474)).toBe(2474);
    expect(line4Of(100, 2474)).toBe(2574);
    expect(line4Of(undefined, undefined)).toBeUndefined();
  });

  it("line 4 equals the sum of its parts for any pass-through credits", () => {
    const credits = [10.49, 250, 3999.5];
    const line3 = line3Of(credits);
    expect(line4Of(undefined, line3)).toBe(line3);
    expect(line3).toBe(10 + 250 + 4000);
  });
});
