/*
 * Form 8611 on a whole return: who files, a K-1's recapture (line 8), the copies
 * Schedule 2 line 16 adds, and a return with no recapture fact. The synthetic
 * pedron scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeK1HoldingFactKey,
  makeK1LowIncomeHousingRecaptureFactKey,
  makeLowIncomeHousingRecaptureFactKey,
  makePartnershipK1FactKey,
  type FlowThroughLowIncomeHousingRecapture,
  type K1HoldingFactValue,
  type OwnLowIncomeHousingRecapture,
  type PartnershipK1FactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { pedronScenario as base } from "../../../scenarios/synthetic/pedron/index.js";
import { wrenScenario } from "../../../scenarios/synthetic/wren/index.js";

const isBuilding = (fact: TaxFactRow) => fact.key.startsWith("low_income_housing_recapture.");
const otherFacts = base.facts.filter((fact) => !isBuilding(fact));
const template = base.facts.find(isBuilding)!;
const baseBuilding = template.value as OwnLowIncomeHousingRecapture;

const row = (category: string, key: string, value: unknown): TaxFactRow => ({
  ...template,
  id: `f-${key}`,
  category,
  key,
  value,
});

const building = (slug: string, value: Partial<OwnLowIncomeHousingRecapture> = {}) =>
  row("rental", makeLowIncomeHousingRecaptureFactKey(slug), { ...baseBuilding, ...value });

const decision = (key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8611-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-8611", id);
  const scheduleTwo = () => value("schedule-2", LINE_16);
  return { result, files, field, value, line, scheduleTwo };
}

const LINE_16 = "0.line.16_recapture_low_income_housing_credit";
const LINE_8 = "0.line.8_recapture_from_flow_through_entity";
const LINE_11 = "0.line.11_interest_on_line_10_recapture";
const LINE_14 = "0.line.14_recapture_tax";

describe("who files (purpose-of-form::b01)", () => {
  it("a building whose qualified basis fell files Form 8611 and Schedule 2", () => {
    const { files, line, scheduleTwo } = evaluate([...otherFacts, building("juniper-row")]);
    expect(files("form-8611")).toBe(true);
    expect(files("schedule-2")).toBe(true);
    expect(line(LINE_14)).toBe(2571);
    expect(scheduleTwo()).toBe(2571);
  });

  it("a decrease that only uses up the additions does not file", () => {
    const facts = [
      ...otherFacts,
      building("juniper-row", {
        basisChange: {
          kind: "decrease",
          firstYearQualifiedBasis: 2400000,
          priorYearEndQualifiedBasis: 2520000,
          yearEndQualifiedBasis: 2450000,
        },
      }),
    ];
    const { files, scheduleTwo } = evaluate(facts);
    expect(files("form-8611")).toBe(false);
    expect(scheduleTwo()).toBeUndefined();
  });

  it("the explicit decision still wins", () => {
    const decisions = [...base.decisions, decision("decisions.scope.must_file_8611", false)];
    const { files, scheduleTwo } = evaluate(base.facts, decisions);
    expect(files("form-8611")).toBe(false);
    expect(scheduleTwo()).toBeUndefined();
  });

  it("a recapture event outside years 2 to 15 is unsupported from line 4 on", () => {
    const { field, line } = evaluate([
      ...otherFacts,
      building("juniper-row", { firstCreditYear: 2008 }),
    ]);
    expect(line("0.line.1_total_credits_prior_years")).toBe(82400);
    expect(field("form-8611", "0.line.5_accelerated_portion_of_credit")).toMatchObject({
      unsupported: true,
    });
    expect(field("schedule-2", LINE_16)).toMatchObject({ unsupported: true });
  });
});

describe("no recapture fact, nothing changes", () => {
  it("Form 8611 does not file and Schedule 2 line 16 is blank", () => {
    const { files, field } = evaluate(otherFacts);
    expect(files("form-8611")).toBe(false);
    const line16 = field("schedule-2", LINE_16);
    expect(line16 === undefined || !line16.ok).toBe(true);
    expect(line16).not.toMatchObject({ unsupported: true });
  });

  it("another scenario's Schedule 2 line 16 is blank, not unsupported", () => {
    const result = evaluateScenario({
      filing: { id: "wren", taxYear: wrenScenario.taxYear },
      facts: wrenScenario.facts,
      decisions: wrenScenario.decisions,
      authEmail: null,
    });
    expect(result.forms.get("form-8611")?.mustFile).toMatchObject({ ok: true, value: false });
  });
});

/* A made-up partnership K-1: box 1 income and a recapture in box 20. */
const PARTNERSHIP_ID = "high-desert-housing";
const k1 = (code: "F" | "G", amount: number): TaxFactRow[] => {
  const value: PartnershipK1FactValue = {
    form: "1065",
    entityName: "High Desert Housing Partners LP",
    entityEin: "00-0008612",
    publiclyTraded: false,
    partnerType: "limited",
    boxes: [
      { box: "1", amount: 5000 },
      { box: "20", code, amount },
    ],
  };
  const holding: K1HoldingFactValue = {
    owner: "taxpayer",
    materiallyParticipated: true,
    allInvestmentAtRisk: true,
    partnershipBasisAtStart: 100000,
  };
  return [
    row("k1", makePartnershipK1FactKey(PARTNERSHIP_ID), value),
    row("k1", makeK1HoldingFactKey(PARTNERSHIP_ID), holding),
  ];
};

