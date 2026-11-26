/*
 * Form 8911 on a whole return: who files, the Schedules A, the tax limit, the
 * gaps, and Schedule 3 line 6j. The synthetic pevara scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeDependentFactKey,
  makePartnershipK1FactKey,
  makeRefuelingPropertyFactKey,
  type DependentFactValue,
  type RefuelingPropertyFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { DRIVEWAY_CHARGER, GARAGE_CHARGER } from "../../../scenarios/synthetic/pevara/facts.js";
import { pevaraScenario as base } from "../../../scenarios/synthetic/pevara/index.js";
import { wrenScenario } from "../../../scenarios/synthetic/wren/index.js";

const GARAGE = makeRefuelingPropertyFactKey("garage-charger");
const DRIVEWAY = makeRefuelingPropertyFactKey("driveway-charger");

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

function evaluate(
  facts: TaxFactRow[],
  decisions: AIDecisionRow[] = base.decisions,
  taxYear = base.taxYear,
) {
  const result = evaluateScenario({
    filing: { id: "form-8911-test", taxYear },
    facts,
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
  const line = (id: string) => value("form-8911", id);
  const missing = result.forms.get("form-8911")?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const child = (firstName: string, ssn: string): DependentFactValue => ({
  firstName,
  lastName: "Halloran",
  ssn,
  relationship: "Son",
  dob: "03/02/2018",
  monthsLivedWithYou: 12,
  livedInUs: true,
  usCitizenOrResident: true,
  fullTimeStudent: false,
  permanentlyDisabled: false,
});

/* Children under 17: each adds $2,200 to Form 1040 line 19, which line 6b takes. */
const children = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    row(
      "dependents",
      makeDependentFactKey(`child-${index}`),
      child(`Kid${index}`, `400-00-89${20 + index}`),
    ),
  );

const LINE_3 = "0.line.3_business_investment_use_credit";
const LINE_4 = "0.line.4_personal_credit_from_schedule_a";
const LINE_10 = "0.line.10_personal_use_credit";

describe("Form 8911 who files", () => {
  it("files with two home chargers: both Schedules A, Schedule 3 line 6j and Form 6251", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-8911")).toBe(true);
    expect(run.files("form-6251")).toBe(true);
    expect(run.line("0.header.a_number_of_refueling_properties")).toBe(2);
    expect(run.line(LINE_4)).toBe(1624);
    expect(run.line(LINE_10)).toBe(1624);
    expect(run.value("schedule-3", "0.line.6j")).toBe(1624);
    expect(run.line(LINE_3)).toBeUndefined();
    expect(run.files("form-3800")).toBe(false);
  });

  it("no refueling facts: no Form 8911, and Schedule 3 line 6j keeps its old reason", () => {
    const run = evaluate(wrenScenario.facts, wrenScenario.decisions, wrenScenario.taxYear);
    expect(run.files("form-8911")).toBe(false);
    expect(isGap(run.field("schedule-3", "0.line.6j"))).toBe(true);
    expect(run.value("schedule-3", "0.line.4")).toBe(1603);
  });

  it("a property outside an eligible census tract, or placed in service in 2024, claims nothing", () => {
    const outside = { ...GARAGE_CHARGER, eligibleCensusTract: false };
    const earlier = { ...DRIVEWAY_CHARGER, placedInServiceDate: "2024-12-30" };
    const run = evaluate(factsWith({ [GARAGE]: outside, [DRIVEWAY]: earlier }));
    expect(run.files("form-8911")).toBe(false);
    expect(run.files("form-6251")).toBe(false);
    const one = evaluate(factsWith({ [GARAGE]: outside }));
    expect(one.line("0.header.a_number_of_refueling_properties")).toBe(1);
    expect(one.line(LINE_4)).toBe(624);
  });

  it("a personal charger that is not at the main home claims nothing", () => {
    const run = evaluate(factsWith({ [GARAGE]: { ...GARAGE_CHARGER, mainHome: false } }));
    expect(run.line(LINE_4)).toBe(624);
    expect(run.line("0.header.a_number_of_refueling_properties")).toBe(1);
  });

  it("the explicit decision wins", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_8911", false)];
    const run = evaluate(base.facts, decisions);
    expect(run.files("form-8911")).toBe(false);
    expect(isGap(run.field("schedule-3", "0.line.6j"))).toBe(true);
  });
});

