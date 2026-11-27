/*
 * Form 6478 on a whole return: who files, each line, the gaps, and Form 3800
 * line 4c. The synthetic lem scenario is the base: a fiscal-year partnership
 * K-1 with a $2,474 biofuel producer credit (box 15 code I).
 */

import { describe, expect, it } from "vitest";
import {
  makeGeneralBusinessCreditFactKey,
  makeK1HoldingFactKey,
  makePartnershipK1FactKey,
  makeTrustK1FactKey,
  type GeneralBusinessCreditFactValue,
  type K1HoldingFactValue,
  type PartnershipK1FactValue,
  type TrustK1FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { CELLULOSE_ID, celluloseK1 } from "../../../scenarios/synthetic/lem/facts.js";
import { lemScenario as base } from "../../../scenarios/synthetic/lem/index.js";

const MUST_FILE = "decisions.scope.must_file_6478";
const K1_KEY = makePartnershipK1FactKey(CELLULOSE_ID);
const HOLDING_KEY = makeK1HoldingFactKey(CELLULOSE_ID);

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

const withoutDecision = base.decisions.filter((each) => each.decisionKey !== MUST_FILE);
const decidedFalse = [...withoutDecision, decision(MUST_FILE, false)];

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const k1With = (credit: number | undefined): PartnershipK1FactValue => ({
  ...celluloseK1,
  boxes: [
    { box: "1", amount: 12600 },
    { box: "15", code: "I", amount: credit },
    { box: "20", code: "Z" },
  ],
});

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-6478-test", taxYear: base.taxYear },
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
  const values = (formId: string) =>
    Object.fromEntries(
      (result.forms.get(formId)?.fields ?? []).map((each) => [
        each.fieldId,
        each.result.ok ? each.result.value : "(blank)",
      ]),
    );
  return {
    files,
    field,
    value,
    values,
    line: (id: string) => value("form-6478", id),
    lineField: (id: string) => field("form-6478", id),
    missing: (formId: string) => result.forms.get(formId)?.missingInputs ?? [],
  };
}

const LINE_3 = "0.line.3_credit_from_pass_throughs";
const LINE_4 = "0.line.4_add_lines_2_3";
const FORM_3800_4C = "3.part3.4c_form_6478_col_e";
const OWN_LINES = [
  "0.line.1_second_generation_biofuel_col_a",
  "0.line.1_second_generation_biofuel_col_c",
  "0.line.2_irs_registration_number",
  "0.line.2_amount_from_line_1",
  "0.line.5_allocated_to_patrons_beneficiaries",
  "0.line.6_subtract_line_5_from_4",
];

describe("Form 6478: lem", () => {
  it("files on the decision; line 3 and line 4 are the K-1 credit", () => {
    const run = evaluate(base.facts);
    expect(run.files("form-6478")).toBe(true);
    expect(run.line(LINE_3)).toBe(2474);
    expect(run.line(LINE_4)).toBe(2474);
    expect(run.missing("form-6478")).toEqual([]);
  });

  it("lines 1, 2, 5 and 6 are blank on a 2025 return, never a gap", () => {
    const run = evaluate(base.facts);
    for (const id of OWN_LINES) {
      expect(isGap(run.lineField(id))).toBe(false);
      expect(run.line(id)).toBeUndefined();
    }
  });

  it("line 4 equals Form 3800 Part III line 4c and Schedule 3 line 6a", () => {
    const run = evaluate(base.facts);
    expect(run.value("form-3800", FORM_3800_4C)).toBe(run.line(LINE_4));
    expect(run.value("schedule-3", "0.line.6a")).toBe(2474);
  });
});

/* Every other form lem files. */
const OTHER_FORMS = [
  "form-1040",
  "schedule-1",
  "schedule-3",
  "schedule-e",
  "form-8995",
  "form-3800",
];

describe("Form 6478: who files", () => {
  it("a K-1 credit alone does not file it with no decision (general-instructions::b01)", () => {
    const run = evaluate(base.facts, withoutDecision);
    expect(run.files("form-6478")).toBe(false);
    expect(run.missing("form-6478")).toEqual([]);
  });

  it("not filing the form changes no other form: Form 3800 still takes the credit", () => {
    const filed = evaluate(base.facts);
    for (const decisions of [withoutDecision, decidedFalse]) {
      const run = evaluate(base.facts, decisions);
      expect(run.files("form-6478")).toBe(false);
      for (const formId of OTHER_FORMS) {
        expect(run.values(formId)).toEqual(filed.values(formId));
      }
    }
  });

  it("the decision with no pass-through credit files a form with every line blank", () => {
    const run = evaluate(factsWith({ [K1_KEY]: undefined, [HOLDING_KEY]: undefined }));
    expect(run.files("form-6478")).toBe(true);
    expect(run.line(LINE_3)).toBeUndefined();
    expect(run.line(LINE_4)).toBeUndefined();
  });
});

