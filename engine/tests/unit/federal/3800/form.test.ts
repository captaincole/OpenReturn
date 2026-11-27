/*
 * Form 3800 on a whole return: who files, the K-1 credits, the stated credits
 * and carryovers, the gaps, Parts V and VI and Schedule 3 line 6a. The
 * synthetic renald scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  GENERAL_BUSINESS_CREDIT_KEYS,
  makeCreditCarryoverFactKey,
  makeGeneralBusinessCreditFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  type CreditCarryoverFactValue,
  type GeneralBusinessCreditFactValue,
  type PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { form3800Bindings } from "../../../../src/federal/3800/bindings.js";
import { form3800CopyCount } from "../../../../src/federal/3800/breakdown.js";
import catalogJson from "../../../../src/federal/3800/catalog.json";
import type { CurrentCredit } from "../../../../src/federal/3800/credits.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { CLINIC_ID, WORKS_ID, worksK1 } from "../../../scenarios/synthetic/renald/facts.js";
import { renaldScenario as base } from "../../../scenarios/synthetic/renald/index.js";

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

const WORKS = makePartnershipK1FactKey(WORKS_ID);
const isCredit = (fact: TaxFactRow) => fact.key.startsWith("general_business_credit.");
const valueOf = (key: string) => base.facts.find((fact) => fact.key === key)!.value;

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

/* The K-1s without box 15 and no stated credit: a return with nothing for Form 3800. */
function noCredits(): TaxFactRow[] {
  return base.facts
    .filter((fact) => !isCredit(fact))
    .map((fact) => {
      if (fact.category !== "k1" || !("boxes" in (fact.value as object))) return fact;
      const k1 = fact.value as PartnershipK1FactValue;
      return { ...fact, value: { ...k1, boxes: k1.boxes.filter((box) => box.box !== "15") } };
    });
}

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-3800-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-3800", id);
  const missing = result.forms.get("form-3800")?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const LINE_38 = "1.line.38_credit_allowed_current_year";
const stated = (slug: string, value: GeneralBusinessCreditFactValue) =>
  row("other", makeGeneralBusinessCreditFactKey(slug), value);
const carried = (slug: string, value: CreditCarryoverFactValue) =>
  row("other", makeCreditCarryoverFactKey(slug), value);

describe("Form 3800 bindings", () => {
  it("give every catalog field one rule, and no rule without a field", () => {
    const bound = Object.keys(form3800Bindings()).sort();
    const fields = catalogJson.fields
      .map((field) => field.fieldId.slice("form-3800.".length))
      .sort();
    expect(bound).toEqual(fields);
  });
});

describe("who files Form 3800", () => {
  it("no credit and no carryover: no Form 3800, no Schedule 3, and Form 1040 line 20 stays blank", () => {
    const run = evaluate(noCredits());
    expect(run.files("form-3800")).toBe(false);
    expect(run.files("schedule-3")).toBe(false);
    expect(run.files("form-6251")).toBe(false);
    expect(run.value("form-1040", "line.20")).toBeUndefined();
  });

  it("a K-1 general business credit alone files it, and Form 6251 for line 14", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-3800")).toBe(true);
    expect(run.files("form-6251")).toBe(true);
    expect(run.value("schedule-3", "0.line.6a")).toBe(run.line(LINE_38));
  });

  it("the explicit decision wins", () => {
    const decisions = [
      ...base.decisions,
      decisionRow({
        userId: base.userId,
        taxYear: base.taxYear,
        key: "decisions.scope.must_file_3800",
        decision: false,
        rationale: "test",
      }),
    ];
    const run = evaluate(base.facts, decisions);
    expect(run.files("form-3800")).toBe(false);
  });

  it("only specified credits: Form 6251 does not file, line 14 is a gap and line 38 still computes", () => {
    const facts = factsWith({}, [
      stated("health", { sourceForm: "8941", line: "4h", amount: 2_000, passive: false }),
    ]);
    const run = evaluate([
      ...noCredits(),
      ...facts.filter(isCredit).filter((fact) => fact.key.includes("current")),
    ]);
    expect(run.files("form-6251")).toBe(false);
    expect(isGap(run.field("form-3800", "0.line.14_tentative_minimum_tax"))).toBe(true);
    expect(run.line("0.line.17_credit_allowed_after_38c1_limit")).toBe(0);
    expect(run.line(LINE_38)).toBe(2_000);
  });
});

