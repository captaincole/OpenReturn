/*
 * FTB 3803's resolver: who files, the election's conditions for each child
 * (ca-3803-inst-2025::sec::a-purpose::b01), the answers it waits for, the
 * totals Form 540 reads, and Schedule CA (540) line 8z.
 */

import { describe, expect, it } from "vitest";
import {
  makeChildInvestmentIncomeFactKey,
  makeDependentFactKey,
  type ChildInvestmentIncomeFactValue,
  type DependentFactValue,
} from "../../../../../src/facts/index.js";
import { makeResolverInputs } from "../../../../../src/resolverInputs.js";
import { FORM_3803_GAPS } from "../../../../../src/state/ca/3803/children.js";
import { resolve3803Info } from "../../../../../src/state/ca/3803/resolveInfo.js";

type Fact = { key: string; category: string; value: unknown };
type Decision = { decisionKey: string; decision: unknown };

const CA_ELECTION: Decision = { decisionKey: "decisions.scope.must_file_3803", decision: true };
const FEDERAL_ELECTION: Decision = {
  decisionKey: "decisions.scope.must_file_8814",
  decision: true,
};
const FILES_540: Decision = { decisionKey: "decisions.scope.must_file_ca_540", decision: true };

const dependent = (slug: string, value: Partial<DependentFactValue>): Fact => ({
  key: makeDependentFactKey(slug),
  category: "dependents",
  value: {
    firstName: "Ana",
    lastName: "Doe",
    relationship: "Daughter",
    ssn: "400000901",
    ...value,
  },
});

const ANSWERS = {
  estimatedTaxPaid: false,
  californiaEstimatedTaxPaid: false,
  hadOtherIncome: false,
};

const income = (slug: string, value: ChildInvestmentIncomeFactValue): Fact => ({
  key: makeChildInvestmentIncomeFactKey(slug),
  category: "dependents",
  value: { ...ANSWERS, ...value },
});

const ANA: ChildInvestmentIncomeFactValue = {
  taxableInterest: 3400,
  usObligationInterest: 1600,
  ordinaryDividends: 1900,
  qualifiedDividends: 1500,
};

const resolve = (facts: Fact[], decisions: Decision[] = [CA_ELECTION, FILES_540]) =>
  resolve3803Info(makeResolverInputs({ facts, decisions }));

const ana = (dob: string, student?: boolean, value: ChildInvestmentIncomeFactValue = ANA) =>
  resolve([dependent("ana", { dob, fullTimeStudent: student }), income("ana", value)]);

describe("who files FTB 3803", () => {
  it("files only by the parents' decision", () => {
    const facts = [dependent("ana", { dob: "06/15/2012" }), income("ana", ANA)];
    expect(resolve(facts).mustFile?.["form-3803"]?.value).toBe(true);
    const declined = resolve(facts, [{ ...CA_ELECTION, decision: false }, FILES_540]);
    expect(declined.mustFile?.["form-3803"]?.value).toBe(false);
    expect(declined.form3803Totals).toBeUndefined();
  });

  it("waits for the decision on a California return when a child has income", () => {
    const facts = [dependent("ana", { dob: "06/15/2012" }), income("ana", ANA)];
    const info = resolve(facts, [FILES_540]);
    expect(info.mustFile?.["form-3803"]?.value).toBeUndefined();
    expect(info.childIncomeLine8z).toBeUndefined();
  });

  it("does not file with no child's income, or with no California return", () => {
    expect(resolve([], [FILES_540]).mustFile?.["form-3803"]?.value).toBe(false);
    const facts = [dependent("ana", { dob: "06/15/2012" }), income("ana", ANA)];
    expect(resolve(facts, []).mustFile?.["form-3803"]?.value).toBe(false);
  });
});

