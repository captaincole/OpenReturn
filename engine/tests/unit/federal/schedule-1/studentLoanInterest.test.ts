import { describe, expect, it } from "vitest";
import {
  isStudentLoanInterestFactKey,
  makeStudentLoanInterestFactKey,
  STUDENT_LOAN_KEYS,
} from "../../../../src/facts/index.js";
import {
  resolveStudentLoanInterest,
  studentLoanInterestDeduction,
} from "../../../../src/federal/schedule-1/studentLoanInterest.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const worksheet = (interestPaid: number, modifiedAgi: number, jointReturn = true) =>
  studentLoanInterestDeduction({
    interestPaid,
    totalIncome: modifiedAgi,
    otherAdjustments: 0,
    jointReturn,
  });

/* The Student Loan Interest Deduction Worksheet (irs-1040-inst-2025::sec::line-24e::b01, ::b02). */
describe("studentLoanInterestDeduction", () => {
  it("allows the interest paid below the phase-out", () => {
    expect(worksheet(1800, 5503)).toBe(1800);
  });

  it("allows at most $2,500 of interest (line 1)", () => {
    expect(worksheet(3200, 50000)).toBe(2500);
  });

  it("subtracts the other adjustments from total income (lines 2–4)", () => {
    const deduction = studentLoanInterestDeduction({
      interestPaid: 2000,
      totalIncome: 95000,
      otherAdjustments: 10000,
      jointReturn: false,
    });
    expect(deduction).toBe(2000);
  });

  it("reduces the interest over $170,000 joint, over $30,000 (lines 5–9)", () => {
    expect(worksheet(2000, 185000)).toBeCloseTo(1000);
  });

  it("reduces the interest over $85,000 single, over $15,000", () => {
    expect(worksheet(2000, 88000, false)).toBeCloseTo(1600);
  });

  it("allows nothing at $200,000 joint or more (line 7 is 1.000)", () => {
    expect(worksheet(2000, 230000)).toBe(0);
  });
});

const form1098E = { lenderName: "Lender", box1: 1800 };
const rows = (claimed?: boolean, status = "married_filing_jointly") =>
  makeResolverInputs({
    facts: [
      {
        key: makeStudentLoanInterestFactKey("lender"),
        category: "education",
        value: form1098E,
      },
      ...(claimed === undefined
        ? []
        : [{ key: STUDENT_LOAN_KEYS.claimedAsDependent, category: "education", value: claimed }]),
    ],
    decisions: [{ decisionKey: "decisions.scope.filing_status", decision: status }],
  });

describe("resolveStudentLoanInterest", () => {
  it("asks whether either filer is claimed as a dependent", () => {
    const { info, missing } = resolveStudentLoanInterest(rows());
    expect(info.studentLoanInterestPaid).toBe(1800);
    expect(missing).toEqual([STUDENT_LOAN_KEYS.claimedAsDependent]);
  });

  it("does not ask on a separate return, where the deduction does not apply", () => {
    expect(
      resolveStudentLoanInterest(rows(undefined, "married_filing_separately")).missing,
    ).toEqual([]);
  });

  it("asks nothing with no Form 1098-E", () => {
    const empty = makeResolverInputs({ facts: [], decisions: [] });
    expect(resolveStudentLoanInterest(empty)).toEqual({ info: {}, missing: [] });
  });
});

describe("isStudentLoanInterestFactKey", () => {
  it("matches one lender's key and nothing deeper", () => {
    expect(isStudentLoanInterestFactKey(makeStudentLoanInterestFactKey("sallie"))).toBe(true);
    expect(isStudentLoanInterestFactKey("lender..student_loan_interest")).toBe(false);
    expect(isStudentLoanInterestFactKey("lender.a.b.student_loan_interest")).toBe(false);
  });
});
