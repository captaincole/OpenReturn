/*
 * Form 7210 on a whole return: who files, the copies, line 11, the waits, the
 * gaps and Form 3800 line 1g. The synthetic rand scenario is the base; natti
 * (no hydrogen facility) checks that nothing else changes.
 */

import { describe, expect, it } from "vitest";
import {
  makeCleanHydrogenFacilityFactKey,
  makeGeneralBusinessCreditFactKey,
  makeInvestmentCreditPropertyFactKey,
  makePartnershipK1FactKey,
  type CleanHydrogenFacilityFactValue,
  type InvestmentCreditPropertyFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { form7210Bindings } from "../../../../src/federal/7210/bindings.js";
import catalogJson from "../../../../src/federal/7210/catalog.json";
import { K1_ONLY_COPY, resolve7210Info } from "../../../../src/federal/7210/resolveInfo.js";
import { evaluateScenario } from "../../../../src/index.js";
import { makeResolverInputs } from "../../../../src/resolverInputs.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { nattiScenario as natti } from "../../../scenarios/synthetic/natti/index.js";
import {
  FACILITY_KEY,
  PARTNERS_ID,
  facility,
  partnersK1,
} from "../../../scenarios/synthetic/rand/facts.js";
import { randScenario as base } from "../../../scenarios/synthetic/rand/index.js";

const LINE_1G = "2.part3.1g_form_7210_col_e";

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

const changed = (value: Partial<CleanHydrogenFacilityFactValue>) => ({
  [FACILITY_KEY]: { ...facility, ...value },
});

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-7210-test", taxYear: base.taxYear },
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
  const missing = (formId: string) => result.forms.get(formId)?.missingInputs ?? [];
  return { files, field, value, missing, line: (id: string) => value("form-7210", id) };
}

const infoOf = (facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) =>
  resolve7210Info(makeResolverInputs({ facts, decisions }));

describe("the bindings", () => {
  it("bind every catalog field", () => {
    const bound = Object.keys(form7210Bindings()).sort();
    const fields = catalogJson.fields.map((each) => each.fieldId.slice("form-7210.".length)).sort();
    expect(bound).toEqual(fields);
  });
});

describe("who files Form 7210", () => {
  it("a facility with a 2025 credit files it, and line 12 reaches Form 3800 line 1g", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-7210")).toBe(true);
    expect(run.line("0.line.10_increased_credit_amount")).toBe(40_610);
    expect(run.line("0.line.12_clean_hydrogen_credit")).toBe(43_360);
    expect(run.value("form-3800", LINE_1G)).toBe(43_360);
  });

  it("a K-1 alone files no Form 7210; Form 3800 line 1g still takes it", () => {
    const run = evaluate(factsWith({ [FACILITY_KEY]: undefined }));
    expect(run.files("form-7210")).toBe(false);
    expect(run.value("form-3800", LINE_1G)).toBe(2_750);
  });

  it("the decision true with only a K-1: one form with lines 11 and 12", () => {
    const facts = factsWith({ [FACILITY_KEY]: undefined });
    const decisions = [...base.decisions, decision("decisions.scope.must_file_7210", true)];
    const info = infoOf(facts, decisions);
    expect(info.form7210Copies?.map((copy) => copy.key)).toEqual([K1_ONLY_COPY]);
    const run = evaluate(facts, decisions);
    expect(run.line("0.line.11_credit_from_partnerships_s_corps")).toBe(2_750);
    expect(run.line("0.line.12_clean_hydrogen_credit")).toBe(2_750);
    expect(run.line("0.line.10_increased_credit_amount")).toBeUndefined();
    expect(run.value("form-3800", LINE_1G)).toBe(2_750);
  });

  it("the decision false: no Form 7210 and no facility credit on Form 3800", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_7210", false)];
    const run = evaluate(base.facts, decisions);
    expect(run.files("form-7210")).toBe(false);
    expect(run.value("form-3800", LINE_1G)).toBe(2_750);
  });

  it("a section 45Q credit at the facility: no Form 7210", () => {
    const run = evaluate(factsWith(changed({ carbonCaptureCredit: true })));
    expect(run.files("form-7210")).toBe(false);
    expect(run.value("form-3800", LINE_1G)).toBe(2_750);
  });
});

