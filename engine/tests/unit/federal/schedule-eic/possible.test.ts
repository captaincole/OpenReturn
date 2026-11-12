/*
 * Source: irs-1040-inst-2025, lines 27a–27c: Step 1 question 1 (all-filers::b01),
 * Step 2 (investment income) and Worksheet B (bworksheet-2025-eic-line-27a::b01–b03).
 */

import { describe, expect, it } from "vitest";
import {
  HSA_COVERAGE_KEYS,
  makeBusinessFactKey,
  makeDependentFactKey,
  makeDividendFactKey,
  makeInterestFactKey,
  makeTradeFactKey,
  makeW2FactKey,
  type BusinessFactValue,
} from "../../../../src/facts/index.js";
import { resolve1040Info } from "../../../../src/federal/1040/resolveInfo.js";
import { eicMayApply } from "../../../../src/federal/schedule-eic/possible.js";
import { resolveScheduleEICInfo } from "../../../../src/federal/schedule-eic/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import { tcbUs002Scenario } from "../../../scenarios/tcb-us-002/index.js";

type Fact = { key: string; category: string; value: unknown };

const son = {
  firstName: "Kid",
  lastName: "Doe",
  ssn: "900-12-3456",
  relationship: "Son",
  dob: "02/28/2017",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
};

const w2 = (box1: number): Fact => ({
  key: makeW2FactKey("acme"),
  category: "wages",
  value: { box1 },
});
const interest = (box1: number): Fact => ({
  key: makeInterestFactKey("bank"),
  category: "investment_income",
  value: { box1 },
});
const dividends = (box1a: number): Fact => ({
  key: makeDividendFactKey("broker"),
  category: "investment_income",
  value: { box1a },
});
const business = (value: Partial<BusinessFactValue>): Fact => ({
  key: makeBusinessFactKey("side"),
  category: "self_employment",
  value: {
    activity: "Consulting",
    grossReceipts: 9_000,
    sellsGoods: false,
    materiallyParticipated: true,
    ...value,
  },
});
const sale: Fact = {
  key: makeTradeFactKey("broker", "xyz"),
  category: "investment_income",
  value: {
    tradeId: "xyz",
    description: "10 sh XYZ",
    dateAcquired: "01/02/2024",
    dateSold: "06/02/2025",
    proceeds: 1_000,
    costBasis: 10_000,
  },
};

const inputs = (facts: Fact[], status = "head_of_household") =>
  makeResolverInputs({
    facts: [
      { key: "identity.dob", category: "identity", value: "05/01/1985" },
      { key: makeDependentFactKey("son"), category: "dependents", value: son },
      ...facts,
    ],
    decisions: [{ decisionKey: "decisions.scope.filing_status", decision: status }],
  });

const eicAsked = (facts: Fact[], status?: string) => {
  const resolved = inputs(facts, status);
  const keys = [
    ...(resolveScheduleEICInfo(resolved).missingInputs?.["schedule-eic"] ?? []),
    ...(resolve1040Info(resolved).missingInputs?.["form-1040"] ?? []),
  ];
  return keys.filter((key) => key.startsWith("eic."));
};

