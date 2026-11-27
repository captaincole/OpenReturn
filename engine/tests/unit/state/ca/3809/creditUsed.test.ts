/*
 * FTB 3809's credit path with a stub return: the $5,000,000 business credit
 * limit and the Form 540NR gap, which no made-up return reaches cheaply, and
 * the credit up to the tax left with no Schedule P (540).
 */

import { describe, expect, it } from "vitest";
import {
  ttaCreditAvailable,
  ttaCreditUsed,
  ttaSectionB2Credit,
} from "../../../../../src/state/ca/3809/creditUsed.js";
import type { Form3809FilingInfo } from "../../../../../src/state/ca/3809/filingInfo.js";

const LINE_35 = "form-540.line.35_total_tax_after_credits";

function infoWith(forms: string[], income: number, hiring: number): Form3809FilingInfo {
  const mustFile = Object.fromEntries(forms.map((formId) => [formId, { value: true }]));
  return {
    mustFile,
    filingStatus: "single",
    tta: {
      business: {
        role: "operator",
        sicCode: "2051",
        businessName: "Test Bakery",
        businessAddress: "1 Main St, Visalia, CA 93291",
        areaName: "Tulare County TTA",
      },
      apportionment: {
        whollyWithinTta: true,
        propertyCalifornia: 0,
        propertyTta: 0,
        payrollCalifornia: 0,
        payrollTta: 0,
      },
      incomeItems: [{ line: "schedule_c", description: "Bakery", amount: income }],
      hiringCarryover: hiring,
      salesCarryover: 0,
      nolRows: [],
    },
  } as unknown as Form3809FilingInfo;
}

const readWith = (line35: number) => (fieldId: string) =>
  fieldId === LINE_35 ? line35 : undefined;
const reasonOf = (value: unknown) => (value as { reason?: string }).reason ?? "";

describe("FTB 3809 credit path", () => {
  it("above $5,000,000 of net tax the business credit limit can bind: a gap", () => {
    const info = infoWith(["form-3809", "form-540"], 60_000_000, 1000);
    expect(reasonOf(ttaCreditAvailable(readWith(6_000_000), info))).toMatch(/5,000,000/);
    expect(ttaCreditAvailable(readWith(4_000_000), info)).toBe(1000);
  });

  it("a Form 540NR return is a gap", () => {
    const info = infoWith(["form-3809", "form-540nr"], 60000, 1000);
    expect(reasonOf(ttaCreditUsed(readWith(4000), info))).toMatch(/540NR/);
  });

  it("with no Schedule P (540), the credit up to the tax left", () => {
    const info = infoWith(["form-3809", "form-540"], 200000, 50000);
    const read = readWith(3000);
    // Line 7 is the smaller of the tax on $200,000 ($15,039) and line 35.
    expect(ttaCreditAvailable(read, info)).toBe(3000);
    // The tax on $60,000 is $2,184 (Schedule X: 1,987.41 + 8% of 2,458).
    expect(ttaCreditAvailable(read, infoWith(["form-3809", "form-540"], 60000, 50000))).toBe(2184);
    expect(ttaCreditUsed(read, info)).toBe(3000);
    expect(ttaSectionB2Credit(read, info)).toEqual({
      code: "210",
      name: "Targeted Tax Area",
      allowed: 3000,
    });
  });

  it("no FTB 3809, or no credit carryover, takes nothing", () => {
    expect(ttaCreditUsed(readWith(3000), infoWith(["form-540"], 60000, 1000))).toBe(0);
    const none = infoWith(["form-3809", "form-540"], 60000, 0);
    expect(ttaCreditUsed(readWith(3000), none)).toBe(0);
    expect(ttaSectionB2Credit(readWith(3000), none)).toBeNull();
  });
});