describe("the election's conditions (::a-purpose::b01)", () => {
  it("figures a qualifying child's form and the totals", () => {
    const info = ana("06/15/2012");
    expect(info.missingInputs?.["form-3803"]).toEqual([]);
    expect(info.form3803Children?.[0]?.name).toBe("Ana Doe");
    expect(info.form3803Totals).toEqual({ kind: "figured", line6: 1000, line9: 14 });
  });

  it("a child born January 1, 2007 is 19: only a full-time student qualifies", () => {
    expect(ana("01/01/2007", false).form3803Children?.[0]?.gap).toBe(
      FORM_3803_GAPS.age19NotStudent,
    );
    expect(ana("01/01/2007", true).form3803Totals?.kind).toBe("figured");
    expect(ana("01/02/2007", false).form3803Totals?.kind).toBe("figured");
  });

  it("a child born January 1, 2002 is 24: no election, student or not", () => {
    expect(ana("01/01/2002", true).form3803Children?.[0]?.gap).toBe(FORM_3803_GAPS.age24);
    expect(ana("01/02/2002", true).form3803Totals?.kind).toBe("figured");
  });

  it("waits for the student answer of a child 19 to 23, and for a date of birth", () => {
    expect(ana("05/05/2004").missingInputs?.["form-3803"]).toEqual([makeDependentFactKey("ana")]);
    expect(ana("05/05/2004").form3803Totals).toEqual({ kind: "waits" });
    const noDependent = resolve([income("ana", ANA)]);
    expect(noDependent.missingInputs?.["form-3803"]).toEqual([makeDependentFactKey("ana")]);
  });

  it("waits for the California estimated tax and other income answers", () => {
    const unanswered = { ...income("ana", ANA), value: ANA };
    const info = resolve([dependent("ana", { dob: "06/15/2012" }), unanswered]);
    expect(info.form3803Totals).toEqual({ kind: "waits" });
    expect(info.missingInputs?.["form-3803"]).toEqual([makeChildInvestmentIncomeFactKey("ana")]);
  });

  it("other income, California estimated tax and California withholding each end the election", () => {
    const gapOf = (value: ChildInvestmentIncomeFactValue) =>
      ana("06/15/2012", undefined, { ...ANA, ...value }).form3803Children?.[0]?.gap;
    expect(gapOf({ hadOtherIncome: true })).toBe(FORM_3803_GAPS.otherIncome);
    expect(gapOf({ californiaEstimatedTaxPaid: true })).toBe(FORM_3803_GAPS.estimatedTax);
    expect(gapOf({ stateTaxWithheld: 12 })).toBe(FORM_3803_GAPS.withholding);
    /* Federal estimated tax and federal withholding are Form 8814's conditions, not FTB 3803's. */
    expect(gapOf({ estimatedTaxPaid: true, federalTaxWithheld: 50 })).toBeUndefined();
  });

  it("line 4 must be more than $1,350 and less than $13,500", () => {
    const at = (taxableInterest: number) =>
      ana("06/15/2012", undefined, { taxableInterest }).form3803Totals;
    expect(at(1350)?.kind).toBe("unsupported");
    expect(at(1351)).toEqual({ kind: "figured", line6: 0, line9: 0 });
    expect(at(13_499)).toEqual({ kind: "figured", line6: 10_799, line9: 14 });
    expect(at(13_500)?.kind).toBe("unsupported");
  });

  it("measures line 4 with California amounts: Treasury interest does not count", () => {
    const info = ana("06/15/2012", undefined, { taxableInterest: 1500, usObligationInterest: 200 });
    expect(info.form3803Totals?.kind).toBe("unsupported");
  });
});

describe("two children: one form each, totals added", () => {
  it("adds lines 6 and 9 across the forms", () => {
    const info = resolve([
      dependent("ana", { dob: "06/15/2012" }),
      income("ana", ANA),
      dependent("ben", { dob: "03/03/2016", firstName: "Ben" }),
      income("ben", { taxableInterest: 2000, usObligationInterest: 250 }),
    ]);
    expect(info.form3803Children).toHaveLength(2);
    expect(info.form3803Totals).toEqual({ kind: "figured", line6: 1000, line9: 18 });
  });

  it("one child's gap makes the totals unsupported", () => {
    const info = resolve([
      dependent("ana", { dob: "06/15/2012" }),
      income("ana", ANA),
      dependent("ben", { dob: "03/03/2016" }),
      income("ben", { taxableInterest: 900 }),
    ]);
    expect(info.form3803Totals?.kind).toBe("unsupported");
  });
});

describe("Schedule CA (540) line 8z (ca-3803-inst-2025::sec::line-6::b01)", () => {
  const facts = [dependent("ana", { dob: "06/15/2012" }), income("ana", ANA)];

  it("subtracts in column B when FTB 3803 line 6 is under Form 8814 line 6", () => {
    const info = resolve(facts, [CA_ELECTION, FEDERAL_ELECTION, FILES_540]);
    /* Form 8814 line 6: 3,400 + 1,900 − 2,700 = 2,600; FTB 3803 line 6: 1,000. */
    expect(info.childIncomeLine8z).toEqual({
      kind: "figured",
      subtraction: 1600,
      childCapitalGainDistributions: false,
      federalLine12: 1864,
    });
  });

  it("adds all of line 6 in column C with no federal election", () => {
    expect(resolve(facts).childIncomeLine8z).toEqual({
      kind: "figured",
      addition: 1000,
      childCapitalGainDistributions: false,
      federalLine12: 0,
    });
  });

  it("subtracts all of Form 8814 line 6 when the parents elect on the federal return only (ca-3800-inst-2025::sec::purpose::b02)", () => {
    const info = resolve(facts, [{ ...CA_ELECTION, decision: false }, FEDERAL_ELECTION, FILES_540]);
    expect(info.childIncomeLine8z).toEqual({
      kind: "figured",
      subtraction: 2600,
      childCapitalGainDistributions: false,
      federalLine12: 1864,
    });
  });

  it("flags a child's capital gain distributions that reach line 6", () => {
    const withGain = [
      dependent("ana", { dob: "06/15/2012" }),
      income("ana", { ...ANA, capitalGainDistributions: 400 }),
    ];
    const line8z = resolve(withGain).childIncomeLine8z;
    expect(line8z).toEqual({
      kind: "figured",
      addition: 1400,
      childCapitalGainDistributions: true,
      federalLine12: 0,
    });
  });

  it("is undefined when no return reports a child's income", () => {
    expect(resolve([]).childIncomeLine8z).toBeUndefined();
    expect(
      resolve(facts, [{ ...CA_ELECTION, decision: false }, FILES_540]).childIncomeLine8z,
    ).toBeUndefined();
  });

  it("waits while either form waits", () => {
    const unanswered = [
      dependent("ana", { dob: "06/15/2012" }),
      { ...income("ana", ANA), value: ANA },
    ];
    expect(resolve(unanswered).childIncomeLine8z).toEqual({ kind: "waits" });
  });
});
