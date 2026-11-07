/* Source: irs-1040s8-inst-2025, "Credits for Qualifying Children" and "Credit for Other Dependents (ODC)". */

import { describe, expect, it } from "vitest";
import { makeDependentFactKey, type DependentFactValue } from "../../../../src/facts/index.js";
import { resolveSchedule8812Info } from "../../../../src/federal/schedule-8812/resolveInfo.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";

const KEY = makeDependentFactKey("jessica-davies");

const niece: DependentFactValue = {
  firstName: "Jessica",
  lastName: "Davies",
  ssn: "400-00-0003",
  relationship: "Niece",
  dob: "08/12/2014",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
};

const resolve = (dependent: DependentFactValue) =>
  resolveSchedule8812Info(
    makeResolverInputs({
      facts: [{ key: KEY, category: "dependents", value: dependent }],
      decisions: [],
    }),
  );

describe("resolveSchedule8812Info", () => {
  it("files for a qualifying child and decides every Dependents-table answer once", () => {
    const info = resolve(niece);
    expect(info.mustFile?.["schedule-8812"]?.value).toBe(true);
    expect(info.childTaxCreditCount).toBe(1);
    expect(info.otherDependentCount).toBe(0);
    expect(info.dependents?.[0]).toMatchObject({
      factKey: KEY,
      livedWithYouOverHalfYear: true,
      livedWithYouInUs: true,
      credit: "child_tax_credit",
    });
    expect(info.missingInputs?.["schedule-8812"]).toEqual([]);
  });

  it("files and asks again while a dependent's date of birth is missing", () => {
    const info = resolve({ ...niece, dob: undefined });
    expect(info.mustFile?.["schedule-8812"]?.value).toBe(true);
    expect(info.missingInputs?.["schedule-8812"]).toEqual([KEY]);
    expect(info.childTaxCreditCount).toBeUndefined();
    expect(info.dependents?.[0]?.credit).toBeUndefined();
  });

  it("does not file for a dependent who earns neither credit", () => {
    const info = resolve({ ...niece, ssn: undefined });
    expect(info.mustFile?.["schedule-8812"]?.value).toBe(false);
    expect(info.dependents?.[0]?.credit).toBe("none");
  });
});