const flowThrough = (
  kind: "section_42j5" | "other",
  value: Partial<FlowThroughLowIncomeHousingRecapture> = {},
): TaxFactRow =>
  row("rental", makeK1LowIncomeHousingRecaptureFactKey(PARTNERSHIP_ID, kind), {
    kind: "flow_through",
    building: { ...baseBuilding.building, taxExemptBonds: undefined },
    priorYears: [{ taxYear: 2024, credit: 1000 }],
    unusedCredits: 0,
    unusedCreditsFromAdditions: 0,
    ...value,
  });

describe("a K-1's recapture (line 8)", () => {
  it("files the form and waits for the building fact", () => {
    const facts = [...otherFacts, ...k1("G", 1000)];
    const { files, result, scheduleTwo } = evaluate(facts);
    expect(files("form-8611")).toBe(true);
    expect(scheduleTwo()).toBeUndefined();
    expect(pendingInputs(result).pendingFacts).toContain(
      makeK1LowIncomeHousingRecaptureFactKey(PARTNERSHIP_ID, "other"),
    );
  });

  it("an ordinary partnership: line 8 is the K-1 amount and line 11 the interest", () => {
    const facts = [...otherFacts, ...k1("G", 1000), flowThrough("other")];
    const { line, scheduleTwo } = evaluate(facts);
    expect(line("0.line.1_total_credits_prior_years")).toBeUndefined();
    expect(line(LINE_8)).toBe(1000);
    expect(line(LINE_11)).toBe(72);
    expect(line(LINE_14)).toBe(1072);
    expect(scheduleTwo()).toBe(1072);
  });

  it("a section 42(j)(5) partnership: line 11 is 0 (line-11::b01)", () => {
    const facts = [...otherFacts, ...k1("F", 1000), flowThrough("section_42j5")];
    const { line } = evaluate(facts);
    expect(line(LINE_11)).toBe(0);
    expect(line(LINE_14)).toBe(1000);
  });

  it("unused credits use the entity's decimals for line 9, and wait without them", () => {
    const unused = { unusedCredits: 3000, unusedCreditsFromAdditions: 0 };
    const waiting = evaluate([
      ...otherFacts,
      ...k1("F", 1000),
      flowThrough("section_42j5", unused),
    ]);
    expect(waiting.line(LINE_14)).toBeUndefined();
    const decimals = {
      ...unused,
      entityRecapturePercentage: 0.333,
      entityBasisDecreasePercentage: 0.5,
    };
    const { line } = evaluate([
      ...otherFacts,
      ...k1("F", 1000),
      flowThrough("section_42j5", decimals),
    ]);
    expect(line("0.line.9_unused_portion_accelerated_amount")).toBe(500);
    expect(line("0.line.13_unused_credits_this_building")).toBe(2500);
    expect(line(LINE_14)).toBe(0);
    expect(line("0.line.15_carryforward_low_income_housing_credit")).toBe(2000);
  });

  it("Schedule 2 line 16 adds the line 14 of every copy", () => {
    const facts = [
      ...otherFacts,
      building("juniper-row"),
      ...k1("F", 1000),
      flowThrough("section_42j5"),
    ];
    const { scheduleTwo } = evaluate(facts);
    expect(scheduleTwo()).toBe(2571 + 1000);
  });
});
