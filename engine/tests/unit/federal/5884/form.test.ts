/*
 * Form 5884 on a whole return: who files, the lines, the wage reductions on
 * Schedule F line 22, Schedule C line 26 and Schedule CA line 3, the Form 3800
 * sources, the gaps, and "no facts, nothing changes". The synthetic byar
 * (a farm, federal) and daved (a business, California) scenarios are the bases.
 */

import { describe, expect, it } from "vitest";
import {
  makeGeneralBusinessCreditFactKey,
  makeRentalFactKey,
  makeWorkOpportunityEmployeeFactKey,
  type GeneralBusinessCreditFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { EMPLOYEES, PECANS_KEY, pecans } from "../../../scenarios/synthetic/byar/facts.js";
import { byarScenario as byar } from "../../../scenarios/synthetic/byar/index.js";
import { LANDSCAPING_KEY, landscaping } from "../../../scenarios/synthetic/daved/facts.js";
import { davedScenario as daved } from "../../../scenarios/synthetic/daved/index.js";
import type { Scenario } from "../../../types.js";

const isEmployee = (fact: TaxFactRow) => fact.key.startsWith("work_opportunity_employee.");
const isK1 = (fact: TaxFactRow) => fact.category === "k1";

const decision = (base: Scenario, key: string, value: unknown): AIDecisionRow =>
  decisionRow({
    userId: base.userId,
    taxYear: base.taxYear,
    key,
    decision: value,
    rationale: "test",
  });

const row = (base: Scenario, category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

/* The facts with one fact's value replaced. */
const replaced = (facts: TaxFactRow[], key: string, value: unknown) =>
  facts.map((fact) => (fact.key === key ? { ...fact, value } : fact));

function evaluate(
  base: Scenario,
  facts: TaxFactRow[],
  decisions: AIDecisionRow[] = base.decisions,
) {
  const result = evaluateScenario({
    filing: { id: "form-5884-test", taxYear: base.taxYear },
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
  return { files, field, value, line: (id: string) => value("form-5884", id), missing };
}

const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const LINE_2 = "0.line.2_add_lines";
const LINE_3 = "0.line.3_pass_through_credit";
const LINE_4 = "0.line.4_total_work_opportunity_credit";
const LABOR = "0.line.22_labor_hired";
const ROW_4B = "3.part3.4b_form_5884_col_g";
const ROW_4B_PASSIVE = "3.part3.4b_form_5884_col_d";
const CA_LINE_3_B = "0.line.b3_subtractions";

describe("Form 5884 who files", () => {
  it("targeted group employees file it; the credit reaches Form 3800 line 4b and Schedule 3 line 6a", () => {
    const run = evaluate(byar, byar.facts);
    expect(run.files("form-5884")).toBe(true);
    expect(run.line(LINE_2)).toBe(17_618);
    expect(run.line(LINE_3)).toBe(1_200);
    expect(run.line(LINE_4)).toBe(18_818);
    expect(run.value("form-3800", ROW_4B)).toBe(18_818);
    expect(run.value("schedule-3", "0.line.6a")).toBe(18_818);
    expect(run.line("0.line.5_allocated_to_patrons_beneficiaries")).toBeUndefined();
    expect(run.line("0.line.6_subtract_5_from_4")).toBeUndefined();
  });

  it("a K-1 credit alone does not file it: the credit goes directly on Form 3800 (general-instructions::b01)", () => {
    const run = evaluate(
      byar,
      byar.facts.filter((fact) => !isEmployee(fact)),
    );
    expect(run.files("form-5884")).toBe(false);
    expect(run.value("form-3800", ROW_4B)).toBe(1_200);
  });

  it("the decision turns it off: no Form 3800 source from the employees", () => {
    const off = [...byar.decisions, decision(byar, "decisions.scope.must_file_5884", false)];
    const run = evaluate(byar, byar.facts, off);
    expect(run.files("form-5884")).toBe(false);
    expect(run.value("form-3800", ROW_4B)).toBe(1_200);
  });

  it("with no qualified wages (every employee under 120 hours) the form leaves the return", () => {
    const short = byar.facts.map((fact) =>
      isEmployee(fact) ? { ...fact, value: { ...(fact.value as object), hoursWorked: 100 } } : fact,
    );
    const run = evaluate(byar, short);
    expect(run.files("form-5884")).toBe(false);
    expect(run.value("schedule-f", LABOR)).toBe(128_000);
  });

  it("a decision with no employees leaves the form off the return: line 2 is 0", () => {
    const facts = byar.facts.filter((fact) => !isEmployee(fact));
    const on = [...byar.decisions, decision(byar, "decisions.scope.must_file_5884", true)];
    expect(evaluate(byar, facts, on).files("form-5884")).toBe(false);
  });
});

describe("no work opportunity facts, nothing changes", () => {
  it("Schedule F line 22 is the stated labor less only the stated employment credits", () => {
    const facts = byar.facts.filter((fact) => !isEmployee(fact));
    expect(evaluate(byar, facts).value("schedule-f", LABOR)).toBe(128_000);
    const stated = replaced(facts, PECANS_KEY, { ...pecans, employmentCredits: 900 });
    expect(evaluate(byar, stated).value("schedule-f", LABOR)).toBe(127_100);
  });

  it("Schedule C line 26 and Schedule CA line 3 column B", () => {
    const run = evaluate(
      daved,
      daved.facts.filter((fact) => !isEmployee(fact)),
    );
    expect(run.value("schedule-c", "0.line.26")).toBe(82_000);
    expect(run.value("schedule-ca", CA_LINE_3_B)).toBeUndefined();
    expect(run.files("form-3800")).toBe(false);
  });
});

describe("the wage deduction less the credit (line-2::b01)", () => {
  it("Schedule F line 22: the farm's own credit, not the K-1's (irs-1040sf-inst-2025::sec::line-22::b01)", () => {
    expect(evaluate(byar, byar.facts).value("schedule-f", LABOR)).toBe(128_000 - 17_618);
  });

  it("the farm's other employment credits stay on line 22 with it", () => {
    const facts = replaced(byar.facts, PECANS_KEY, { ...pecans, employmentCredits: 900 });
    expect(evaluate(byar, facts).value("schedule-f", LABOR)).toBe(128_000 - 17_618 - 900);
  });

  it("Schedule C line 26, and California adds it back on Schedule CA line 3 column B", () => {
    const run = evaluate(daved, daved.facts);
    expect(run.line(LINE_2)).toBe(4_000);
    expect(run.value("schedule-c", "0.line.26")).toBe(78_000);
    expect(run.value("schedule-ca", CA_LINE_3_B)).toBe(4_000);
  });

  it("wages stated below the credit go to 0, and California adds back only what came off", () => {
    const low = { ...landscaping, expenses: { ...landscaping.expenses, wages: 3_000 } };
    const run = evaluate(daved, replaced(daved.facts, LANDSCAPING_KEY, low));
    expect(run.value("schedule-c", "0.line.26")).toBe(0);
    expect(run.value("schedule-ca", CA_LINE_3_B)).toBe(3_000);
  });
});

describe("Form 3800 sources", () => {
  it("a passive farm's credit is a passive source, so Form 8582-CR files for it", () => {
    const passive = replaced(byar.facts, PECANS_KEY, { ...pecans, materiallyParticipated: false });
    const run = evaluate(byar, passive);
    expect(run.files("form-8582-cr")).toBe(true);
    // A passive farm's own line 34 is a gap (Form 8582), so the tax and Form 3800 wait on it.
    expect(run.value("form-3800", ROW_4B_PASSIVE)).toBeUndefined();
    expect(run.value("schedule-f", LABOR)).toBe(128_000 - 17_618);
  });

  it("without the passive farm, Form 8582-CR does not file", () => {
    expect(evaluate(byar, byar.facts).files("form-8582-cr")).toBe(false);
  });

  it("a stated line 4b credit with no pass-through entity next to the employees is a gap", () => {
    const credit: GeneralBusinessCreditFactValue = {
      sourceForm: "5884",
      line: "4b",
      amount: 3_000,
      passive: false,
    };
    const facts = [
      ...byar.facts,
      row(byar, "other", makeGeneralBusinessCreditFactKey("own-wotc"), credit),
    ];
    const run = evaluate(byar, facts);
    expect(isGap(run.field("form-3800", ROW_4B))).toBe(true);
    expect(run.line(LINE_2)).toBe(17_618);
  });

  it("a cooperative's notice, stated with its EIN, is on line 3 too (line-3::b01)", () => {
    const patronage: GeneralBusinessCreditFactValue = {
      sourceForm: "5884",
      line: "4b",
      amount: 450,
      passive: false,
      passThroughEin: "00-0005887",
    };
    const facts = [
      ...byar.facts,
      row(byar, "other", makeGeneralBusinessCreditFactKey("coop-wotc"), patronage),
    ];
    const run = evaluate(byar, facts);
    expect(run.line(LINE_3)).toBe(1_650);
    expect(run.line(LINE_4)).toBe(19_268);
    expect(run.value("form-3800", ROW_4B)).toBe(19_268);
  });
});

describe("the gaps and waits", () => {
  it("an employee of a rental is a gap on lines 1a to 4 and on Form 3800 line 4b", () => {
    const key = makeWorkOpportunityEmployeeFactKey("rental-handyman");
    const handyman = { ...EMPLOYEES["mirela-tovar"], activityKey: makeRentalFactKey("duplex") };
    const run = evaluate(byar, [...byar.facts, row(byar, "self_employment", key, handyman)]);
    expect(run.files("form-5884")).toBe(true);
    expect(isGap(run.field("form-5884", LINE_2))).toBe(true);
    expect(isGap(run.field("form-5884", LINE_4))).toBe(true);
    expect(run.line(LINE_3)).toBe(1_200);
    expect(isGap(run.field("form-3800", ROW_4B))).toBe(true);
  });

  it("a malformed employee fact is asked again, and lines 1a to 2 wait", () => {
    const key = makeWorkOpportunityEmployeeFactKey("tamsin-ardell");
    const bad = { ...EMPLOYEES["tamsin-ardell"], secondYearWages: 2_000 };
    const run = evaluate(byar, replaced(byar.facts, key, bad));
    expect(run.files("form-5884")).toBe(true);
    expect(run.missing("form-5884")).toContain(key);
    expect(run.line(LINE_2)).toBeUndefined();
    expect(run.line(LINE_3)).toBe(1_200);
  });

  it("a farm with no material participation answer: Form 3800 asks for the farm", () => {
    const { materiallyParticipated: _, ...unanswered } = pecans;
    const run = evaluate(byar, replaced(byar.facts, PECANS_KEY, unanswered));
    expect(run.missing("form-3800")).toContain(PECANS_KEY);
  });
});

/* The base's decisions with each named decision's value replaced, and any decision it lacks added. */
const deciding = (base: Scenario, values: Record<string, unknown>) => [
  ...base.decisions.filter((each) => !(each.decisionKey in values)),
  ...Object.entries(values).map(([key, value]) => decision(base, key, value)),
];

const CA_RESIDENT = {
  "decisions.scope.must_file_ca_540": true,
  "decisions.scope.ca_residency": "full_year",
};
const CA_LINE_6_B = "0.line.b6_subtractions";
const CA_LINE_6_C = "0.line.b6_additions";

describe("California adds the credit back (ftb-pub-1001-2025::sec::enter-on-schedule-ca-540-part-i-or-7::b07)", () => {
  it("a California farm: Schedule CA line 6 column B is the credit that came off line 22", () => {
    const run = evaluate(byar, byar.facts, deciding(byar, CA_RESIDENT));
    expect(run.value("schedule-f", LABOR)).toBe(128_000 - 17_618);
    expect(run.value("schedule-ca", CA_LINE_6_B)).toBe(17_618);
    expect(run.value("schedule-ca", CA_LINE_6_C)).toBeUndefined();
  });

  it("with no employee facts, line 6 columns B and C stay blank", () => {
    const facts = byar.facts.filter((fact) => !isEmployee(fact));
    const run = evaluate(byar, facts, deciding(byar, CA_RESIDENT));
    expect(run.files("schedule-ca")).toBe(true);
    for (const id of [CA_LINE_6_B, CA_LINE_6_C]) {
      expect(run.value("schedule-ca", id)).toBeUndefined();
      expect(isGap(run.field("schedule-ca", id))).toBe(false);
    }
  });

  it("a stated employment credit next to it is still a gap: the farm fact does not name its form", () => {
    const facts = replaced(byar.facts, PECANS_KEY, { ...pecans, employmentCredits: 900 });
    const run = evaluate(byar, facts, deciding(byar, CA_RESIDENT));
    expect(isGap(run.field("schedule-ca", CA_LINE_6_B))).toBe(true);
    expect(isGap(run.field("schedule-ca", CA_LINE_6_C))).toBe(true);
  });

  it("a part-year resident: Schedule CA (540NR) line 3 column B, and column D less it", () => {
    const decisions = deciding(daved, {
      "decisions.scope.must_file_ca_540": false,
      "decisions.scope.must_file_540nr": true,
      "decisions.scope.ca_residency": "part_year",
    });
    const run = evaluate(daved, daved.facts, decisions);
    const line3 = (column: string) => run.value("schedule-ca-540nr", `1.line.b3_${column}`);
    expect(run.files("schedule-ca-540nr")).toBe(true);
    expect(line3("subtractions")).toBe(4_000);
    expect(line3("additions")).toBeUndefined();
    expect(line3("total_ca_law")).toBe((line3("federal") as number) - 4_000);
  });
});

describe("the K-1 does not change the deduction", () => {
  it("without the K-1, line 3 is blank and Schedule F line 22 is the same", () => {
    const run = evaluate(
      byar,
      byar.facts.filter((fact) => !isK1(fact)),
    );
    expect(run.line(LINE_3)).toBeUndefined();
    expect(run.line(LINE_4)).toBe(17_618);
    expect(run.value("schedule-f", LABOR)).toBe(128_000 - 17_618);
  });
});
