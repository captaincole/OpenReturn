/*
 * Form 8814's resolver: the election's conditions for each child
 * (irs-8814-inst-2025::sec::general-instructions::b01, ::b02), the answers it
 * waits for, and the totals other forms read.
 */

import { describe, expect, it } from "vitest";
import {
  makeChildInvestmentIncomeFactKey,
  makeDependentFactKey,
  type ChildInvestmentIncomeFactValue,
  type DependentFactValue,
} from "../../../../src/facts/index.js";
import { FORM_8814_GAPS } from "../../../../src/federal/8814/children.js";
import { resolve8814Info } from "../../../../src/federal/8814/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

type Fact = { key: string; category: string; value: unknown };

const ELECTION = { decisionKey: "decisions.scope.must_file_8814", decision: true };

const dependent = (slug: string, value: Partial<DependentFactValue>): Fact => ({
  key: makeDependentFactKey(slug),
  category: "dependents",
  value: { firstName: "Fred", lastName: "Doe", relationship: "Son", ssn: "900111234", ...value },
});

const income = (slug: string, value: ChildInvestmentIncomeFactValue): Fact => ({
  key: makeChildInvestmentIncomeFactKey(slug),
  category: "dependents",
  value: { estimatedTaxPaid: false, hadOtherIncome: false, ...value },
});

// Fred (irs-8814-inst-2025::sec::line-3::b04): $2,190 of qualified dividends and $610 of capital gain distributions.
const FRED_INCOME: ChildInvestmentIncomeFactValue = {
  ordinaryDividends: 2190,
  qualifiedDividends: 2190,
  capitalGainDistributions: 610,
};

const resolve = (facts: Fact[], elected = true) =>
  resolve8814Info(makeResolverInputs({ facts, decisions: elected ? [ELECTION] : [] }));

const fred = (
  dob: string,
  student?: boolean,
  value: ChildInvestmentIncomeFactValue = FRED_INCOME,
) => resolve([dependent("fred", { dob, fullTimeStudent: student }), income("fred", value)]);

