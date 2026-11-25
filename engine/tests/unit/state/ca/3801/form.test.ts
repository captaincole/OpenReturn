/*
 * FTB 3801 on a whole return: who files (ca-3801-inst-2025::sec::b-who-must-file::b01),
 * what it asks, Schedule CA (540) line 5 (ca-3801-inst-2025::sec::individuals::b01),
 * the gaps, and returns where nothing changes. The synthetic noal scenario is
 * the base; K-1 facts come from the lan and cadsuane scenarios.
 */

import { describe, expect, it } from "vitest";
import {
  makeCaPassiveCarryoverKey,
  makeRentalFactKey,
  makeW2FactKey,
  SPOUSE_KEYS,
} from "../../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../../src/facts/rows.js";
import { MAGI_WITH_K1_GAP } from "../../../../../src/federal/8582/magiGap.js";
import { evaluateScenario, pendingInputs } from "../../../../../src/index.js";
import { ADOPTION_GAP } from "../../../../../src/state/ca/3801/context.js";
import {
  K1_WORKSHEET_GAP,
  NONRESIDENT_GAP,
  PASSIVE_BUSINESS_GAP,
  PASSIVE_K1_GAP,
} from "../../../../../src/state/ca/3801/formScope.js";
import { RENTAL_WITHOUT_3801_GAP } from "../../../../../src/state/ca/schedule-ca/activities.js";
import { decisionRow } from "../../../../helpers/fixtureBuilders.js";
import { cadsuaneScenario } from "../../../../scenarios/synthetic/cadsuane/index.js";
import { lanScenario } from "../../../../scenarios/synthetic/lan/index.js";
import { noalScenario as base } from "../../../../scenarios/synthetic/noal/index.js";

const HOUSE = makeRentalFactKey("oriole-house");
const DUPLEX = makeRentalFactKey("davis-duplex");
const ROYALTY = makeRentalFactKey("mineral-royalty");
const W2 = makeW2FactKey("delta-water");

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const factOf = (key: string) => base.facts.find((fact) => fact.key === key)!;

function factsWith(
  replace: Record<string, unknown> = {},
  drop: string[] = [],
  add: TaxFactRow[] = [],
): TaxFactRow[] {
  return [
    ...base.facts
      .filter((fact) => !drop.includes(fact.key))
      .map((fact) => (fact.key in replace ? { ...fact, value: replace[fact.key] } : fact)),
    ...add,
  ];
}

function decisionsWith(changes: Record<string, unknown> = {}): AIDecisionRow[] {
  const kept = base.decisions.filter((entry) => !(entry.decisionKey in changes));
  return [...kept, ...Object.entries(changes).map(([key, value]) => decision(key, value))];
}

type Result = { ok: boolean; value?: unknown; unsupported?: boolean; reason?: string };

function run(facts: TaxFactRow[] = base.facts, decisions: AIDecisionRow[] = base.decisions) {
  const scenario = evaluateScenario({
    filing: { id: base.name, taxYear: base.taxYear },
    facts,
    decisions,
    authEmail: null,
  });
  const result = (fieldId: string): Result | undefined => {
    const form = scenario.forms.get(fieldId.slice(0, fieldId.indexOf(".")));
    return form?.fields.find((field) => field.fieldId === fieldId)?.result as Result | undefined;
  };
  const value = (fieldId: string) => {
    const found = result(fieldId);
    return found?.ok ? found.value : undefined;
  };
  const files = (formId: string) => {
    const mustFile = scenario.forms.get(formId)?.mustFile;
    return mustFile?.ok ? mustFile.value : undefined;
  };
  return { scenario, result, value, files, pending: pendingInputs(scenario) };
}

const LINE_5_C = "schedule-ca.0.line.b5_additions";
const LINE_5_B = "schedule-ca.0.line.b5_subtractions";
const LINE_2E = "form-3801.1.adjustment_worksheet.2e_schedule_e_california_adjustment";
const LINE_2D = "form-3801.1.adjustment_worksheet.2d_schedule_e_total_federal_amount";
const LINE_3 = "form-3801.0.line.3_total_passive_income_or_loss";
const LINE_6 = "form-3801.0.line.6_federal_modified_agi";

