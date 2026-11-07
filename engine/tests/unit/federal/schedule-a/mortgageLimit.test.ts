/* Source: irs-1040sa-inst-2025::sec::line-8::b03 (the $750,000 and $1,000,000 limits) and ::sec::line-8a::b01. */

import { describe, expect, it } from "vitest";
import { MORTGAGE_KEYS } from "../../../../src/facts/index.js";
import {
  mortgageInterestWithinLimit,
  resolveScheduleAInfo,
} from "../../../../src/federal/schedule-a/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

type Fact = { key: string; category: string; value: unknown };
type Decision = { decisionKey: string; decision: unknown };

const fact = (key: string, value: unknown): Fact => ({ key, category: "mortgage", value });
const inputs = (facts: Fact[], decisions: Decision[] = []) =>
  makeResolverInputs({ facts, decisions });

describe("mortgageInterestWithinLimit", () => {
  it("passes the interest through under the $750,000 limit", () => {
    const result = mortgageInterestWithinLimit(inputs([]), 8059, 245552);
    expect(result).toEqual({ interest: 8059, limited: false, originationDateNeeded: false });
  });

  it("waits over the limit for a loan taken out after December 15, 2017", () => {
    const result = mortgageInterestWithinLimit(
      inputs([fact(MORTGAGE_KEYS.originationDateForm1098, "10/10/2021")]),
      60000,
      1200000,
    );
    expect(result).toEqual({ interest: undefined, limited: true, originationDateNeeded: false });
  });

  it("allows $1,000,000 for a loan taken out on or before December 15, 2017", () => {
    const result = mortgageInterestWithinLimit(
      inputs([fact(MORTGAGE_KEYS.originationDateForm1098, "12/15/2017")]),
      30000,
      850000,
    );
    expect(result.interest).toBe(30000);
    expect(result.limited).toBe(false);
  });

  it("halves both limits for married filing separately", () => {
    const separate = [
      { decisionKey: "decisions.scope.filing_status", decision: "married_filing_separately" },
    ];
    const result = mortgageInterestWithinLimit(
      inputs([fact(MORTGAGE_KEYS.originationDateForm1098, "10/10/2021")], separate),
      20000,
      400000,
    );
    expect(result.limited).toBe(true);
  });

  it("asks for the origination date between the two limits", () => {
    const info = resolveScheduleAInfo(
      inputs(
        [
          fact(MORTGAGE_KEYS.interestForm1098, 30000),
          fact(MORTGAGE_KEYS.outstandingPrincipalForm1098, 850000),
        ],
        [{ decisionKey: "decisions.itemize_vs_standard", decision: "itemized" }],
      ),
    );
    expect(info.mortgageInterestForm1098).toBeUndefined();
    expect(info.mortgageInterestLimited).toBe(false);
    expect(info.missingInputs?.["schedule-a"]).toContain(MORTGAGE_KEYS.originationDateForm1098);
  });
});
