/*
 * Sources: irs-1040s8-inst-2025, "Credits for Qualifying Children" and "Credit for
 * Other Dependents (ODC)"; irs-1040-inst-2025, Definitions and Special Rules (a
 * child born in the year; children of divorced or separated parents).
 */

import { describe, expect, it } from "vitest";
import {
  ageAtYearEnd,
  dependentCredit,
  getClaimedDependentFacts,
  getDependentFacts,
  isClaimedDependent,
  isOtherParentsQualifyingChild,
  isQualifyingChildRelationship,
  livedWithTaxpayerOverHalfYear,
  type DependentFactValue,
} from "../../src/facts/index.js";
import { isEicQualifyingChild } from "../../src/federal/schedule-eic/qualifyingChild.js";

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

  it("counts the months since the placement for a child adopted or placed in the year", () => {
    const foster = {
      ...niece,
      relationship: "Foster child",
      dob: "03/03/2020",
      placedWithYou: "09/01/2025",
      monthsLivedWithYou: 4,
    };
    expect(livedWithTaxpayerOverHalfYear(foster, 2025)).toBe(true);
    expect(dependentCredit(foster, 2025)).toBe("child_tax_credit");
    expect(livedWithTaxpayerOverHalfYear({ ...foster, monthsLivedWithYou: 1 }, 2025)).toBe(false);
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
  });

  /*
   * irs-1040-inst-2025::sec::is-your-qualifying-relative::b01: a qualifying
   * relative is a person "Who wasn't a qualifying child (see Step 1) of any
   * taxpayer for 2025". With no Form 8332 release, a child who lived here 3
   * months is the other parent's qualifying child, so no dependent here.
   */
  it("a child who lived at home half the year or less with no release is not a dependent", () => {
    const son = { ...niece, relationship: "Son", monthsLivedWithYou: 3, form8332Release: false };
    expect(isOtherParentsQualifyingChild(son, 2025)).toBe(true);
    expect(dependentCredit(son, 2025)).toBe("none");
    const facts = [{ key: "dependent.a", value: son, category: "dependents" }];
    expect(getClaimedDependentFacts(facts, 2025)).toEqual([]);
    expect(isOtherParentsQualifyingChild({ ...son, form8332Release: true }, 2025)).toBe(false);
    expect(isOtherParentsQualifyingChild({ ...son, monthsLivedWithYou: 7 }, 2025)).toBe(false);
    expect(isOtherParentsQualifyingChild({ ...son, relationship: "Parent" }, 2025)).toBe(false);
  });

  /*
   * irs-1040-inst-2025::sec::definitions-and-special-rules::b02: "only the
   * noncustodial parent can claim the child for purposes of the child tax
   * credit and credit for other dependents"; ::b03: the custodial parent keeps
   * head of household, the dependent care credit and the EIC.
   */
  it("a child the custodial parent released on Form 8332 earns neither credit on that parent's return", () => {
    const released = { ...niece, relationship: "Daughter", releasedToNoncustodialParent: true };
    expect(dependentCredit(released, 2025)).toBe("none");
    expect(isClaimedDependent(released)).toBe(false);
    expect(livedWithTaxpayerOverHalfYear(released, 2025)).toBe(true);
    expect(isEicQualifyingChild({ ...released, livedInUs: true }, ["01/01/1985"], 2025)).toBe(true);
    expect(dependentCredit({ ...released, releasedToNoncustodialParent: false }, 2025)).toBe(
      "child_tax_credit",
    );
  });

  it("the claimed dependents leave out a released child and keep every other dependent fact", () => {
    const row = (key: string, value: DependentFactValue) => ({
      key,
      value,
      category: "dependents",
    });
    const facts = [
      row("dependent.a", niece),
      row("dependent.b", { ...niece, releasedToNoncustodialParent: true }),
      row("dependent.c", { ...niece, monthsLivedWithYou: 2, form8332Release: true }),
    ];
    expect(getDependentFacts(facts).map((fact) => fact.dependentSlug)).toEqual(["a", "b", "c"]);
    expect(getClaimedDependentFacts(facts, 2025).map((fact) => fact.dependentSlug)).toEqual([
      "a",
      "c",
    ]);
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
