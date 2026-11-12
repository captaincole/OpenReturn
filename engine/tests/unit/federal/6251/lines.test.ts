/*
 * Source: 2025 Form 6251 lines 4, 5, 7, 18 and 39, and the Exemption Worksheet—Line 5
 * (irs-6251-inst-2025::sec::line-4-alternative-minimum-taxable-income::b01,
 * irs-6251-inst-2025::sec::exemption-worksheet::b01–b02, irs-6251-inst-2025::sec::line-18::b01).
 */

import { describe, expect, it } from "vitest";
import {
  amtTaxAtRates,
  exemptionAmount,
  withMfsAddOn,
} from "../../../../src/federal/6251/bindings.js";

describe("Form 6251 AMT rates (lines 7, 18 and 39)", () => {
  it.each([
    // label, amount, status, tax
    ["26% at the break", 239100, "single", 62166],
    ["28% less 4,782 above the break", 300000, "single", 79218],
    ["26% at the MFS break", 119550, "married_filing_separately", 31083],
    ["28% less 2,391 above the MFS break", 150000, "married_filing_separately", 39609],
    ["the MFS break does not apply to MFJ", 150000, "married_filing_jointly", 39000],
  ] as const)("%s", (_, amount, status, tax) => {
    expect(amtTaxAtRates(amount, status)).toBe(tax);
  });
});

describe("Form 6251 line 5 exemption", () => {
  it.each([
    // label, line 4, status, exemption
    ["full at the phase-out start", 626350, "head_of_household", 88100],
    ["25% of the excess comes off (step 5 rounds 18,412.50 up)", 700000, "single", 69687],
    ["MFJ phases out from 1,252,700", 1300000, "married_filing_jointly", 125175],
    ["MFS phases out from 626,350", 700000, "married_filing_separately", 50087],
    ["zero at 978,750 for single", 978750, "single", 0],
    ["zero far above the range", 6238000, "head_of_household", 0],
  ] as const)("%s", (_, line4, status, exemption) => {
    expect(exemptionAmount(line4, status)).toBe(exemption);
  });
});

describe("Form 6251 line 4 married-filing-separately add-on", () => {
  it.each([
    // label, combined, status, line 4
    ["none at 900,350", 900350, "married_filing_separately", 900350],
    ["25% of the excess", 920350, "married_filing_separately", 925350],
    ["capped at 68,500", 1500000, "married_filing_separately", 1568500],
    ["none for other statuses", 1500000, "single", 1500000],
  ] as const)("%s", (_, combined, status, line4) => {
    expect(withMfsAddOn(combined, status)).toBe(line4);
  });
});
