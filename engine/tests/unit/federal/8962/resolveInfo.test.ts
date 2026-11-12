/* Source: irs-8962-inst-2025::sec::who-must-file::b01 and ::sec::line-10::b01. */

import { describe, expect, it } from "vitest";
import {
  PREMIUM_TAX_CREDIT_KEYS,
  makeMarketplaceCoverageFactKey,
  type MarketplaceCoverageAmounts,
} from "../../../../src/facts/index.js";
import { resolve8962Info } from "../../../../src/federal/8962/resolveInfo.js";
import { resolveSchedule2Info } from "../../../../src/filingInfoResolvers.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

type Fact = { key: string; category: string; value: unknown };

const month = (advancePayment: number, enrollmentPremium = 650): MarketplaceCoverageAmounts => ({
  enrollmentPremium,
  slcspPremium: 700,
  advancePayment,
});

/* One Form 1095-A; months default to the same amounts all year. */
const form1095A = (months: MarketplaceCoverageAmounts[]): Fact => ({
  key: makeMarketplaceCoverageFactKey("ffm", "p-1"),
  category: "health_coverage",
  value: {
    marketplaceId: "FFM",
    policyNumber: "P-1",
    recipient: { name: "Pat Doe" },
    coveredIndividuals: [{ name: "Pat Doe" }],
    months,
    annualTotals: {
      enrollmentPremium: months.reduce((total, row) => total + (row.enrollmentPremium ?? 0), 0),
      slcspPremium: months.reduce((total, row) => total + (row.slcspPremium ?? 0), 0),
      advancePayment: months.reduce((total, row) => total + (row.advancePayment ?? 0), 0),
    },
  },
});

const sameAllYear = (advancePayment: number) =>
  form1095A(Array.from({ length: 12 }, () => month(advancePayment)));

const status = (value: string) => ({
  decisionKey: "decisions.scope.filing_status",
  decision: value,
});

const info = (facts: Fact[], filingStatus = "single") =>
  resolve8962Info(makeResolverInputs({ facts, decisions: [status(filingStatus)] }));

describe("resolve8962Info", () => {
  it("files when a Form 1095-A shows advance payments", () => {
    expect(info([sameAllYear(500)]).mustFile?.["form-8962"]?.value).toBe(true);
  });

  it("does not file a 1095-A with no advance payments, or no 1095-A", () => {
    expect(info([sameAllYear(0)]).mustFile?.["form-8962"]?.value).toBe(false);
    expect(info([]).mustFile?.["form-8962"]?.value).toBe(false);
  });

  it("adds line 33 and tests the same-every-month conditions", () => {
    const result = info([sameAllYear(500)]);
    expect(result.marketplaceAnnualTotals).toEqual({
      enrollmentPremium: 7800,
      slcspPremium: 8400,
      advancePayment: 6000,
    });
    expect(result.marketplaceSameEveryMonth).toBe(true);
  });

  it("is not the same every month when a premium changes or a month is missing", () => {
    const changed = Array.from({ length: 12 }, (_, index) => month(500, index < 6 ? 650 : 700));
    expect(info([form1095A(changed)]).marketplaceSameEveryMonth).toBe(false);
    const elevenMonths = [{}, ...Array.from({ length: 11 }, () => month(500))];
    expect(info([form1095A(elevenMonths)]).marketplaceSameEveryMonth).toBe(false);
  });

  it("asks the line A exception only when married filing separately", () => {
    const single = info([sameAllYear(500)]).missingInputs?.["form-8962"] ?? [];
    expect(single).toEqual([PREMIUM_TAX_CREDIT_KEYS.allocatesPolicyOrMarriageCalc]);
    const mfs = info([sameAllYear(500)], "married_filing_separately").missingInputs?.["form-8962"];
    expect(mfs).toContain(PREMIUM_TAX_CREDIT_KEYS.mfsException);
  });
});

describe("Schedule 2 with Form 8962", () => {
  it("files Schedule 2 when Form 8962 is its only feeder", () => {
    const inputs = makeResolverInputs({ facts: [sameAllYear(500)], decisions: [status("single")] });
    expect(resolveSchedule2Info(inputs).mustFile?.["schedule-2"]?.value).toBe(true);
  });
});