describe("the copies", () => {
  const second: CleanHydrogenFacilityFactValue = {
    ...facility,
    address: "12 Refinery Row, Baytown, TX 77520",
    coordinates: undefined,
    processes: [{ emissionsRate: 0.3, kilograms: 1_000 }],
    financing: undefined,
    prevailingWageMet: false,
    transfer: undefined,
  };
  const SECOND_KEY = makeCleanHydrogenFacilityFactKey("baytown");

  it("one copy for each facility; line 11 only on the first", () => {
    const facts = factsWith({}, [row("other", SECOND_KEY, second)]);
    const info = infoOf(facts);
    expect(info.form7210Copies?.map((copy) => copy.key)).toEqual([FACILITY_KEY, SECOND_KEY]);
    const bindings = form7210Bindings();
    const copy2 = { ...info, form7210CopyIndex: 1 };
    expect(bindings["0.line.10_increased_credit_amount"]!({}, copy2)).toBe(637);
    expect(bindings["0.line.11_credit_from_partnerships_s_corps"]!({}, copy2)).toBeUndefined();
    expect(bindings["0.line.12_clean_hydrogen_credit"]!({}, copy2)).toBe(637);
    expect(bindings["0.header.a_i_emissions_value_rate"]!({}, copy2)).toBe("0.3");
    expect(evaluate(facts).value("form-3800", LINE_1G)).toBe(43_360 + 637);
  });
});

describe("the waits and the gaps", () => {
  it("a missing line 5 answer lists the facility; Form 3800 waits too", () => {
    const run = evaluate(factsWith(changed({ prevailingWageMet: undefined })));
    expect(run.missing("form-7210")).toContain(FACILITY_KEY);
    expect(run.missing("form-3800")).toContain(FACILITY_KEY);
    expect(run.line("0.line.7_credit_before_reduction")).toBeUndefined();
    expect(run.line("0.line.12_clean_hydrogen_credit")).toBeUndefined();
  });

  it("a K-1 code Y with no amount is a gap on lines 11 and 12", () => {
    const boxes = partnersK1.boxes.map((box) =>
      box.code === "Y" ? { box: "15", code: "Y" } : box,
    );
    const k1 = { ...partnersK1, boxes };
    const run = evaluate(factsWith({ [makePartnershipK1FactKey(PARTNERS_ID)]: k1 }));
    expect(isGap(run.field("form-7210", "0.line.11_credit_from_partnerships_s_corps"))).toBe(true);
    expect(isGap(run.field("form-7210", "0.line.12_clean_hydrogen_credit"))).toBe(true);
  });

  it("a Form 3468 Section M property at the same address: both are not claimed", () => {
    const property: InvestmentCreditPropertyFactValue = {
      facility: {
        propertyType: "Clean hydrogen",
        address: facility.address,
        constructionBegan: "2023-05-15",
        placedInService: "2025-03-01",
        prevailingWage: "yes_48_48e",
      },
      credit: {
        part: "energy",
        investment: { property: { section: "clean_hydrogen", basis: 1_000_000, tier: "a" } },
      },
      passive: false,
    };
    const extra = row("other", makeInvestmentCreditPropertyFactKey("h2"), property);
    const run = evaluate(factsWith({}, [extra]));
    expect(isGap(run.field("form-7210", "0.line.12_clean_hydrogen_credit"))).toBe(true);
    expect(isGap(run.field("form-3800", LINE_1G))).toBe(true);
  });

  it("a stated Form 7210 credit on Form 3800 line 1g is a gap: the engine figures it", () => {
    const stated = row("other", makeGeneralBusinessCreditFactKey("hydrogen"), {
      sourceForm: "7210",
      line: "1g",
      amount: 5_000,
      passive: false,
    });
    const run = evaluate(factsWith({ [FACILITY_KEY]: undefined }, [stated]));
    expect(isGap(run.field("form-3800", LINE_1G))).toBe(true);
  });
});

describe("no facts, nothing changes", () => {
  it("a return with no hydrogen facility files no Form 7210, and its Form 3800 is the same", () => {
    const run = evaluate(natti.facts, natti.decisions);
    expect(run.files("form-7210")).toBe(false);
    expect(run.value("form-3800", "3.part3.4f_form_8846_col_e")).toBe(15_036);
    expect(run.value("form-3800", LINE_1G)).toBeUndefined();
  });
});