describe("Form 8911 answers that wait", () => {
  it("a missing main home answer lists the property and leaves line 4 blank", () => {
    const unanswered = { ...GARAGE_CHARGER, mainHome: undefined };
    const run = evaluate(factsWith({ [GARAGE]: unanswered }));
    expect(run.files("form-8911")).toBe(true);
    expect(run.missing).toContain(GARAGE);
    expect(run.line(LINE_4)).toBeUndefined();
  });

  it("a business part with no PWA answer lists the property; construction before 2023-01-29 needs none", () => {
    const mixed: RefuelingPropertyFactValue = { ...GARAGE_CHARGER, businessUsePercent: 40 };
    expect(evaluate(factsWith({ [GARAGE]: mixed })).missing).toContain(GARAGE);
    const old = { ...mixed, constructionBeganDate: "2023-01-10" };
    const run = evaluate(factsWith({ [GARAGE]: old }));
    expect(run.missing).toEqual([]);
    // Line 10 $1,660 × 30% = $498 (line 13 Yes); line 18 $2,490 × 30% = $747.
    expect(run.line("0.line.1_business_credit_from_schedule_a")).toBe(498);
  });
});

describe("Form 8911 Part I: the business part goes through Form 3800", () => {
  it("a mixed-use charger fills lines 1 and 3, and line 3 reaches Form 3800 line 1s and Schedule 3 line 6a", () => {
    const mixed = { ...GARAGE_CHARGER, businessUsePercent: 40, meetsPwaRequirements: false };
    const run = evaluate(factsWith({ [GARAGE]: mixed }));
    // Line 10 $1,660 × 6% = $100; line 18 $2,490 × 30% = $747.
    expect(run.line("0.line.1_business_credit_from_schedule_a")).toBe(100);
    expect(run.line(LINE_3)).toBe(100);
    expect(run.line(LINE_4)).toBe(747 + 624);
    expect(run.files("form-3800")).toBe(true);
    expect(run.value("form-3800", "2.part3.1s_form_8911_part_i_col_e")).toBe(100);
    const allowed = run.value("form-3800", "1.line.38_credit_allowed_current_year");
    expect(typeof allowed).toBe("number");
    expect(run.value("schedule-3", "0.line.6a")).toBe(allowed);
  });

  it("a K-1 code AO credit goes on line 2 next to a Schedule A; alone it files only Form 3800", () => {
    const k1 = row("k1", makePartnershipK1FactKey("tarwin-charging"), {
      form: "1065",
      entityName: "Tarwin Charging Partners LP",
      entityEin: "00-0089111",
      boxes: [{ box: "15", code: "AO", amount: 1200 }],
    });
    const run = evaluate(factsWith({}, [k1]));
    expect(run.line("0.line.2_credit_from_partnerships_s_corporations")).toBe(1200);
    expect(run.line(LINE_3)).toBe(1200);
    expect(run.files("form-3800")).toBe(true);
    const alone = evaluate(factsWith({ [GARAGE]: undefined, [DRIVEWAY]: undefined }, [k1]));
    expect(alone.files("form-8911")).toBe(false);
    expect(alone.files("form-3800")).toBe(true);
  });
});

describe("Form 8911 Part II: the tax limit", () => {
  it("line 6b takes Form 1040 line 19; with more children line 9 is smaller than line 4", () => {
    // Four children: line 19 $8,800; line 7 $32,607 − $95 − $8,800 = $23,712; line 9 $710.
    const run = evaluate(factsWith({}, children(3)));
    expect(run.line("0.line.6b_certain_allowable_credits")).toBe(8800);
    expect(run.line("0.line.7_net_regular_tax")).toBe(23712);
    expect(run.line("0.line.9_net_tax_less_minimum_tax")).toBe(710);
    expect(run.line(LINE_10)).toBe(710);
    expect(run.value("schedule-3", "0.line.6j")).toBe(710);
  });

  it("line 9 at 0 stops: no credit, and the form leaves the return", () => {
    // Five children: line 7 $32,607 − $95 − $11,000 = $21,512, under the $23,002 line 8.
    const run = evaluate(factsWith({}, children(4)));
    expect(run.files("form-8911")).toBe(false);
    expect(run.value("schedule-3", "0.line.6j")).toBeUndefined();
  });

  it("line 8 is a gap when the decision says Form 6251 does not file", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_6251", false)];
    const run = evaluate(base.facts, decisions);
    expect(isGap(run.field("form-8911", "0.line.8_tentative_minimum_tax"))).toBe(true);
    expect(isGap(run.field("schedule-3", "0.line.6j"))).toBe(true);
  });

  it("line 8 takes the foreign tax credit off Form 6251 line 7, which line 8 of 6251 leaves blank", () => {
    const run = evaluate(base.facts);
    expect(run.value("form-6251", "0.line.9_tentative_minimum_tax")).toBe(23097);
    expect(run.line("0.line.8_tentative_minimum_tax")).toBe(23097 - 95);
  });
});