describe("resolve8814Info", () => {
  it("files only by the parents' decision", () => {
    const info = resolve(
      [dependent("fred", { dob: "06/15/2019" }), income("fred", FRED_INCOME)],
      false,
    );
    /* A child has income and the parents have not chosen: the return waits for the decision. */
    expect(info.mustFile?.["form-8814"]?.value).toBeUndefined();
    expect(info.form8814Children).toBeUndefined();
    expect(info.form8814Totals).toBeUndefined();
    const declined = resolve8814Info(
      makeResolverInputs({
        facts: [dependent("fred", { dob: "06/15/2019" }), income("fred", FRED_INCOME)],
        decisions: [{ ...ELECTION, decision: false }],
      }),
    );
    expect(declined.mustFile?.["form-8814"]?.value).toBe(false);
    expect(resolve([], false).mustFile?.["form-8814"]?.value).toBe(false);
  });

  it("figures Fred's form and the totals other forms read", () => {
    const info = fred("06/15/2019");
    expect(info.mustFile?.["form-8814"]?.value).toBe(true);
    expect(info.missingInputs?.["form-8814"]).toEqual([]);
    expect(info.form8814Children?.[0]?.name).toBe("Fred Doe");
    expect(info.form8814Totals).toMatchObject({
      kind: "figured",
      line9: 78,
      line10: 22,
      line12: 0,
      line15: 135,
    });
  });

  describe("age at the end of 2025 (::b01, the January 1 rule in ::b02)", () => {
    it("a child born January 1, 2007 is 19: only a full-time student qualifies", () => {
      expect(fred("01/01/2007", false).form8814Children?.[0]?.gap).toBe(
        FORM_8814_GAPS.age19NotStudent,
      );
      expect(fred("01/01/2007", true).form8814Totals?.kind).toBe("figured");
    });

    it("a child born January 2, 2007 is 18 and qualifies without being a student", () => {
      expect(fred("01/02/2007", false).form8814Totals?.kind).toBe("figured");
    });

    it("a child born January 1, 2002 is 24: no election, student or not", () => {
      expect(fred("01/01/2002", true).form8814Children?.[0]?.gap).toBe(FORM_8814_GAPS.age24);
      expect(fred("01/02/2002", true).form8814Totals?.kind).toBe("figured");
    });

    it("waits for the student answer of a child 19 to 23, and for a date of birth", () => {
      const student = fred("05/05/2004");
      expect(student.form8814Totals).toEqual({ kind: "waits" });
      expect(student.missingInputs?.["form-8814"]).toEqual([makeDependentFactKey("fred")]);
      const noDob = resolve([dependent("fred", {}), income("fred", FRED_INCOME)]);
      expect(noDob.missingInputs?.["form-8814"]).toEqual([makeDependentFactKey("fred")]);
      const noDependent = resolve([income("fred", FRED_INCOME)]);
      expect(noDependent.missingInputs?.["form-8814"]).toEqual([makeDependentFactKey("fred")]);
    });
  });

  describe("the child's income (::b01)", () => {
    it("waits for the answers no document gives", () => {
      const info = resolve([
        dependent("fred", { dob: "06/15/2019" }),
        { ...income("fred", FRED_INCOME), value: FRED_INCOME },
      ]);
      expect(info.form8814Totals).toEqual({ kind: "waits" });
      expect(info.missingInputs?.["form-8814"]).toEqual([makeChildInvestmentIncomeFactKey("fred")]);
    });

    it("other income, estimated tax or withholding stops the election", () => {
      const gapOf = (value: ChildInvestmentIncomeFactValue) =>
        fred("06/15/2019", undefined, { ...FRED_INCOME, ...value }).form8814Children?.[0]?.gap;
      expect(gapOf({ hadOtherIncome: true })).toBe(FORM_8814_GAPS.otherIncome);
      expect(gapOf({ estimatedTaxPaid: true })).toBe(FORM_8814_GAPS.estimatedTax);
      expect(gapOf({ federalTaxWithheld: 12 })).toBe(FORM_8814_GAPS.withholding);
    });

    it("line 4 must be under $13,500 (the blank form's line 4)", () => {
      expect(
        fred("06/15/2019", undefined, { taxableInterest: 13499 }).form8814Totals,
      ).toMatchObject({ kind: "figured", line12: 10799 });
      expect(fred("06/15/2019", undefined, { taxableInterest: 13500 }).form8814Totals).toEqual({
        kind: "unsupported",
        reason:
          "The child's interest and dividends (line 4) are $13,500 or more, so the child must file a return and Form 8814 is not filed.",
      });
    });

    it("a child with $1,350 or less is not required to file, so there is no election", () => {
      const at = fred("06/15/2019", undefined, { taxableInterest: 1350 });
      expect(at.form8814Totals?.kind).toBe("unsupported");
      expect(fred("06/15/2019", undefined, { taxableInterest: 1351 }).form8814Totals).toMatchObject(
        {
          kind: "figured",
          line15: 0,
        },
      );
    });

    it("a 28%, section 1250 or section 1202 part of the distributions is a gap (::line-3::b02, ::b03)", () => {
      const info = fred("06/15/2019", undefined, { ...FRED_INCOME, collectiblesGain: 100 });
      expect(info.form8814Totals).toEqual({
        kind: "unsupported",
        reason: FORM_8814_GAPS.capitalGainParts,
      });
    });
  });

  it("two children: one form each, and the totals add (::line-12::b01, ::line-15::b01)", () => {
    const info = resolve([
      dependent("fred", { dob: "06/15/2019" }),
      income("fred", FRED_INCOME),
      dependent("ann", { dob: "03/03/2015", firstName: "Ann" }),
      income("ann", {
        taxableInterest: 2800,
        privateActivityBondInterest: 40,
        taxExemptInterest: 90,
      }),
    ]);
    expect(info.form8814Children?.map((child) => child.name)).toEqual(["Fred Doe", "Ann Doe"]);
    expect(info.form8814Totals).toEqual({
      kind: "figured",
      line9ByChild: [78, 0],
      line9: 78,
      line10: 22,
      line12: 100,
      line15: 270,
      line1b: 90,
      privateActivityBondInterest: 40,
      line12LessAlaskaDividends: 100,
      eicWorksheet1Line4: 100,
    });
  });
});
