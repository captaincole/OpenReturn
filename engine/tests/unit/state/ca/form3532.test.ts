/*
 * Sources: ca-3532-inst-2025::sec::general-information::b02 (who files),
 * ::sec::line-2::b01 (the relationship boxes) and ::sec::line-5::b02, b04 (days).
 */

import { describe, expect, it } from "vitest";
import {
  HEAD_OF_HOUSEHOLD_KEYS,
  makeDependentFactKey,
  type DependentFactValue,
} from "../../../../src/facts/index.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import {
  daysLivedWithTaxpayer,
  findQualifyingPerson,
  fullTimeStudentUnder24,
  relationshipBox,
} from "../../../../src/state/ca/3532/qualifyingPerson.js";
import { resolve3532Info } from "../../../../src/state/ca/3532/resolveInfo.js";

const child = (overrides: Partial<DependentFactValue> = {}): DependentFactValue => ({
  firstName: "Kid",
  lastName: "One",
  ssn: "400-00-0001",
  relationship: "Son",
  dob: "06/01/2015",
  monthsLivedWithYou: 12,
  usCitizenOrResident: true,
  grossIncome: 0,
  ...overrides,
});

const dependentFact = (slug: string, value: DependentFactValue) => ({
  key: makeDependentFactKey(slug),
  category: "dependents",
  value,
});

const headOfHousehold = [
  { decisionKey: "decisions.scope.filing_status", decision: "head_of_household" },
  { decisionKey: "decisions.scope.must_file_ca_540", decision: true },
];

describe("resolve3532Info", () => {
  it("files with a head of household 540 and asks the marital status", () => {
    const info = resolve3532Info(
      makeResolverInputs({ facts: [dependentFact("kid", child())], decisions: headOfHousehold }),
    );
    expect(info.mustFile?.["form-3532"]?.value).toBe(true);
    expect(info.missingInputs?.["form-3532"]).toEqual([HEAD_OF_HOUSEHOLD_KEYS.caMaritalStatus]);
  });

  it("does not file for a single filer", () => {
    const info = resolve3532Info(
      makeResolverInputs({
        facts: [],
        decisions: [
          { decisionKey: "decisions.scope.filing_status", decision: "single" },
          { decisionKey: "decisions.scope.must_file_ca_540", decision: true },
        ],
      }),
    );
    expect(info.mustFile?.["form-3532"]?.value).toBe(false);
  });

  it("asks which dependent qualifies when there are several", () => {
    const inputs = makeResolverInputs({
      facts: [
        dependentFact("a", child()),
        dependentFact("b", child({ firstName: "Kid", lastName: "Two" })),
        {
          key: HEAD_OF_HOUSEHOLD_KEYS.caMaritalStatus,
          category: "filing_status",
          value: "not_married",
        },
      ],
      decisions: headOfHousehold,
    });
    expect(resolve3532Info(inputs).missingInputs?.["form-3532"]).toEqual([
      HEAD_OF_HOUSEHOLD_KEYS.qualifyingPerson,
    ]);
  });

  it("takes the named dependent", () => {
    const inputs = makeResolverInputs({
      facts: [
        dependentFact("a", child()),
        dependentFact("b", child({ lastName: "Two" })),
        { key: HEAD_OF_HOUSEHOLD_KEYS.qualifyingPerson, category: "filing_status", value: "b" },
      ],
      decisions: [],
    });
    expect(findQualifyingPerson(inputs).person?.dependent.lastName).toBe("Two");
  });

  it("asks a married filer who lived with the spouse for the periods", () => {
    const inputs = makeResolverInputs({
      facts: [
        dependentFact("kid", child()),
        {
          key: HEAD_OF_HOUSEHOLD_KEYS.caMaritalStatus,
          category: "filing_status",
          value: "married_lived_together",
        },
      ],
      decisions: headOfHousehold,
    });
    expect(resolve3532Info(inputs).missingInputs?.["form-3532"]).toEqual([
      HEAD_OF_HOUSEHOLD_KEYS.livedWithSpousePeriods,
      makeDependentFactKey("kid"),
    ]);
  });
});

describe("relationshipBox", () => {
  it.each([
    ["Stepson", "child_or_stepchild"],
    ["Niece", "grandchild_sibling_niece_nephew"],
    ["Half-brother", "grandchild_sibling_niece_nephew"],
    ["Foster child", "foster_child"],
    ["Mother", "parent_or_stepparent"],
    ["Mother-in-law", "other_relative"],
    ["Cousin", undefined],
  ])("%s → %s", (relationship, box) => {
    expect(relationshipBox(relationship)).toBe(box);
  });
});

describe("daysLivedWithTaxpayer", () => {
  it("counts twelve months as 365 days for an unmarried filer", () => {
    expect(daysLivedWithTaxpayer(child(), "not_married")).toBe(365);
  });
  it("enters 365 for a child born during the year", () => {
    expect(
      daysLivedWithTaxpayer(child({ dob: "09/01/2025", monthsLivedWithYou: 4 }), "not_married"),
    ).toBe(365);
  });
  it("waits for the days of a filer divorced during the year", () => {
    expect(daysLivedWithTaxpayer(child(), "divorced_or_separated")).toBeUndefined();
    expect(daysLivedWithTaxpayer(child({ daysLivedWithYou: 300 }), "divorced_or_separated")).toBe(
      300,
    );
  });
  it("waits for the days when the person lived in the home part of the year", () => {
    expect(daysLivedWithTaxpayer(child({ monthsLivedWithYou: 8 }), "not_married")).toBeUndefined();
  });
});

describe("fullTimeStudentUnder24", () => {
  it("answers no at 24 or older, and waits for a younger person's answer", () => {
    expect(fullTimeStudentUnder24(child({ dob: "01/01/2000" }))).toBe(false);
    expect(fullTimeStudentUnder24(child({ dob: "01/01/2004" }))).toBeUndefined();
    expect(fullTimeStudentUnder24(child({ dob: "01/01/2004", fullTimeStudent: true }))).toBe(true);
  });
});
