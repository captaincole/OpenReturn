/*
 * Sources: irs-1040s8-inst-2025, "Credits for Qualifying Children" and "Credit for
 * Other Dependents (ODC)"; irs-1040-inst-2025, Definitions and Special Rules (a
 * child born in the year; children of divorced or separated parents).
 */

import { describe, expect, it } from "vitest";
import {
  ageAtYearEnd,
  dependentCredit,
  isQualifyingChildRelationship,
  livedWithTaxpayerOverHalfYear,
  type DependentFactValue,
} from "../../src/facts/index.js";

const niece: DependentFactValue = {
  firstName: "Jessica",
  lastName: "Davies",
  ssn: "400-00-0003",
  relationship: "Niece",
  dob: "08/12/2014",
  monthsLivedWithYou: 12,
  usCitizenOrResident: true,
};

describe("ageAtYearEnd", () => {
  it("is the tax year less the birth year (a birthday on December 31 counts)", () => {
    expect(ageAtYearEnd("08/12/2014", 2025)).toBe(11);
    expect(ageAtYearEnd("12/30/2008", 2025)).toBe(17);
  });

  it("is unknown without a readable date", () => {
    expect(ageAtYearEnd(undefined, 2025)).toBeUndefined();
    expect(ageAtYearEnd("2014-08-12", 2025)).toBeUndefined();
  });
});

describe("isQualifyingChildRelationship", () => {
  it("takes every descendant the instructions name, and an adopted child", () => {
    for (const relationship of ["Son", "Great-granddaughter", "Grandnephew", "Adopted child"]) {
      expect(isQualifyingChildRelationship(relationship)).toBe(true);
    }
    expect(isQualifyingChildRelationship("Parent")).toBe(false);
  });
});

describe("livedWithTaxpayerOverHalfYear", () => {
  it("counts the months the child was alive when born in the year", () => {
    const born = { ...niece, dob: "10/01/2025", monthsLivedWithYou: 3 };
    expect(livedWithTaxpayerOverHalfYear(born, 2025)).toBe(true);
    expect(livedWithTaxpayerOverHalfYear({ ...born, monthsLivedWithYou: 1 }, 2025)).toBe(false);
  });

  it("is unknown without the months", () => {
    expect(livedWithTaxpayerOverHalfYear({ ...niece, monthsLivedWithYou: undefined }, 2025)).toBe(
      undefined,
    );
  });
});

describe("dependentCredit", () => {
  it("a qualifying child under 17 with an SSN takes the child tax credit", () => {
    expect(dependentCredit(niece, 2025)).toBe("child_tax_credit");
  });

  it("a child born in October who lived at home since birth takes the child tax credit", () => {
    expect(dependentCredit({ ...niece, dob: "10/01/2025", monthsLivedWithYou: 3 }, 2025)).toBe(
      "child_tax_credit",
    );
  });

  it("a child who turned 17 on December 30 takes the credit for other dependents (Example 1)", () => {
    expect(dependentCredit({ ...niece, dob: "12/30/2008" }, 2025)).toBe("other_dependents");
  });

  it("a parent takes the credit for other dependents", () => {
    expect(dependentCredit({ ...niece, relationship: "Parent", dob: "03/03/1955" }, 2025)).toBe(
      "other_dependents",
    );
  });

  it("a child with an ITIN and no SSN takes only the credit for other dependents", () => {
    expect(dependentCredit({ ...niece, ssn: undefined, tin: "900-70-0001" }, 2025)).toBe(
      "other_dependents",
    );
  });

  it("a child who lived at home half the year or less waits for the Form 8332 answer", () => {
    const apart = { ...niece, monthsLivedWithYou: 2 };
    expect(dependentCredit(apart, 2025)).toBeUndefined();
    expect(dependentCredit({ ...apart, form8332Release: true }, 2025)).toBe("child_tax_credit");
    expect(dependentCredit({ ...apart, form8332Release: false }, 2025)).toBe("other_dependents");
  });

  it("waits while the date of birth, the months in the home or the citizenship is unknown", () => {
    expect(dependentCredit({ ...niece, dob: undefined }, 2025)).toBeUndefined();
    expect(dependentCredit({ ...niece, monthsLivedWithYou: undefined }, 2025)).toBeUndefined();
    expect(dependentCredit({ ...niece, usCitizenOrResident: undefined }, 2025)).toBeUndefined();
  });

  it("earns nothing without a taxpayer identification number, and says so", () => {
    expect(dependentCredit({ ...niece, ssn: undefined }, 2025)).toBe("none");
  });

  it("earns nothing when not a citizen or resident", () => {
    expect(dependentCredit({ ...niece, usCitizenOrResident: false }, 2025)).toBe("none");
  });
});
