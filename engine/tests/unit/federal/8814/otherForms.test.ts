/*
 * The lines of other forms that take Form 8814 amounts and decide in a
 * resolver or a worksheet: Schedule B's rows and its $1,500 test
 * (irs-8814-inst-2025::sec::line-9::b01), and Pub. 596 Worksheet 1 lines 2 and 4.
 */

import { describe, expect, it } from "vitest";
import {
  makeChildInvestmentIncomeFactKey,
  makeDependentFactKey,
  makeDividendFactKey,
} from "../../../../src/facts/index.js";
import type { Form8814Figured } from "../../../../src/federal/8814/filingInfo.js";
import { worksheet1 } from "../../../../src/federal/schedule-eic/worksheet1.js";
import { resolveScheduleBInfo } from "../../../../src/filingInfoResolvers.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const parentDividends = (box1a: number) => ({
  key: makeDividendFactKey("broker"),
  category: "investment_income",
  value: { payerName: "Broker", box1a, box1b: box1a },
});

const FRED = [
  {
    key: makeDependentFactKey("fred"),
    category: "dependents",
    value: { firstName: "Fred", lastName: "Doe", relationship: "Son", dob: "06/15/2019" },
  },
  {
    key: makeChildInvestmentIncomeFactKey("fred"),
    category: "dependents",
    value: {
      ordinaryDividends: 2190,
      qualifiedDividends: 2190,
      capitalGainDistributions: 610,
      estimatedTaxPaid: false,
      hadOtherIncome: false,
    },
  },
];

const ELECTION = [{ decisionKey: "decisions.scope.must_file_8814", decision: true }];

describe("Schedule B with Form 8814", () => {
  it("lists line 9 as a Form 8814 row and files when it and the parents' dividends pass $1,500", () => {
    const info = resolveScheduleBInfo(
      makeResolverInputs({ facts: [parentDividends(1450), ...FRED], decisions: ELECTION }),
    );
    expect(info.dividendPayers).toEqual([
      { payerName: "Broker", amount: 1450 },
      { payerName: "Form 8814", amount: 78 },
    ]);
    expect(info.mustFile?.["schedule-b"]?.value).toBe(true);
  });

  it("does not file on the parents' $1,450 alone", () => {
    const info = resolveScheduleBInfo(
      makeResolverInputs({ facts: [parentDividends(1450), ...FRED], decisions: [] }),
    );
    expect(info.mustFile?.["schedule-b"]?.value).toBe(false);
  });
});

describe("Pub. 596 Worksheet 1 with Form 8814", () => {
  const totals: Form8814Figured = {
    kind: "figured",
    line9ByChild: [0],
    line9: 0,
    line10: 0,
    line12: 3300,
    line15: 135,
    line1b: 90,
    privateActivityBondInterest: 0,
    line12LessAlaskaDividends: 2200,
    eicWorksheet1Line4: 2201,
  };

  it("adds line 1b on line 2 and Worksheet 2's line 10 on line 4, without a Schedule E", () => {
    expect(worksheet1({}, { form8814Totals: totals }, 500)).toEqual({
      kind: "line14",
      amount: 500 + 90 + 2201,
    });
  });

  it("waits with Form 8814", () => {
    expect(worksheet1({}, { form8814Totals: { kind: "waits" } }, 500)).toEqual({
      kind: "waiting",
    });
  });
});
