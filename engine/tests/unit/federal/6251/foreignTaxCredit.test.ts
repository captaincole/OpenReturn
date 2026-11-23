/*
 * Form 6251 lines 8–11 with the regular foreign tax credit (Schedule 3 line 1):
 * irs-6251-inst-2025::sec::line-8-alternative-minimum-tax-foreign-tax::b01, b02.
 */

import { describe, expect, it } from "vitest";
import type { ForeignTaxSource } from "../../../../src/federal/1116/sources.js";
import type { Form6251FilingInfo } from "../../../../src/federal/6251/filingInfo.js";
import {
  line10Of,
  line11Of,
  line8Of,
  line9Of,
} from "../../../../src/federal/6251/foreignTaxCredit.js";

const source: ForeignTaxSource = {
  factKey: "account.fund.dividends",
  payer: "Fund",
  country: "RIC",
  category: "passive",
  incomeKind: "dividends",
  grossIncome: undefined,
  foreignTaxPaid: 150,
  onPayeeStatement: true,
};

const electionInfo = {
  filingStatus: "single",
  foreignTax: { sources: [source], election: true, categories: [], claimAccrued: false },
} as unknown as Form6251FilingInfo;

/* Form 1116 files but cannot be figured: Schedule 3 line 1 is a gap. */
const form1116GapInfo = {
  ...electionInfo,
  mustFile: { "form-1116": { value: true } },
  foreignTax: { ...electionInfo.foreignTax, election: false, formGap: "test gap" },
} as unknown as Form6251FilingInfo;

const accessor = (line7: number, line10: number) => ({
  "form-1040.line.16": 4000,
  "form-6251.0.line.7_tax_on_line_6": line7,
  "form-6251.0.line.10_regular_tax_less_credits": line10,
});

describe("Form 6251 with a foreign tax credit", () => {
  it("line 10 subtracts Schedule 3 line 1 (the election's 150)", () => {
    expect(line10Of(accessor(0, 0), electionInfo)).toBe(3850);
  });

  it("line 10 at least line 7: line 8 blank, line 11 is 0", () => {
    const form = accessor(3000, 3850);
    expect(line8Of(form, electionInfo)).toBeUndefined();
    expect(line9Of(form, electionInfo)).toBe(3000);
    expect(line11Of(form, electionInfo)).toBe(0);
  });

  it("the election: line 8 is the Schedule 3 line 1 amount", () => {
    const form = accessor(5000, 3850);
    expect(line8Of(form, electionInfo)).toBe(150);
    expect(line9Of(form, electionInfo)).toBe(4850);
    expect(line11Of(form, electionInfo)).toBe(1000);
  });

  it("a gap in Schedule 3 line 1 is a gap on lines 10 and 11", () => {
    const form = accessor(5000, 3850);
    expect(line10Of(form, form1116GapInfo)).toMatchObject({ unsupported: true });
    expect(line11Of(form, form1116GapInfo)).toMatchObject({ unsupported: true });
  });

  it("no foreign tax: line 8 blank, line 9 is line 7", () => {
    const info = { filingStatus: "single" } as unknown as Form6251FilingInfo;
    const form = { ...accessor(5000, 4000) };
    expect(line8Of(form, info)).toBeUndefined();
    expect(line9Of(form, info)).toBe(5000);
    expect(line11Of(form, info)).toBe(1000);
  });
});
