/*
 * Schedule 3 line 11 for one person: the Form 1040 instructions'
 * rule (irs-1040-inst-2025::sec::line-11-2::b01) with the steps of Pub. 3's
 * worksheet (irs-pub-3-2025::sec::credit-for-excess-social-security-tax-withheld-worksheet::b01).
 */

import { describe, expect, it } from "vitest";
import type { W2FactValue } from "../../../../src/facts/index.js";
import {
  MAX_SOCIAL_SECURITY_TAX_2025,
  RAILROAD_W2_GAP,
  UNCOLLECTED_TAX_GAP,
  excessSocialSecurityOf,
} from "../../../../src/federal/schedule-3/excessSocialSecurity.js";

const w2 = (employerEin: string, box4: number, more: Partial<W2FactValue> = {}): W2FactValue => ({
  employerName: `Employer ${employerEin}`,
  employerEin,
  box1: 100000,
  box2: 10000,
  box4,
  ...more,
});

describe("the 2025 maximum", () => {
  it("is 6.2% of the $176,100 wage base, $10,918.20", () => {
    expect(MAX_SOCIAL_SECURITY_TAX_2025).toBe(10918.2);
  });
});

describe("two or more employers", () => {
  it("claims the tax withheld over $10,918.20", () => {
    expect(excessSocialSecurityOf([w2("00-0000001", 6971.9), w2("00-0000002", 4916.6)])).toEqual({
      amount: 970.3,
    });
  });

  it("claims nothing at $10,918.20 or less", () => {
    expect(excessSocialSecurityOf([w2("00-0000001", 6000), w2("00-0000002", 4918.2)])).toEqual({
      amount: 0,
    });
    expect(excessSocialSecurityOf([w2("00-0000001", 6000), w2("00-0000002", 4918.21)])).toEqual({
      amount: 0.01,
    });
  });

  it("counts each employer up to $10,918.20 (decision A68)", () => {
    // Worksheet line 1: 10,918.20 + 3,000 = 13,918.20; less 10,918.20 = 3,000.
    expect(excessSocialSecurityOf([w2("00-0000001", 11000), w2("00-0000002", 3000)])).toEqual({
      amount: 3000,
    });
  });
});

describe("one employer", () => {
  it("claims nothing when that employer withheld too much: the employer refunds it", () => {
    expect(excessSocialSecurityOf([w2("00-0000001", 11500)])).toEqual({ amount: 0 });
  });

  it("is one employer for two W-2s with the same EIN, written either way", () => {
    expect(excessSocialSecurityOf([w2("00-0000001", 7000), w2("000000001", 5000)])).toEqual({
      amount: 0,
    });
  });

  it("is never a gap: a railroad W-2 or uncollected tax changes nothing", () => {
    const railroad = w2("00-0000001", 0, { box14: [{ label: "Tier 1 tax", amount: 11000 }] });
    expect(excessSocialSecurityOf([railroad])).toEqual({ amount: 0 });
  });
});

describe("the gaps", () => {
  it("a railroad W-2 (tier 1 RRTA tax in box 14) with another employer", () => {
    const railroad = w2("00-0000001", 0, { box14: [{ label: "Tier 1 tax", amount: 6000 }] });
    expect(excessSocialSecurityOf([railroad, w2("00-0000002", 6000)])).toEqual({
      gap: RAILROAD_W2_GAP,
    });
  });

  it("uncollected social security tax in box 12 (code A or M) with another employer", () => {
    const tips = w2("00-0000001", 6000, { box12: [{ code: "A", amount: 120 }] });
    expect(excessSocialSecurityOf([tips, w2("00-0000002", 6000)])).toEqual({
      gap: UNCOLLECTED_TAX_GAP,
    });
  });

  it("other box 14 labels are not railroad tax", () => {
    const sdi = w2("00-0000001", 6000, { box14: [{ label: "CA SDI", amount: 900 }] });
    expect(excessSocialSecurityOf([sdi, w2("00-0000002", 6000)])).toEqual({ amount: 1081.8 });
  });
});
