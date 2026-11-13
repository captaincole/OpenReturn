import {
  isStudentLoanInterestFactKey,
  makeStudentLoanInterestFactKey,
} from "@openreturn/engine/facts";
import { describe, expect, it } from "vitest";
import { studentLoanSlug } from "../../../../src/mastra/tools/ingest1098E.js";

const key = (lender: string, owner: "taxpayer" | "spouse") =>
  makeStudentLoanInterestFactKey(studentLoanSlug(lender, owner));

describe("studentLoanSlug", () => {
  it("keys the taxpayer's 1098-E by the lender's name", () => {
    expect(key("Column Student Loan Servicing", "taxpayer")).toBe(
      "lender.column-student-loan-servicing.student_loan_interest",
    );
  });

  it("gives the spouse's 1098-E from the same servicer its own key", () => {
    expect(key("Column Student Loan Servicing", "spouse")).not.toBe(
      key("Column Student Loan Servicing", "taxpayer"),
    );
    expect(isStudentLoanInterestFactKey(key("Column Student Loan Servicing", "spouse"))).toBe(true);
  });

  it("falls back to a key the engine reads when the name has no letters or digits", () => {
    expect(isStudentLoanInterestFactKey(key("***", "taxpayer"))).toBe(true);
    expect(isStudentLoanInterestFactKey(key("", "spouse"))).toBe(true);
  });
});