describe("FTB 3801 must-file", () => {
  it("files on a California return for a passive rental with a California loss", () => {
    const { scenario, files } = run();
    expect(files("form-3801")).toBe(true);
    const derivation = scenario.forms.get("form-3801")?.mustFileDerivation;
    expect(derivation?.triggeredByFactKeys).toContain(HOUSE);
  });

  it("does not file without a California return", () => {
    const { files } = run(base.facts, decisionsWith({ "decisions.scope.must_file_ca_540": false }));
    expect(files("form-3801")).toBe(false);
  });

  it("does not file for passive rentals with only gains and no carryover", () => {
    const gains = {
      ...(factOf(HOUSE).value as object),
      rentsReceived: 40000,
      priorYearUnallowedLoss: 0,
    };
    const { files, value } = run(
      factsWith({ [HOUSE]: gains, [makeCaPassiveCarryoverKey(HOUSE)]: 0 }, [
        DUPLEX,
        makeCaPassiveCarryoverKey(DUPLEX),
      ]),
    );
    expect(files("form-3801")).toBe(false);
    // Schedule CA line 5 takes the FTB 3885A difference alone (sched-ca line-5 b02).
    expect(value(LINE_5_C)).toBe(1500);
  });

  it("the explicit decision wins; line 5 then says why it is blank", () => {
    const { files, result } = run(
      base.facts,
      decisionsWith({ "decisions.scope.must_file_3801": false }),
    );
    expect(files("form-3801")).toBe(false);
    expect(result(LINE_5_C)).toMatchObject({ unsupported: true, reason: RENTAL_WITHOUT_3801_GAP });
  });

  it("asks for a California carryover when the property has a federal one", () => {
    const { pending, value } = run(factsWith({}, [makeCaPassiveCarryoverKey(HOUSE)]));
    expect(pending.pendingFacts).toContain(makeCaPassiveCarryoverKey(HOUSE));
    expect(value(LINE_3)).toBeUndefined();
  });

  // irs-8582-inst-2025::sec::part-iv-2::b02: column (c) comes from last year's form, not the federal one.
  it("asks for it when the property has no federal carryover; line 5 waits", () => {
    const { pending, value, files } = run(factsWith({}, [makeCaPassiveCarryoverKey(ROYALTY)]));
    expect(pending.pendingFacts).toContain(makeCaPassiveCarryoverKey(ROYALTY));
    expect(files("form-3801")).toBe(true);
    expect(value(LINE_3)).toBeUndefined();
    expect(value(LINE_5_C)).toBeUndefined();
  });
});

describe("FTB 3801 on the noal return", () => {
  it("2(e) goes to Schedule CA line 5 column C; 2(d) is line 5 column A", () => {
    const { value } = run();
    expect(value(LINE_2E)).toBe(500);
    expect(value(LINE_5_C)).toBe(500);
    expect(value(LINE_5_B)).toBeUndefined();
    expect(value(LINE_2D)).toBe(value("schedule-ca.0.line.b5_federal"));
  });

  it("married filing separately, lived together: Part IV is empty and line 9 is 0", () => {
    const own = (key: string) => ({ ...(factOf(key).value as object), owner: "taxpayer" });
    const livedTogether: TaxFactRow = {
      ...factOf(HOUSE),
      id: "lived",
      key: SPOUSE_KEYS.livedApartAllYear,
      category: "filing_status",
      value: false,
    };
    const { value } = run(
      factsWith({ [HOUSE]: own(HOUSE), [DUPLEX]: own(DUPLEX) }, [], [livedTogether]),
      decisionsWith({ "decisions.scope.filing_status": "married_filing_separately" }),
    );
    expect(value("form-3801.0.line.1d_rental_real_estate_combined")).toBeUndefined();
    expect(value(LINE_3)).toBe(-9500);
    expect(value("form-3801.0.line.9_special_allowance")).toBe(0);
    expect(value("form-3801.0.line.4_smaller_of_1d_or_3_loss")).toBeUndefined();
  });
});