describe("eicMayApply", () => {
  it("rules out AGI at the Step 1 limit: HOH, one son, $45,000 wages and $8,000 of interest and dividends", () => {
    const facts = [w2(45_000), interest(5_000), dividends(3_000)];
    expect(eicMayApply(inputs(facts), 1)).toBe(false);
    expect(eicMayApply(inputs([w2(45_000)]), 1)).toBe(true);
    expect(resolveScheduleEICInfo(inputs([w2(45_000)])).mustFile?.["schedule-eic"]?.value).toBe(
      true,
    );
    expect(resolveScheduleEICInfo(inputs(facts)).mustFile?.["schedule-eic"]?.value).toBe(false);
    expect(eicAsked(facts)).toEqual([]);
  });

  it("keeps the EIC possible while a capital loss or the HSA deduction could bring AGI under it", () => {
    const facts = [w2(45_000), interest(5_000), dividends(3_000)];
    expect(eicMayApply(inputs([...facts, sale]), 1)).toBe(true);
    const hsa: Fact = { key: HSA_COVERAGE_KEYS.coverageType, category: "hsa", value: "family" };
    expect(eicMayApply(inputs([...facts, hsa]), 1)).toBe(true);
    // The deduction is at most the own contributions: $3,000 can bring AGI under $50,434; $2,000 cannot.
    const contributed = (value: number): Fact => ({
      key: HSA_COVERAGE_KEYS.ownContributions,
      category: "hsa",
      value,
    });
    expect(eicMayApply(inputs([...facts, hsa, contributed(3_000)]), 1)).toBe(true);
    expect(eicMayApply(inputs([...facts, hsa, contributed(2_000)]), 1)).toBe(false);
  });

  it("rules out investment income over $11,950 (Step 2)", () => {
    expect(eicMayApply(inputs([w2(10_000), interest(11_951)]), 1)).toBe(false);
    expect(eicMayApply(inputs([w2(10_000), interest(11_950)]), 1)).toBe(true);
  });

  it("rules out a filer with no wages and no business", () => {
    expect(eicMayApply(inputs([interest(100)]), 1)).toBe(false);
  });

  it("keeps a W-2 with box 1 of 0 and combat pay (code Q) possible: line 27a reports its gap", () => {
    const combat: Fact = {
      key: makeW2FactKey("army"),
      category: "wages",
      value: { box1: 0, box12: [{ code: "Q", amount: 20_000 }] },
    };
    expect(eicMayApply(inputs([combat]), 1)).toBe(true);
  });

  describe("adds the lines as the form rounds them", () => {
    it("Step 2: box 1 and box 8 of $5,975.40 are lines 2a and 2b of $5,975, not over $11,950", () => {
      const both: Fact = {
        key: makeInterestFactKey("bank"),
        category: "investment_income",
        value: { box1: 5_975.4, box8: 5_975.4 },
      };
      expect(eicMayApply(inputs([w2(10_000), both]), 1)).toBe(true);
    });

    it("Step 1: W-2 box 1 $50,000.40 and interest $433.40 are lines 1a and 2b of $50,433, under $50,434", () => {
      expect(eicMayApply(inputs([w2(50_000.4), interest(433.4)]), 1)).toBe(true);
      expect(eicMayApply(inputs([w2(50_000.5), interest(433.4)]), 1)).toBe(false);
    });

    it("takes the smaller of the rounded total and the rounded rows (Schedule B's row style)", () => {
      // Two payers of $5,975.30: rows 5,975 + 5,975; the total 11,950.60 rounds to 11,951.
      const payer = (slug: string): Fact => ({
        key: makeInterestFactKey(slug),
        category: "investment_income",
        value: { box1: 5_975.3 },
      });
      expect(eicMayApply(inputs([w2(10_000), payer("one"), payer("two")]), 1)).toBe(true);
    });
  });

  describe("$400,000 of wages and a $9,000 business: no EIC question", () => {
    it.each([
      ["a known profit", {}],
      ["line 31 open (line G unanswered)", { materiallyParticipated: undefined }],
      ["a passive business (line G No)", { materiallyParticipated: false }],
      [
        "a home office whose area is unknown",
        { homeOffice: { homeSquareFeet: 2_000, businessSquareFeet: 200 } },
      ],
    ])("%s", (_, value) => {
      expect(eicAsked([w2(400_000), business(value)])).toEqual([]);
    });

    it("asks while line 29 is unknown: cost of goods sold can make any loss", () => {
      expect(eicAsked([w2(400_000), business({ sellsGoods: undefined })])).not.toEqual([]);
    });
  });

  it("still files Schedule EIC for tcb-us-002", () => {
    const resolved = makeResolverInputs({
      facts: tcbUs002Scenario.facts,
      decisions: tcbUs002Scenario.decisions,
    });
    expect(resolveScheduleEICInfo(resolved).mustFile?.["schedule-eic"]?.value).toBe(true);
  });
});