describe("Form 6478: line 3", () => {
  const second: PartnershipK1FactValue = {
    ...celluloseK1,
    entityName: "Lake Madison Algae Fuels LP",
    entityEin: "00-0006479",
    boxes: [{ box: "15", code: "I", amount: 600.4 }],
  };
  const secondHolding: K1HoldingFactValue = {
    owner: "taxpayer",
    materiallyParticipated: true,
    allInvestmentAtRisk: true,
    partnershipBasisAtStart: 5000,
  };
  const twoK1s = factsWith({ [K1_KEY]: k1With(1200.4) }, [
    row("k1", makePartnershipK1FactKey("lake-madison"), second),
    row("k1", makeK1HoldingFactKey("lake-madison"), secondHolding),
  ]);

  it("two K-1s with cents: each rounds, then they add, as Form 3800 does (row A96)", () => {
    const run = evaluate(twoK1s);
    expect(run.line(LINE_3)).toBe(1800);
    expect(run.line(LINE_4)).toBe(1800);
    expect(run.value("form-3800", "3.part3.4c_form_6478_col_g")).toBe(1800);
  });

  it("does not wait on the owner's holding answers: the amount does not depend on them", () => {
    const run = evaluate(factsWith({ [HOLDING_KEY]: undefined }));
    expect(run.line(LINE_3)).toBe(2474);
    expect(run.missing("form-6478")).toEqual([]);
  });

  it("a K-1 code I with no amount is a gap on lines 3 and 4", () => {
    const run = evaluate(factsWith({ [K1_KEY]: k1With(undefined) }));
    expect(isGap(run.lineField(LINE_3))).toBe(true);
    expect(isGap(run.lineField(LINE_4))).toBe(true);
  });

  it("a trust K-1 box 13 code H is a gap: the engine does not route it to Form 3800", () => {
    const trust: TrustK1FactValue = {
      form: "1041",
      entityName: "Harrowgate Family Trust",
      entityEin: "00-0006480",
      boxes: [{ box: "13", code: "H", amount: 300 }],
    };
    const run = evaluate([...base.facts, row("k1", makeTrustK1FactKey("family-trust"), trust)]);
    expect(isGap(run.lineField(LINE_3))).toBe(true);
    expect(isGap(run.lineField(LINE_4))).toBe(true);
  });

  const stated = (value: Partial<GeneralBusinessCreditFactValue>): TaxFactRow =>
    row("other", makeGeneralBusinessCreditFactKey("coop"), {
      sourceForm: "6478",
      line: "4c",
      amount: 505.5,
      passive: false,
      ...value,
    });

  it("a stated cooperative allocation that names its entity adds to line 3 and to Form 3800", () => {
    const run = evaluate([...base.facts, stated({ passThroughEin: "00-0006481" })]);
    expect(run.line(LINE_3)).toBe(2474 + 506);
    expect(run.value("form-3800", "3.part3.4c_form_6478_col_g")).toBe(2474 + 506);
  });

  it("a stated line 4c credit with no entity is a gap on line 3 and on Form 3800", () => {
    const run = evaluate([...base.facts, stated({})]);
    expect(isGap(run.lineField(LINE_3))).toBe(true);
    const own = evaluate([...base.facts, stated({})], withoutDecision);
    expect(own.files("form-6478")).toBe(false);
    expect(isGap(own.field("form-3800", "3.part3.4c_form_6478_col_g"))).toBe(true);
  });
});

describe("Form 6478: no facts, nothing changes", () => {
  it("with no biofuel credit, Form 3800 line 4c stays blank and Form 6478 does not file", () => {
    const boxes = celluloseK1.boxes.filter((box) => box.box !== "15");
    const run = evaluate(factsWith({ [K1_KEY]: { ...celluloseK1, boxes } }), withoutDecision);
    expect(run.files("form-6478")).toBe(false);
    expect(run.value("form-3800", FORM_3800_4C)).toBeUndefined();
    // The tax before credits (README hand check), with no credit taken off.
    expect(run.value("form-1040", "line.22")).toBe(13026);
  });
});
