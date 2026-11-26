/*
 * Form 4136 on a whole return: who files, Part I, the cases the engine does
 * not print, and the lines that take its credit (Schedule 3 lines 12 and 15,
 * Form 1040 line 31). The synthetic meilyn scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  FUEL_TAX_REGISTRATION_NUMBERS_KEY,
  isFuelTaxActivityFactKey,
  makeFarmFactKey,
  makeFuelTaxActivityFactKey,
  type FuelTaxActivityFactValue,
  type FuelTaxClaim,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { form4136Bindings } from "../../../../src/federal/4136/bindings.js";
import catalogJson from "../../../../src/federal/4136/catalog.json";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { edarraScenario as edarra } from "../../../scenarios/synthetic/edarra/index.js";
import { meilynScenario as base } from "../../../scenarios/synthetic/meilyn/index.js";

const isFuel = (fact: TaxFactRow) =>
  isFuelTaxActivityFactKey(fact.key) || fact.key === FUEL_TAX_REGISTRATION_NUMBERS_KEY;
const otherFacts = base.facts.filter((fact) => !isFuel(fact));
const registration = base.facts.find((fact) => fact.key === FUEL_TAX_REGISTRATION_NUMBERS_KEY)!;
const template = base.facts.find((fact) => isFuelTaxActivityFactKey(fact.key))!;

const activity = (slug: string, value: Partial<FuelTaxActivityFactValue>): TaxFactRow => ({
  ...template,
  id: `f-${slug}`,
  key: makeFuelTaxActivityFactKey(slug),
  value: { kind: "business", claims: [], ...value },
});

const business = (
  slug: string,
  claims: FuelTaxClaim[],
  more: Partial<FuelTaxActivityFactValue> = {},
) =>
  activity(slug, {
    principalBusinessActivityCode: "115110",
    equipment: { make: "Deere", model: "8R", type: "Tractor" },
    claims,
    ...more,
  });

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(extra: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-4136-test", taxYear: base.taxYear },
    facts: [...otherFacts, ...extra],
    decisions,
    authEmail: null,
  });
  const files = (formId: string) => {
    const form = result.forms.get(formId);
    return form?.mustFile.ok ? form.mustFile.value : undefined;
  };
  const field = (formId: string, id: string) =>
    result.forms.get(formId)?.fields.find((each) => each.fieldId === `${formId}.${id}`)?.result;
  const value = (formId: string, id: string) => {
    const found = field(formId, id);
    return found?.ok ? found.value : undefined;
  };
  return { files, field, value, pending: pendingInputs(result).pendingFacts };
}

const LINE_17 = "3.line.17_total_income_tax_credit";
const LINE_17_CENTS = "3.line.17_total_income_tax_credit_cents";
const UNSUPPORTED = { ok: false, unsupported: true };
const farmDiesel = (gallons: number): FuelTaxClaim => ({
  line: "3b",
  gallons,
  actualFuelCost: 1000,
});

describe("Form 4136 bindings", () => {
  it("every catalog field has a rule", () => {
    const rules = form4136Bindings();
    const missing = catalogJson.fields
      .map((each) => each.fieldId.slice("form-4136.".length))
      .filter((id) => rules[id] === undefined);
    expect(missing).toEqual([]);
  });
});

describe("Form 4136 who files", () => {
  it("files, with Schedule 3, for an activity with a claim", () => {
    const run = evaluate([business("farm", [farmDiesel(200)])]);
    expect([run.files("form-4136"), run.files("schedule-3")]).toEqual([true, true]);
    expect(run.value("form-4136", "0.header.a_qualifying_business_activity_yes")).toBe(true);
    expect(run.value("form-4136", "0.line.3b_undyed_diesel_farm_use_col_e")).toBe(48);
    expect(run.value("form-4136", "0.line.3b_undyed_diesel_farm_use_col_e_cents")).toBe(60);
    expect(run.value("schedule-3", "0.line.12")).toBe(49);
  });

  it("does not file for an activity with no gallons", () => {
    const run = evaluate([business("farm", [farmDiesel(0)])]);
    expect(run.files("form-4136")).toBe(false);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(
      [business("farm", [farmDiesel(200)])],
      [...base.decisions, decision("decisions.scope.must_file_4136", false)],
    );
    expect(run.files("form-4136")).toBe(false);
  });
});

describe("No fuel fact: nothing changes", () => {
  it("Form 4136 does not file; Schedule 3 line 12 keeps its reason, line 15 and Form 1040 line 31 are blank", () => {
    const run = evaluate(
      [],
      [...base.decisions, decision("decisions.scope.must_file_schedule_3", true)],
    );
    expect(run.files("form-4136")).toBe(false);
    expect(run.field("schedule-3", "0.line.12")).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-3", "0.line.15")).toMatchObject({ ok: false });
    expect(run.field("schedule-3", "0.line.15")).not.toMatchObject(UNSUPPORTED);
    expect(run.field("form-1040", "line.31")).not.toMatchObject(UNSUPPORTED);
    expect(run.value("form-1040", "line.31")).toBeUndefined();
    expect(run.value("form-1040", "line.33")).toBe(16000);
  });
});

describe("Part I", () => {
  it("home kerosene alone: line A Yes, lines B to F blank, 4a type 8", () => {
    const home = activity("home", {
      kind: "home_kerosene",
      claims: [{ line: "4a", gallons: 150, actualFuelCost: 690.25, typeOfUse: 8 }],
    });
    const run = evaluate([home]);
    expect(run.value("form-4136", "0.header.a_qualifying_business_activity_yes")).toBe(true);
    expect(run.value("form-4136", "0.header.b_number_of_business_activities")).toBeUndefined();
    expect(run.value("form-4136", "0.header.c_business_name")).toBeUndefined();
    expect(run.value("form-4136", "1.line.4a_nontaxable_use_244_col_a")).toBe("8");
    expect([run.value("form-4136", LINE_17), run.value("form-4136", LINE_17_CENTS)]).toEqual([
      36,
      "45",
    ]);
    expect(run.value("schedule-3", "0.line.12")).toBe(36);
  });

  it("two activities: line B is unsupported (Schedule A); lines C to F describe the one with the most credit", () => {
    const run = evaluate([
      business("small", [farmDiesel(100)], { businessName: "Small Farm" }),
      business("large", [farmDiesel(900)], { businessName: "Large Farm" }),
    ]);
    expect(run.field("form-4136", "0.header.b_number_of_business_activities")).toMatchObject(
      UNSUPPORTED,
    );
    expect(run.value("form-4136", "0.header.c_business_name")).toBe("Large Farm");
    expect(run.value("form-4136", "0.line.3b_undyed_diesel_farm_use_col_c")).toBe(1000);
    expect(run.value("schedule-3", "0.line.12")).toBe(243);
  });

  it("the linked Schedule C business gives lines C to E; the activity's own answers win", () => {
    const run = evaluate([base.facts.find((fact) => fact.key === template.key)!, registration]);
    expect(run.value("form-4136", "0.header.c_business_name")).toBe("Ashvane Field & Air Services");
    expect(run.value("form-4136", "0.header.d_business_ein")).toBe("00-0041360");
    const own = evaluate([
      business("farm", [farmDiesel(10)], { principalBusinessActivityCode: "111100" }),
    ]);
    expect(own.value("form-4136", "0.header.e_principal_business_activity_code")).toBe("111100");
  });

  it("a missing code or equipment waits for the activity fact", () => {
    const run = evaluate([activity("farm", { claims: [farmDiesel(10)] })]);
    expect(run.pending).toContain(makeFuelTaxActivityFactKey("farm"));
    expect(run.value("form-4136", "0.header.e_principal_business_activity_code")).toBeUndefined();
  });
});

describe("cases the engine does not print", () => {
  it("a type of use the line does not allow makes Part II, line 17 and Schedule 3 line 12 unsupported", () => {
    const run = evaluate([
      business("farm", [{ line: "4e", gallons: 10, actualFuelCost: 40, typeOfUse: 8 }]),
    ]);
    expect(run.field("form-4136", LINE_17)).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-3", "0.line.12")).toMatchObject(UNSUPPORTED);
    expect(run.field("schedule-3", "0.line.15")).toMatchObject(UNSUPPORTED);
  });

  it("two types of use on one row: (a) and (c) need a statement, (e) holds both", () => {
    const run = evaluate([
      business("farm", [
        { line: "3a", gallons: 100, actualFuelCost: 400, typeOfUse: 2 },
        { line: "3a", gallons: 100, actualFuelCost: 400, typeOfUse: 6 },
      ]),
    ]);
    expect(run.field("form-4136", "0.line.3a_undyed_diesel_nontaxable_use_col_a")).toMatchObject(
      UNSUPPORTED,
    );
    expect(run.field("form-4136", "0.line.3a_undyed_diesel_nontaxable_use_col_c")).toMatchObject(
      UNSUPPORTED,
    );
    expect(run.value("form-4136", "0.line.3b_undyed_diesel_farm_use_col_e")).toBe(48);
  });

  it("a vendor line with no registration number waits: line 17 and Schedule 3 line 12 are blank", () => {
    const run = evaluate([business("depot", [{ line: "6a", gallons: 100, actualFuelCost: 400 }])]);
    expect(run.pending).toContain(FUEL_TAX_REGISTRATION_NUMBERS_KEY);
    expect(run.value("form-4136", "1.line.6a_state_local_government_col_e")).toBe(24);
    expect(run.value("form-4136", LINE_17)).toBeUndefined();
    expect(run.value("schedule-3", "0.line.12")).toBeUndefined();
  });
});

describe("the credit in an accrual-method business's income", () => {
  const businessKey = (template.value as FuelTaxActivityFactValue).businessKey;
  const meilynBusiness = base.facts.find((fact) => fact.key === businessKey)!;

  it("a cash-method business: Schedule C line 6 is the stated other income", () => {
    const run = evaluate(base.facts.filter(isFuel));
    expect(run.value("schedule-c", "0.line.6")).toBe(2150);
  });

  it("an accrual-method business with a claim: Schedule C line 6 is unsupported", () => {
    const accrual: TaxFactRow = {
      ...meilynBusiness,
      value: { ...(meilynBusiness.value as object), accountingMethod: "accrual" },
    };
    const run = evaluateScenario({
      filing: { id: "form-4136-accrual", taxYear: base.taxYear },
      facts: [...base.facts.filter((fact) => fact.key !== meilynBusiness.key), accrual],
      decisions: base.decisions,
      authEmail: null,
    });
    const line6 = run.forms
      .get("schedule-c")
      ?.fields.find((field) => field.fieldId === "schedule-c.0.line.6");
    expect(line6?.result).toMatchObject(UNSUPPORTED);
  });

  it("an accrual-method farm with a claim: Schedule F line 43 is unsupported; with no claim it is the stated amount", () => {
    const farmKey = makeFarmFactKey("oak-knoll-nursery");
    const line43 = (facts: TaxFactRow[]) =>
      evaluateScenario({
        filing: { id: "form-4136-farm", taxYear: edarra.taxYear },
        facts,
        decisions: edarra.decisions,
        authEmail: null,
      })
        .forms.get("schedule-f")
        ?.fields.find((field) => field.fieldId === "schedule-f.1.line.43_other_income_accrual")
        ?.result;
    const gasoline = { line: "1b" as const, gallons: 1000, actualFuelCost: 3200 };
    const claim = business("nursery", [gasoline], { businessKey: farmKey });
    expect(line43([...edarra.facts, { ...claim, userId: edarra.userId }])).toMatchObject(
      UNSUPPORTED,
    );
    expect(line43(edarra.facts)).toMatchObject({ ok: true });
  });
});

describe("the lines that take the credit (meilyn)", () => {
  it("line 17 $8,366.32 is Schedule 3 lines 12 and 15 and Form 1040 line 31 in whole dollars", () => {
    const run = evaluate(base.facts.filter(isFuel));
    expect([run.value("form-4136", LINE_17), run.value("form-4136", LINE_17_CENTS)]).toEqual([
      8366,
      "32",
    ]);
    expect(run.value("schedule-3", "0.line.12")).toBe(8366);
    expect(run.value("schedule-3", "0.line.15")).toBe(8366);
    expect(run.value("form-1040", "line.31")).toBe(8366);
    expect(run.value("form-1040", "line.32")).toBe(8366);
  });
});
