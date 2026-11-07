/* Source: irs-1040s8-inst-2025, "Credits for Qualifying Children" and "Credit for Other Dependents (ODC)". */

import { describe, expect, it } from "vitest";
import { ageAtYearEnd, dependentCredit, type DependentFactValue } from "../../src/facts/index.js";

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
  it("counts the birthday in the tax year", () => {
    expect(ageAtYearEnd("08/12/2014", 2025)).toBe(11);
    expect(ageAtYearEnd("12/30/2008", 2025)).toBe(17);
  });

  it("is unknown without a readable date", () => {
    expect(ageAtYearEnd(undefined, 2025)).toBeUndefined();
    expect(ageAtYearEnd("2014-08-12", 2025)).toBeUndefined();
  });
});

describe("dependentCredit", () => {
  it("a qualifying child under 17 with an SSN takes the child tax credit", () => {
    expect(dependentCredit(niece, 2025)).toBe("child_tax_credit");
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

  it("a child who lived with the taxpayer half the year or less is not a qualifying child", () => {
    expect(dependentCredit({ ...niece, monthsLivedWithYou: 6 }, 2025)).toBe("other_dependents");
  });

  it("waits while the date of birth is unknown", () => {
    expect(dependentCredit({ ...niece, dob: undefined }, 2025)).toBeUndefined();
  });

  it("gives nothing to a person with no taxpayer identification number", () => {
    expect(dependentCredit({ ...niece, ssn: undefined }, 2025)).toBeUndefined();
  });
});