describe("K-1 credits", () => {
  it("a research credit waits on its answers, and the answers are listed", () => {
    const run = evaluate(
      factsWith({ [GENERAL_BUSINESS_CREDIT_KEYS.k1Research(WORKS)]: undefined }),
    );
    expect(run.missing).toContain(GENERAL_BUSINESS_CREDIT_KEYS.k1Research(WORKS));
  });

  it("an eligible small business puts the research credit on line 4i", () => {
    const answer = { eligibleSmallBusiness: true, attributableTaxableIncome: 80_000 };
    const run = evaluate(factsWith({ [GENERAL_BUSINESS_CREDIT_KEYS.k1Research(WORKS)]: answer }));
    expect(run.line("3.part3.4i_form_6765_esb_col_e")).toBe(23_041);
    expect(run.line("2.part3.1c_form_6765_col_e")).toBeUndefined();
  });

  it("a passive owner's credit goes in column (d), and column (g) takes what Form 8582-CR allows", () => {
    const holding = {
      ...(valueOf(makeK1HoldingFactKey(CLINIC_ID)) as object),
      materiallyParticipated: false,
    };
    const run = evaluate(factsWith({ [makeK1HoldingFactKey(CLINIC_ID)]: holding }));
    // The clinic's $24,000 of box 1 income is passive: line 6 is 35% of it, more than its credits.
    expect(run.value("form-8582-cr", "0.line.4a_other_passive_credits")).toBe(4_657);
    expect(run.value("form-8582-cr", "0.line.6_tax_net_passive_income")).toBe(8_400);
    expect(run.value("form-8582-cr", "1.line.37_passive_activity_credit_allowed")).toBe(4_657);
    expect(run.line("3.part3.4h_form_8941_col_d")).toBe(1_800);
    expect(run.line("3.part3.4h_form_8941_col_g")).toBe(1_800);
    expect(run.line("0.line.3_passive_credits_allowed")).toBe(2_857);
    expect(run.line("1.line.33_specified_passive_credits_allowed")).toBe(1_800);
    expect(run.value("schedule-3", "0.line.6a")).toBe(run.line(LINE_38));
  });

  it("a passive credit is a gap when Form 8582-CR is decided out", () => {
    const holding = {
      ...(valueOf(makeK1HoldingFactKey(CLINIC_ID)) as object),
      materiallyParticipated: false,
    };
    const decisions = [
      ...base.decisions,
      decisionRow({
        userId: base.userId,
        taxYear: base.taxYear,
        key: "decisions.scope.must_file_8582_cr",
        decision: false,
        rationale: "test",
      }),
    ];
    const run = evaluate(factsWith({ [makeK1HoldingFactKey(CLINIC_ID)]: holding }), decisions);
    expect(run.files("form-8582-cr")).toBe(false);
    expect(isGap(run.field("form-3800", "3.part3.4h_form_8941_col_g"))).toBe(true);
    expect(isGap(run.field("form-3800", LINE_38))).toBe(true);
  });

  it("rehabilitation expenditures (code E) with no Form 3468 property keep a gap on line 4k, never a dropped credit", () => {
    const k1 = { ...worksK1, boxes: [...worksK1.boxes, { box: "15", code: "E", amount: 900 }] };
    const run = evaluate(factsWith({ [WORKS]: k1 }));
    expect(isGap(run.field("form-3800", "3.part3.4k_form_3468_part_vii_col_d"))).toBe(true);
    expect(isGap(run.field("form-3800", LINE_38))).toBe(true);
  });

  it("an unused energy credit from cooperatives (code T) reaches line 4a through Form 3468 line 31", () => {
    const k1 = { ...worksK1, boxes: [...worksK1.boxes, { box: "15", code: "T", amount: 900 }] };
    const run = evaluate(factsWith({ [WORKS]: k1 }));
    expect(run.files("form-3468")).toBe(true);
    expect(run.value("form-3468", "10.part6.31_cooperatives_unused_credit")).toBe(900);
    expect(run.value("form-3468", "10.part6.32_total_energy_credit")).toBe(900);
    expect(run.line("3.part3.4a_form_3468_part_vi_col_e")).toBe(900);
  });

  it("a new clean vehicle credit from a K-1 with no Form 8936 is a gap (the modified AGI test)", () => {
    const k1 = { ...worksK1, boxes: [...worksK1.boxes, { box: "15", code: "AY", amount: 2_500 }] };
    const run = evaluate(factsWith({ [WORKS]: k1 }));
    expect(isGap(run.field("form-3800", "2.part3.1y_form_8936_part_ii_col_e"))).toBe(true);
  });
});

