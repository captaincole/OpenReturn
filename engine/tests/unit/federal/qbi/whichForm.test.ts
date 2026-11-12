/*
 * Form 8995 or Form 8995-A: the upper bound on taxable income before the QBI
 * deduction (MAGI's upper bound less the certain standard deduction) against
 * the threshold, by filing status and the deduction decision.
 */
import { describe, expect, it } from "vitest";
import { SPOUSE_KEYS, makeBusinessFactKey, makeW2FactKey } from "../../../../src/facts/index.js";
import { resolve8995AInfo } from "../../../../src/federal/8995-a/resolveInfo.js";
import { resolve8995Info } from "../../../../src/federal/8995/resolveInfo.js";
import { qbiFormByIncome } from "../../../../src/federal/qbi/whichForm.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

type Fact = { key: string; category: string; value: unknown };

/* A non-service business with line G "Yes"; its receipts are its net receipts. */
const business = (grossReceipts: number, value: Record<string, unknown> = {}): Fact => ({
  key: makeBusinessFactKey("consulting"),
  category: "self_employment",
  value: {
    activity: "consulting",
    grossReceipts,
    sellsGoods: false,
    materiallyParticipated: true,
    specifiedService: false,
    ...value,
  },
});

const w2 = (box1: number): Fact => ({
  key: makeW2FactKey("employer"),
  category: "wages",
  value: { employerName: "Employer", employerEin: "00-0000001", box1, box2: 0, box3: box1 },
});

const dob = (value: string): Fact => ({ key: "identity.dob", category: "identity", value });
const spouseItemizes = (value: boolean): Fact => ({
  key: SPOUSE_KEYS.itemizesSeparately,
  category: "filing_status",
  value,
});

const inputs = (facts: Fact[], status?: string, deduction?: "standard" | "itemized") =>
  makeResolverInputs({
    facts,
    decisions: [
      ...(status ? [{ decisionKey: "decisions.scope.filing_status", decision: status }] : []),
      ...(deduction ? [{ decisionKey: "decisions.itemize_vs_standard", decision: deduction }] : []),
    ],
  });

const reviewerCase = [w2(185000), business(15000)];

describe("qbiFormByIncome", () => {
  it.each([
    // 200,000 - 15,750 = 184,250, at or below 197,300.
    [
      "the reviewer's case: wages, a business, standard",
      reviewerCase,
      "single",
      "standard",
      "form-8995",
    ],
    [
      "the reviewer's case with no deduction decision",
      reviewerCase,
      "single",
      undefined,
      "form-8995-a",
    ],
    // An itemized total is not known before evaluation, so nothing is subtracted.
    ["the reviewer's case, itemizing", reviewerCase, "single", "itemized", "form-8995-a"],
    // 213,050 - 15,750 = 197,300: equal to the threshold.
    ["at the threshold", [w2(198050), business(15000)], "single", "standard", "form-8995"],
    [
      "one dollar above the threshold",
      [w2(198051), business(15000)],
      "single",
      "standard",
      "form-8995-a",
    ],
    // 65 or older: 15,750 + 2,000.
    [
      "age 65, at the threshold",
      [w2(200050), business(15000), dob("1950-03-01")],
      "single",
      "standard",
      "form-8995",
    ],
    [
      "birth date unknown: no age increase",
      [w2(200050), business(15000)],
      "single",
      "standard",
      "form-8995-a",
    ],
    // 410,000 - 31,500 = 378,500 against 394,600.
    [
      "joint, standard",
      [w2(380000), business(30000)],
      "married_filing_jointly",
      "standard",
      "form-8995",
    ],
    [
      "joint, no deduction decision",
      [w2(380000), business(30000)],
      "married_filing_jointly",
      undefined,
      "form-8995-a",
    ],
    [
      "MFS, spouse itemizes: zero",
      [...reviewerCase, spouseItemizes(true)],
      "married_filing_separately",
      "standard",
      "form-8995-a",
    ],
    [
      "MFS, spouse does not itemize",
      [...reviewerCase, spouseItemizes(false)],
      "married_filing_separately",
      "standard",
      "form-8995",
    ],
    [
      "MFS, spouse answer unknown: zero",
      reviewerCase,
      "married_filing_separately",
      "standard",
      "form-8995-a",
    ],
    // No wages: the dependents' worksheet floor of 1,350; 199,000 - 1,350 = 197,650.
    ["no wages: the dependent cap", [business(199000)], "single", "standard", "form-8995-a"],
    [
      "filing status unknown: nothing subtracted",
      reviewerCase,
      undefined,
      "standard",
      "form-8995-a",
    ],
  ] as const)("%s", (_, facts, status, deduction, expected) => {
    expect(qbiFormByIncome(inputs([...facts], status, deduction))).toBe(expected);
  });
});

describe("the QBI forms by the bound", () => {
  const reviewer = inputs(reviewerCase, "single", "standard");

  it("files Form 8995, not 8995-A, in the reviewer's case", () => {
    expect(resolve8995Info(reviewer).mustFile?.["form-8995"]?.value).toBe(true);
    expect(resolve8995AInfo(reviewer).mustFile?.["form-8995-a"]?.value).toBe(false);
  });

  it("asks no W-2 wage or property answer at or below the threshold", () => {
    expect(resolve8995AInfo(reviewer).missingInputs?.["form-8995-a"]).toEqual([]);
  });

  it("asks the W-2 wage and property answers when the bound is above it", () => {
    const itemizing = inputs(reviewerCase, "single", "itemized");
    expect(resolve8995AInfo(itemizing).missingInputs?.["form-8995-a"]).toEqual([
      makeBusinessFactKey("consulting"),
    ]);
  });
});
