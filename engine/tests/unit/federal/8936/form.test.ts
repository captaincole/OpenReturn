/*
 * Form 8936 on a whole return: who files, the answers it asks for, the parts
 * it fills, its gaps, and the lines it sends to Schedules 2 and 3. The
 * synthetic elayne scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  CLEAN_VEHICLE_KEYS,
  PRIOR_YEAR_KEYS,
  isCleanVehicleFactKey,
  makeCleanVehicleFactKey,
  makeW2FactKey,
  type CleanVehicleFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { cleanVehicleCreditGap } from "../../../../src/federal/8936/credit.js";
import type { Form8936FilingInfo } from "../../../../src/federal/8936/filingInfo.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { birgitteScenario } from "../../../scenarios/synthetic/birgitte/index.js";
import {
  ELAYNE_NEW_VEHICLE,
  ELAYNE_USED_VEHICLE,
} from "../../../scenarios/synthetic/elayne/facts.js";
import { elayneScenario as base } from "../../../scenarios/synthetic/elayne/index.js";

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

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const NEW_KEY = makeCleanVehicleFactKey("aurelle-ridgeline");
const USED_KEY = makeCleanVehicleFactKey("pellam-strata");

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8936-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-8936", id);
  const missing = result.forms.get("form-8936")?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const W2_ELAYNE = makeW2FactKey("brushy-creek-analytics");
const W2_GARETH = makeW2FactKey("hill-country-water");
const w2Of = (key: string) => base.facts.find((fact) => fact.key === key)!.value as object;
const noVehicles = { [NEW_KEY]: undefined, [USED_KEY]: undefined };

describe("Form 8936 who files", () => {
  it("files with a vehicle placed in service in 2025, and Schedule 3 with it", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-8936")).toBe(true);
    expect(run.files("schedule-3")).toBe(true);
    expect(run.missing).toEqual([]);
  });

  it("does not file with no vehicle, and Schedule 3 lines 6f and 6m stay blank", () => {
    const run = evaluate(factsWith(noVehicles));
    expect(run.files("form-8936")).toBe(false);
    expect(run.files("schedule-3")).toBe(false);
    expect(run.value("form-1040", "line.20")).toBeUndefined();
  });

  it("does not file for a vehicle placed in service in 2024", () => {
    const old = { ...ELAYNE_NEW_VEHICLE, placedInServiceDate: "2024-11-02" };
    const run = evaluate(factsWith({ [NEW_KEY]: old, [USED_KEY]: undefined }));
    expect(run.files("form-8936")).toBe(false);
  });

  it("the explicit decision wins", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_8936", false)];
    expect(evaluate(base.facts, decisions).files("form-8936")).toBe(false);
  });

  it("a fact key needs a slug", () => {
    expect(isCleanVehicleFactKey("clean_vehicle.my-car")).toBe(true);
    expect(isCleanVehicleFactKey("clean_vehicle.")).toBe(false);
    expect(isCleanVehicleFactKey(CLEAN_VEHICLE_KEYS.priorYearFilingStatus)).toBe(false);
  });
});

describe("Form 8936 asks for its answers", () => {
  it("asks for the 2024 AGI and filing status when a vehicle reaches the test", () => {
    const run = evaluate(
      factsWith({
        [PRIOR_YEAR_KEYS.federalAgi]: undefined,
        [CLEAN_VEHICLE_KEYS.priorYearFilingStatus]: undefined,
      }),
    );
    expect(run.missing).toEqual([
      PRIOR_YEAR_KEYS.federalAgi,
      CLEAN_VEHICLE_KEYS.priorYearFilingStatus,
    ]);
    // The new vehicle is under the 2025 limit, but the totals wait for the used one.
    expect(run.line("0.line.9_personal_use_credit_schedule_a")).toBeUndefined();
    expect(run.line("0.line.2_2025_magi")).toBe(158400);
    expect(run.line("0.line.3a_2024_form_1040_line_11")).toBeUndefined();
  });

  it("asks whether someone can claim the taxpayer for a previously owned vehicle", () => {
    const run = evaluate(factsWith({ [CLEAN_VEHICLE_KEYS.claimableAsDependent]: undefined }));
    expect(run.missing).toEqual([CLEAN_VEHICLE_KEYS.claimableAsDependent]);
  });

  it("does not ask the dependent question when the used credit went to the dealer", () => {
    const transferred = { ...ELAYNE_USED_VEHICLE, creditTransferredToDealer: 4000 };
    const run = evaluate(
      factsWith({ [CLEAN_VEHICLE_KEYS.claimableAsDependent]: undefined, [USED_KEY]: transferred }),
    );
    expect(run.missing).toEqual([]);
  });
});

describe("Form 8936 Parts I, III and IV", () => {
  it("2025 under both limits: lines 1a–2 only, lines 3a–5 blank", () => {
    const low = { ...w2Of(W2_ELAYNE), box1: 70000 };
    const run = evaluate(factsWith({ [W2_ELAYNE]: low }));
    expect(run.line("0.line.2_2025_magi")).toBe(132000);
    expect(run.line("0.line.3a_2024_form_1040_line_11")).toBeUndefined();
    expect(run.line("0.line.5_2024_filing_status")).toBeUndefined();
  });

  it("line 12 at zero stops Part III: line 13 and Schedule 3 line 6f blank", () => {
    const facts = factsWith({
      [W2_ELAYNE]: { ...w2Of(W2_ELAYNE), box1: 40000 },
      [W2_GARETH]: { ...w2Of(W2_GARETH), box1: 20000 },
    });
    const run = evaluate(facts);
    const tax = run.line("0.line.10_form_1040_line_18") as number;
    expect(tax).toBeGreaterThan(0);
    expect(tax).toBeLessThan(4000);
    expect(run.line("0.line.18_previously_owned_vehicle_credit")).toBe(tax);
    expect(run.line("0.line.11_personal_credits_form_1040")).toBe(tax);
    expect(run.line("0.line.12_tax_less_personal_credits")).toBe(0);
    expect(run.line("0.line.13_personal_use_credit")).toBeUndefined();
    expect(run.value("schedule-3", "0.line.6f")).toBeUndefined();
    expect(run.value("form-1040", "line.22")).toBe(0);
  });

  it("Puerto Rico income and the 2024 additions reach lines 1b, 2, 3b–3e and 4", () => {
    const run = evaluate(
      base.facts.concat([
        row("other", CLEAN_VEHICLE_KEYS.puertoRicoExcludedIncome, 1200.4),
        row("other", CLEAN_VEHICLE_KEYS.priorYearMagiAdditions, {
          puertoRicoExcluded: 100,
          form2555Line45: 200,
          form2555Line50: 300,
          form4563Line15: 400,
        }),
      ]),
    );
    expect(run.line("0.line.1b_2025_puerto_rico_income_excluded")).toBe(1200);
    expect(run.line("0.line.2_2025_magi")).toBe(159600);
    expect(run.line("0.line.3e_2024_form_4563_line_15")).toBe(400);
    expect(run.line("0.line.4_2024_magi")).toBe(143000);
  });

  it("2024 over the Part IV limit too: no Part IV credit, Schedule 3 line 6m blank", () => {
    const run = evaluate(factsWith({ [PRIOR_YEAR_KEYS.federalAgi]: 151000 }));
    expect(run.line("0.line.14_previously_owned_credit_schedule_a")).toBeUndefined();
    expect(run.value("schedule-3", "0.line.6m")).toBeUndefined();
    expect(run.line("0.line.13_personal_use_credit")).toBe(7500);
  });
});

describe("Form 8936 Parts II and V", () => {
  const commercial: CleanVehicleFactValue = {
    modelYear: 2025,
    make: "Haulwell",
    model: "Cargo E",
    vin: "1HWCARGOE0S000001",
    placedInServiceDate: "2025-05-01",
    acquiredDate: "2025-04-20",
    kind: "commercial",
    acquiredForUse: true,
    depreciable: true,
    poweredByGasOrDiesel: false,
    grossVehicleWeightRating: 9000,
    basis: 52000,
    incrementalCost: 7500,
  };

  it("business use of a new vehicle: lines 6–8, with a K-1 credit on line 7", () => {
    const facts = factsWith({ [NEW_KEY]: { ...ELAYNE_NEW_VEHICLE, businessUsePercent: 30 } }, [
      row("other", CLEAN_VEHICLE_KEYS.k1Credits, { newVehicleCodeAY: 1000 }),
    ]);
    const run = evaluate(facts);
    expect(run.line("0.line.6_business_use_credit_schedule_a")).toBe(2250);
    expect(run.line("0.line.7_new_vehicle_credit_partnerships_s_corps")).toBe(1000);
    expect(run.line("0.line.8_business_investment_use_credit")).toBe(3250);
    expect(run.line("0.line.9_personal_use_credit_schedule_a")).toBe(5250);
  });

  it("a commercial vehicle fills lines 19–21 and leaves Schedule 3 line 6f alone", () => {
    const facts = factsWith({ [USED_KEY]: undefined }, [
      row("other", makeCleanVehicleFactKey("haulwell"), commercial),
      row("other", CLEAN_VEHICLE_KEYS.k1Credits, { commercialCodeAZ: 500 }),
    ]);
    const run = evaluate(facts);
    expect(run.line("0.line.19_commercial_vehicle_credit_schedule_a")).toBe(7500);
    expect(run.line("0.line.20_commercial_credit_partnerships_s_corps")).toBe(500);
    expect(run.line("0.line.21_commercial_vehicle_credit_total")).toBe(8000);
    expect(run.value("schedule-3", "0.line.6f")).toBe(7500);
  });
});

describe("Form 8936 gaps", () => {
  it("Form 2555 files: lines 1c, 1d and 2 are gaps, and so is Schedule 3 line 6f", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_2555", true),
    ]);
    expect(isGap(run.field("form-8936", "0.line.1c_2025_form_2555_line_45"))).toBe(true);
    expect(isGap(run.field("form-8936", "0.line.2_2025_magi"))).toBe(true);
    expect(isGap(run.field("schedule-3", "0.line.6f"))).toBe(true);
  });

  it("Form 8863 files: line 11 is a gap", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8863", true),
    ]);
    expect(isGap(run.field("form-8936", "0.line.11_personal_credits_form_1040"))).toBe(true);
    expect(run.line("0.line.9_personal_use_credit_schedule_a")).toBe(7500);
  });

  it("a vehicle fact without line 9 is a gap on the totals", () => {
    const run = evaluate(
      factsWith({ [NEW_KEY]: { ...ELAYNE_NEW_VEHICLE, tentativeCredit: undefined } }),
    );
    expect(isGap(run.field("form-8936", "0.line.9_personal_use_credit_schedule_a"))).toBe(true);
  });

  it("the gap reaches a credit limit worksheet that adds lines 6f and 6m", () => {
    const info = {
      mustFile: {
        "form-8936": { value: true },
        "form-8863": { value: true },
      },
      filingStatus: "married_filing_jointly",
      cleanVehicles: [{ key: NEW_KEY, value: ELAYNE_NEW_VEHICLE }],
      cleanVehicleAnswers: {},
    } as unknown as Form8936FilingInfo;
    const form = { "form-1040.line.11a": 158400, "form-1040.line.18": 17746 };
    expect(cleanVehicleCreditGap(form, info)).toContain("Form 8863");
    const files = {
      ...info,
      mustFile: { "form-8936": { value: true } },
    } as unknown as Form8936FilingInfo;
    expect(cleanVehicleCreditGap(form, files)).toBeUndefined();
  });
});

describe("Schedule 2 lines 1b and 1c (birgitte)", () => {
  it("repays both transferred credits, and Form 1040 line 17 takes them", () => {
    const result = evaluateScenario({
      filing: { id: "birgitte-test", taxYear: birgitteScenario.taxYear },
      facts: birgitteScenario.facts,
      decisions: birgitteScenario.decisions,
      authEmail: null,
    });
    const get = (formId: string, id: string) => {
      const found = result.forms.get(formId)?.fields.find((each) => each.fieldId === id)?.result;
      return found?.ok ? found.value : undefined;
    };
    expect(get("schedule-2", "schedule-2.0.line.1b_new_clean_vehicle_credit_repayment")).toBe(7500);
    expect(
      get("schedule-2", "schedule-2.0.line.1c_previously_owned_clean_vehicle_credit_repayment"),
    ).toBe(4000);
    expect(get("form-1040", "form-1040.line.17")).toBe(11500);
  });
});