describe("stated credits and carryovers", () => {
  it("a credit sold under section 6418: item B, column (f) negative, column (b), and column (i) on every row", () => {
    const wind = stated("wind", {
      sourceForm: "8835 Part II",
      line: "1f",
      amount: 6_000,
      passive: false,
      transfer: { direction: "sold", amount: 2_500, registrationNumber: "RG-2025-0042" },
    });
    const run = evaluate(factsWith({}, [wind]));
    expect(run.line("0.header.b_i_part3_col_f_entry_yes")).toBe(true);
    expect(run.line("0.header.b_ii_transfer_election_statements_count")).toBe(1);
    expect(run.line("2.part3.1f_form_8835_part_ii_col_f")).toBe(-2_500);
    expect(run.line("2.part3.1f_form_8835_part_ii_col_g")).toBe(3_500);
    expect(run.line("2.part3.1f_form_8835_part_ii_col_b")).toBe("RG-2025-0042");
    expect(typeof run.line("2.part3.1c_form_6765_col_i")).toBe("number");
  });

  it("a stated credit for another form's line is a gap on that line", () => {
    const wrong = stated("wrong", {
      sourceForm: "8826",
      line: "1h",
      amount: 1_000,
      passive: false,
    });
    expect(
      isGap(evaluate(factsWith({}, [wrong])).field("form-3800", "2.part3.1h_form_8820_col_e")),
    ).toBe(true);
  });

  it("a research carryover and a 2025 carryover are gaps", () => {
    const research = carried("research", {
      sourceForm: "6765",
      line: "1c",
      originYear: 2023,
      amount: 500,
      passive: false,
    });
    const thisYear = carried("now", {
      sourceForm: "8820",
      line: "1h",
      originYear: 2025,
      amount: 500,
      passive: false,
    });
    const run = evaluate(factsWith({}, [research, thisYear]));
    expect(isGap(run.field("form-3800", "4.part4.1c_form_6765_col_f"))).toBe(true);
    expect(isGap(run.field("form-3800", "4.part4.1h_form_8820_col_f"))).toBe(true);
  });

  it("a recapture larger than the carryover left is a gap in column (i)", () => {
    const over = carried("over", {
      sourceForm: "8820",
      line: "1h",
      originYear: 2022,
      amount: 500,
      passive: false,
      recapturedOrAdjusted: 900,
    });
    const run = evaluate(factsWith({}, [over]));
    expect(run.line("4.part4.1h_form_8820_col_g")).toBe(0);
    expect(isGap(run.field("form-3800", "4.part4.1h_form_8820_col_i"))).toBe(true);
  });
});

describe("Parts V and VI copies", () => {
  const credit = (index: number): CurrentCredit => ({
    line: "1h",
    key: `k${index}`,
    amount: 100,
    passive: false,
  });

  it("one copy holds 15 Part V rows and 35 Part VI rows", () => {
    const many = (count: number) => Array.from({ length: count }, (_, index) => credit(index));
    expect(form3800CopyCount({ current: many(15), carryovers: [] })).toBe(1);
    expect(form3800CopyCount({ current: many(16), carryovers: [] })).toBe(2);
    expect(form3800CopyCount({ current: many(31), carryovers: [] })).toBe(3);
    expect(form3800CopyCount(undefined)).toBe(1);
  });
});
