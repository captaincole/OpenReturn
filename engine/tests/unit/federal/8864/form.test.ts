/*
 * Form 8864 on a whole return: who files, each line, the gaps, Schedule C line
 * 6, Form 6251 line 3 and Form 3800 lines 1l and 1ff. The synthetic nela
 * scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeAgriBiodieselFactKey,
  makeBusinessFactKey,
  makeCleanFuelFacilityFactKey,
  makeGeneralBusinessCreditFactKey,
  makeK1BiodieselCreditKey,
  makeK1HoldingFactKey,
  type AgriBiodieselProductionFactValue,
  type BusinessFactValue,
  type CleanFuelFacilityFactValue,
  type K1BiodieselCreditAnswer,
  type PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { TWO_CREDITS_GAP } from "../../../../src/federal/8864/figures.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { biorefinery } from "../../../scenarios/synthetic/abell/facts.js";
import {
  CRUSH_ID,
  CRUSH_K1_KEY,
  HAULING_ID,
  HAULING_KEY,
  crushK1,
  crushStatement,
  hauling,
  yardProduction,
} from "../../../scenarios/synthetic/nela/facts.js";
import { nelaScenario as base } from "../../../scenarios/synthetic/nela/index.js";

const PRODUCTION_KEY = makeAgriBiodieselFactKey(HAULING_ID);
const ANSWER_KEY = makeK1BiodieselCreditKey(CRUSH_K1_KEY);
const HOLDING_KEY = makeK1HoldingFactKey(CRUSH_ID);
const MUST_FILE = "decisions.scope.must_file_8864";

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

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const production = (value: Partial<AgriBiodieselProductionFactValue>) => ({
  [PRODUCTION_KEY]: { ...yardProduction, ...value },
});
const answer = (value: Partial<K1BiodieselCreditAnswer>) => ({
  [ANSWER_KEY]: { ...crushStatement, ...value },
});
const k1 = (value: Partial<PartnershipK1FactValue>) => ({
  [CRUSH_K1_KEY]: { ...crushK1, ...value },
});
const noK1 = { [CRUSH_K1_KEY]: undefined, [ANSWER_KEY]: undefined, [HOLDING_KEY]: undefined };

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8864-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-8864", id);
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const LA = "0.header.a_transfer_election_registration_number";
const L7A = "0.line.7_agri_biodiesel_before_july_col_a";
const L7C = "0.line.7_agri_biodiesel_before_july_col_c";
const L8A = "0.line.8_agri_biodiesel_after_june_col_a";
const L8C = "0.line.8_agri_biodiesel_after_june_col_c";
const L9 = "0.line.9_total_agri_biodiesel_credit";
const L10 = "0.line.10_credit_from_pass_through_entities";
const L11 = "0.line.11_add_lines_9_10";
const L12 = "0.line.12_allocated_to_patrons_beneficiaries";
const L13 = "0.line.13_cooperative_estate_trust_credit";
const DIESEL_E = "2.part3.1l_form_8864_diesel_col_e";
const DIESEL_F = "2.part3.1l_form_8864_diesel_col_f";
const SAF_E = "2.part3.1ff_form_8864_saf_col_e";
const SCHEDULE_C_6 = "0.line.6";
const AMT_3 = "0.line.3_other_adjustments";

describe("the nela return", () => {
  const out = evaluate(base.facts);

  it("fills every line an individual fills", () => {
    expect(out.files("form-8864")).toBe(true);
    expect(out.line(LA)).toBe("AGB25-0104857");
    expect(out.line(L7A)).toBe(61480);
    expect(out.line(L7C)).toBe(6148);
    expect(out.line(L8A)).toBe(74215);
    expect(out.line(L8C)).toBe(14843);
    expect(out.line(L9)).toBe(20991);
    expect(out.line(L10)).toBe(4180);
    expect(out.line(L11)).toBe(25171);
    expect(out.missing("form-8864")).toEqual([]);
  });

  it("lines 12 and 13 are for cooperatives, estates and trusts: blank", () => {
    for (const id of [L12, L13]) {
      expect(out.line(id)).toBeUndefined();
      expect(isGap(out.field("form-8864", id))).toBe(false);
    }
  });

  it("line 9 is Schedule C line 6 income and Form 6251 line 3 takes it back", () => {
    expect(out.value("schedule-c", SCHEDULE_C_6)).toBe(20991);
    expect(out.value("form-6251", AMT_3)).toBe(-20991);
  });

  it("Form 3800 line 1l takes line 9 and the K-1's agri-biodiesel part; line 1ff the SAF part", () => {
    expect(out.value("form-3800", DIESEL_E)).toBe(20991 + 2880);
    expect(out.value("form-3800", DIESEL_F)).toBe(-5000);
    expect(out.value("form-3800", SAF_E)).toBe(1300);
  });
});

describe("no facts, nothing changes", () => {
  const without = evaluate(factsWith({ [PRODUCTION_KEY]: undefined, ...noK1 }));

  it("Form 8864 does not file and Schedule C keeps its stated other income", () => {
    expect(without.files("form-8864")).toBe(false);
    expect(without.value("schedule-c", SCHEDULE_C_6)).toBeUndefined();
    expect(without.value("form-6251", AMT_3)).toBeUndefined();
    expect(without.value("form-3800", DIESEL_E)).toBeUndefined();
  });

  it("stated other income stays the same with no production", () => {
    const stated = evaluate(
      factsWith({
        [PRODUCTION_KEY]: undefined,
        ...noK1,
        [HAULING_KEY]: { ...hauling, otherIncome: 750 },
      }),
    );
    expect(stated.value("schedule-c", SCHEDULE_C_6)).toBe(750);
  });
});

describe("who files", () => {
  it("the decision false keeps it off the return, and line 1l is a gap", () => {
    const out = evaluate(base.facts, [...base.decisions, decision(MUST_FILE, false)]);
    expect(out.files("form-8864")).toBe(false);
    expect(isGap(out.field("form-3800", DIESEL_E))).toBe(true);
  });

  it("a K-1 alone does not file it, and its credit still reaches Form 3800", () => {
    const out = evaluate(factsWith({ [PRODUCTION_KEY]: undefined }));
    expect(out.files("form-8864")).toBe(false);
    expect(out.value("form-3800", DIESEL_E)).toBe(2880);
    expect(out.value("form-3800", SAF_E)).toBe(1300);
    expect(out.value("schedule-c", SCHEDULE_C_6)).toBeUndefined();
  });

  it("with the decision true, a K-1 alone fills line 10 and line 11", () => {
    const out = evaluate(factsWith({ [PRODUCTION_KEY]: undefined }), [
      ...base.decisions,
      decision(MUST_FILE, true),
    ]);
    expect(out.files("form-8864")).toBe(true);
    expect(out.line(L9)).toBeUndefined();
    expect(out.line(L10)).toBe(4180);
    expect(out.line(L11)).toBe(4180);
  });

  it("a producer not registered on Form 637 claims nothing", () => {
    const out = evaluate(factsWith(production({ registeredOnForm637: false })));
    expect(out.files("form-8864")).toBe(false);
    expect(out.value("schedule-c", SCHEDULE_C_6)).toBeUndefined();
  });

  it("the capacity limit: 60 million gallons files, one more does not", () => {
    const at = evaluate(factsWith(production({ productiveCapacityGallons: 60_000_000 })));
    expect(at.files("form-8864")).toBe(true);
    const over = evaluate(factsWith(production({ productiveCapacityGallons: 60_000_001 })));
    expect(over.files("form-8864")).toBe(false);
  });
});

describe("the lines", () => {
  it("a year with no gallons before July 1 leaves line 7 blank", () => {
    const out = evaluate(factsWith(production({ gallonsBeforeJuly: 0 })));
    expect(out.line(L7A)).toBeUndefined();
    expect(out.line(L7C)).toBeUndefined();
    expect(out.line(L9)).toBe(14843);
  });

  it("no transfer election leaves line A blank and column (f) empty", () => {
    const out = evaluate(factsWith(production({ transfer: undefined })));
    expect(out.line(LA)).toBeUndefined();
    expect(out.value("form-3800", DIESEL_F)).toBeUndefined();
  });

  it("a cooperative's stated credit with its EIN adds to line 10", () => {
    const coop = row("other", makeGeneralBusinessCreditFactKey("plains-coop"), {
      sourceForm: "8864 diesel",
      line: "1l",
      amount: 640,
      passive: false,
      passThroughEin: "00-0001864",
    });
    const out = evaluate(factsWith({}, [coop]));
    expect(out.line(L10)).toBe(4180 + 640);
    expect(out.line(L11)).toBe(20991 + 4180 + 640);
  });
});

describe("the gaps", () => {
  it("more than 15 million gallons: lines 7 to 9, Schedule C line 6 and Form 6251 line 3", () => {
    const out = evaluate(
      factsWith(production({ gallonsBeforeJuly: 8_000_000, gallonsAfterJune: 7_000_001 })),
    );
    expect(isGap(out.field("form-8864", L7A))).toBe(true);
    expect(isGap(out.field("form-8864", L9))).toBe(true);
    expect(isGap(out.field("form-8864", L11))).toBe(true);
    expect(isGap(out.field("schedule-c", SCHEDULE_C_6))).toBe(true);
    expect(isGap(out.field("form-6251", AMT_3))).toBe(true);
    expect(isGap(out.field("form-3800", DIESEL_E))).toBe(true);
  });

  it("own production and a K-1 statement together over 15 million gallons", () => {
    const out = evaluate(
      factsWith(production({ gallonsBeforeJuly: 7_000_000, gallonsAfterJune: 7_990_000 })),
    );
    expect(isGap(out.field("form-8864", L9))).toBe(true);
    expect(isGap(out.field("form-8864", L10))).toBe(true);
    expect(isGap(out.field("form-3800", DIESEL_E))).toBe(true);
  });

  it("a business that is not on the return", () => {
    const out = evaluate(factsWith(production({ businessKey: makeBusinessFactKey("elsewhere") })));
    expect(isGap(out.field("form-8864", L9))).toBe(true);
    expect(isGap(out.field("form-3800", DIESEL_E))).toBe(true);
  });

  it("a business the owner does not materially participate in: line 1l", () => {
    const passive: BusinessFactValue = { ...hauling, materiallyParticipated: false };
    const out = evaluate(factsWith({ [HAULING_KEY]: passive }));
    expect(out.line(L9)).toBe(20991);
    expect(isGap(out.field("form-3800", DIESEL_E))).toBe(true);
  });

  it("a transfer of more than the credit for fuel after June 30: line 1l", () => {
    const out = evaluate(
      factsWith(production({ transfer: { registrationNumber: "AGB25-0104857", amount: 14844 } })),
    );
    expect(isGap(out.field("form-3800", DIESEL_E))).toBe(true);
  });

  it("two registration numbers do not fit line A", () => {
    const second = "quarrendine-ag";
    const farmBusiness = row("self_employment", makeBusinessFactKey(second), {
      ...hauling,
      name: "Quarrendine Ag Services",
    });
    const farmProduction = row("self_employment", makeAgriBiodieselFactKey(second), {
      ...yardProduction,
      businessKey: makeBusinessFactKey(second),
      transfer: { registrationNumber: "AGB25-0200001", amount: 100 },
    });
    const out = evaluate(factsWith({}, [farmBusiness, farmProduction]));
    expect(isGap(out.field("form-8864", LA))).toBe(true);
    expect(out.line(L9)).toBe(2 * 20991);
  });

  it("a stated line 1l credit with no EIN next to a production fact: line 1l", () => {
    const own = row("other", makeGeneralBusinessCreditFactKey("own-biodiesel"), {
      sourceForm: "8864 diesel",
      line: "1l",
      amount: 20991,
      passive: false,
    });
    const out = evaluate(factsWith({}, [own]));
    expect(isGap(out.field("form-3800", DIESEL_E))).toBe(true);
  });

  it("a K-1 that prints STMT for code AC: line 10 and the K-1's source", () => {
    const out = evaluate(
      factsWith(
        k1({
          boxes: [
            { box: "1", amount: 6500 },
            { box: "15", code: "AC" },
          ],
        }),
      ),
    );
    expect(isGap(out.field("form-8864", L10))).toBe(true);
    expect(isGap(out.field("form-3800", DIESEL_E))).toBe(true);
  });

  it("a SAF part larger than the code AC amount", () => {
    const out = evaluate(factsWith(answer({ safCredit: 5000 })));
    expect(isGap(out.field("form-3800", DIESEL_E))).toBe(true);
  });
});

describe("missing answers", () => {
  it("the K-1 answer is asked by Form 8864 and Form 3800", () => {
    const out = evaluate(factsWith({ [ANSWER_KEY]: undefined }));
    expect(out.missing("form-8864")).toContain(ANSWER_KEY);
    expect(out.missing("form-3800")).toContain(ANSWER_KEY);
  });

  it("a malformed production fact is asked again", () => {
    const out = evaluate(factsWith({ [PRODUCTION_KEY]: { businessKey: HAULING_KEY } }));
    expect(out.files("form-8864")).toBe(true);
    expect(out.missing("form-8864")).toContain(PRODUCTION_KEY);
  });

  it("no SAF and no statement: the whole code AC amount is line 1l", () => {
    const out = evaluate(factsWith({ [ANSWER_KEY]: { safCredit: 0 } }));
    expect(out.value("form-3800", DIESEL_E)).toBe(20991 + 4180);
    expect(out.value("form-3800", SAF_E)).toBeUndefined();
  });
});

describe("one gallon, two credits (line-7::b01, irs-7218-inst-2025::sec::emissions-factor::b05)", () => {
  const facility = (value: Partial<CleanFuelFacilityFactValue>) =>
    row("other", makeCleanFuelFacilityFactKey("hereford-biorefinery"), {
      ...biorefinery,
      ...value,
    });
  const gapReason = (result: unknown) => (result as { reason?: string } | undefined)?.reason;

  it("line 7 gallons and a Form 7218 facility that sold biodiesel before July: lines 7 to 9 are a gap", () => {
    const out = evaluate(factsWith({}, [facility({})]));
    expect(isGap(out.field("form-8864", L7C))).toBe(true);
    expect(gapReason(out.field("form-8864", L7C))).toBe(TWO_CREDITS_GAP);
    expect(isGap(out.field("form-8864", L9))).toBe(true);
    expect(isGap(out.field("form-8864", L11))).toBe(true);
    expect(isGap(out.field("schedule-c", SCHEDULE_C_6))).toBe(true);
    expect(isGap(out.field("form-3800", DIESEL_E))).toBe(true);
  });

  it("a facility placed in service after June 30, 2025: no gap", () => {
    const out = evaluate(factsWith({}, [facility({ placedInService: "2025-07-01" })]));
    expect(out.line(L9)).toBe(20991);
  });

  it("no line 7 gallons: no gap", () => {
    const out = evaluate(factsWith(production({ gallonsBeforeJuly: 0 }), [facility({})]));
    expect(out.line(L9)).toBe(14843);
  });

  it("a facility with no biodiesel sale: no gap", () => {
    const sales = biorefinery.sales.filter(
      (sale) => !sale.fuelType.toLowerCase().includes("biodiesel"),
    );
    const out = evaluate(factsWith({}, [facility({ sales })]));
    expect(out.line(L9)).toBe(20991);
  });
});