describe("FTB 3801 gaps", () => {
  const k1Facts = (facts: TaxFactRow[]) => facts.filter((fact) => fact.key.startsWith("k1."));

  it("a nonpassive K-1: the Schedule E worksheet and line 6 are gaps, Part I still prints", () => {
    const { result, value } = run(factsWith({}, [], k1Facts(lanScenario.facts)));
    expect(value(LINE_3)).toBe(-9500);
    expect(result(LINE_6)).toMatchObject({ unsupported: true, reason: MAGI_WITH_K1_GAP });
    expect(result(LINE_2E)).toMatchObject({ unsupported: true, reason: K1_WORKSHEET_GAP });
    expect(result(LINE_5_C)).toMatchObject({ unsupported: true, reason: K1_WORKSHEET_GAP });
  });

  it("a nonpassive K-1: no number prints on line 6 or anything after it, nor on line 5", () => {
    const { scenario, result } = run(factsWith({}, [], k1Facts(lanScenario.facts)));
    const fields = scenario.forms.get("form-3801")?.fields ?? [];
    const readsLine6OrWorksheet = (fieldId: string) =>
      ["line.6", "line.7", "line.8", "line.9", "line.11"].some((line) =>
        fieldId.startsWith(`form-3801.0.${line}_`),
      ) ||
      [
        "2.part6.",
        "2.part7.",
        "2.part8.",
        "1.adjustment_worksheet.schedule_e",
        "1.adjustment_worksheet.2",
      ].some((prefix) => fieldId.startsWith(`form-3801.${prefix}`));
    const printed = fields.filter(
      (field) =>
        readsLine6OrWorksheet(field.fieldId) &&
        (field.result as Result).ok &&
        typeof (field.result as Result).value === "number",
    );
    expect(fields.filter((field) => readsLine6OrWorksheet(field.fieldId)).length).toBe(129);
    expect(printed.map((field) => field.fieldId)).toEqual([]);
    for (const fieldId of [LINE_5_B, LINE_5_C]) {
      expect(result(fieldId)).toMatchObject({ unsupported: true, reason: K1_WORKSHEET_GAP });
    }
  });

  it("a passive K-1 makes the whole form a gap", () => {
    const { result } = run(factsWith({}, [], k1Facts(cadsuaneScenario.facts)));
    expect(result(LINE_3)).toMatchObject({ unsupported: true, reason: PASSIVE_K1_GAP });
    expect(result(LINE_5_C)).toMatchObject({ unsupported: true, reason: PASSIVE_K1_GAP });
  });

  it("excluded adoption benefits make line 6 a gap", () => {
    const w2 = factOf(W2).value as Record<string, unknown>;
    const { result } = run(factsWith({ [W2]: { ...w2, box12: [{ code: "T", amount: 2000 }] } }));
    expect(result(LINE_6)).toMatchObject({ unsupported: true, reason: ADOPTION_GAP });
    expect(result("form-3801.0.line.4_smaller_of_1d_or_3_loss")?.ok).toBe(true);
  });

  it("a nonresident return is a gap", () => {
    const { result } = run(
      base.facts,
      decisionsWith({
        "decisions.scope.must_file_ca_540": false,
        "decisions.scope.must_file_540nr": true,
      }),
    );
    expect(result(LINE_3)).toMatchObject({ unsupported: true, reason: NONRESIDENT_GAP });
  });

  it("a passive Schedule C business is a gap", () => {
    const business: TaxFactRow = {
      ...factOf(HOUSE),
      id: "biz",
      category: "self_employment",
      key: "business.bakery",
      value: {
        owner: "taxpayer",
        name: "Corner Bakery",
        activity: "Bakery",
        accountingMethod: "cash",
        materiallyParticipated: false,
        startedThisYear: false,
        paymentsRequire1099: false,
        sellsGoods: false,
        grossReceipts: 5000,
        allInvestmentAtRisk: true,
      },
    };
    const { result } = run(factsWith({}, [], [business]));
    expect(result(LINE_3)).toMatchObject({ unsupported: true, reason: PASSIVE_BUSINESS_GAP });
  });
});

describe("no FTB 3801 facts, nothing changes", () => {
  it("a California return with no rentals files no FTB 3801 and leaves line 5 blank", () => {
    const { files, value } = run(
      factsWith({}, [
        HOUSE,
        DUPLEX,
        ROYALTY,
        makeCaPassiveCarryoverKey(HOUSE),
        makeCaPassiveCarryoverKey(DUPLEX),
        "rental.real_estate_professional",
        "rental.payments_require_1099",
      ]),
    );
    expect(files("form-3801")).toBe(false);
    expect(value(LINE_5_B)).toBeUndefined();
    expect(value(LINE_5_C)).toBeUndefined();
    expect(value("form-540.line.17_ca_agi")).toBe(138000);
  });
});
