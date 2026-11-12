/*
 * Schedule C as the engine evaluates it: the Part IV gate, the home office
 * answers Cade is asked for, and the home office cases reported as
 * unsupported. The tcb-us-008 consultant with one change to the business.
 */

import { describe, expect, it } from "vitest";
import { makeBusinessFactKey, type BusinessFactValue } from "../../../../src/facts/index.js";
import { evaluateScenario } from "../../../../src/index.js";
import { tcbUs008Scenario as base } from "../../../scenarios/tcb-us-008/index.js";

const KEY = makeBusinessFactKey("consulting");

function scheduleC(change: (value: BusinessFactValue) => BusinessFactValue) {
  const facts = base.facts.map((fact) =>
    fact.key === KEY ? { ...fact, value: change(fact.value as BusinessFactValue) } : fact,
  );
  const result = evaluateScenario({
    filing: { id: "schedule-c-form-test", taxYear: base.taxYear },
    facts,
    decisions: base.decisions,
    authEmail: null,
  });
  const form = result.forms.get("schedule-c")!;
  const field = (id: string) => form.fields.find((each) => each.fieldId === `schedule-c.${id}`)!;
  return {
    value: (id: string) => {
      const { result: fieldResult } = field(id);
      return fieldResult.ok ? fieldResult.value : undefined;
    },
    unsupported: (id: string) => {
      const { result: fieldResult } = field(id);
      return !fieldResult.ok && fieldResult.unsupported === true ? fieldResult.reason : undefined;
    },
    missing: form.missingInputs,
  };
}

const firstVehicle = (value: BusinessFactValue) => value.vehicles![0];

describe("Part IV, the vehicle", () => {
  it.each([
    ["standard mileage, no depreciation", (value: BusinessFactValue) => value, 280],
    [
      "actual expenses, no depreciation",
      (value: BusinessFactValue) => ({
        ...value,
        expenses: { ...value.expenses, carAndTruck: 900 },
        vehicles: [{ ...firstVehicle(value), standardMileageRate: false }],
      }),
      280,
    ],
    [
      "depreciation on line 13: Form 4562 takes the vehicle",
      (value: BusinessFactValue) => ({
        ...value,
        expenses: { ...value.expenses, depreciation: 400 },
      }),
      undefined,
    ],
  ] as Array<[string, (value: BusinessFactValue) => BusinessFactValue, number | undefined]>)(
    "%s",
    (_, change, miles) => {
      expect(scheduleC(change).value("1.line.44a_business_miles")).toBe(miles);
    },
  );
});

describe("the home office answers", () => {
  const office = (change: Record<string, unknown>) => (value: BusinessFactValue) => ({
    ...value,
    homeOffice: { ...value.homeOffice!, ...change },
  });

  it.each([
    ["all answered", office({}), []],
    ["gross-income answer open", office({ allGrossIncomeFromHome: undefined }), [KEY]],
    ["same-area answer open", office({ sameAreaAllYear: undefined }), [KEY]],
    ["part-year use, no average", office({ sameAreaAllYear: false }), [KEY]],
    [
      "part-year use with the average",
      office({ sameAreaAllYear: false, averageMonthlySquareFeet: 100 }),
      [],
    ],
  ] as Array<[string, (value: BusinessFactValue) => BusinessFactValue, string[]]>)(
    "%s",
    (_, change, missing) => {
      expect(scheduleC(change).missing).toEqual(missing);
    },
  );

  it("reports lines 30 and 31 as unsupported when some income is from another place", () => {
    const form = scheduleC(office({ allGrossIncomeFromHome: false }));
    expect(form.unsupported("0.line.30")).toMatch(/gross income/);
    expect(form.unsupported("0.line.31")).toMatch(/gross income/);
  });

  it("figures line 30 when all income is from the home", () => {
    const form = scheduleC(office({}));
    expect(form.value("0.line.30")).toBe(720);
    expect(form.unsupported("0.line.30")).toBeUndefined();
  });
});
