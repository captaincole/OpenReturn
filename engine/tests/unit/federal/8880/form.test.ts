/*
 * Form 8880 on a whole return: who files, each column, the stops, the gaps and
 * Schedule 3 line 4. The synthetic wren scenario is the base.
 */

import { describe, expect, it } from "vitest";
import {
  makeDividendFactKey,
  makeRetirementDistributionFactKey,
  makeSaversCreditFactKey,
  makeTraditionalIraFactKey,
  type SaversCreditFactValue,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { hollisScenario } from "../../../scenarios/synthetic/hollis/index.js";
import { wrenScenario as base } from "../../../scenarios/synthetic/wren/index.js";

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

/* An engine gap: unsupported(reason), not a blank line. */
const isGap = (result: unknown) =>
  (result as { unsupported?: boolean } | undefined)?.unsupported === true;

const TAXPAYER = makeSaversCreditFactKey("taxpayer");
/* A base W-2 fact's value, to change one box. */
const w2Of = (key: string) => base.facts.find((fact) => fact.key === key)!.value as object;
const SPOUSE = makeSaversCreditFactKey("spouse");

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(changes: Record<string, unknown>, extra: TaxFactRow[] = []): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

function evaluate(facts: TaxFactRow[], decisions: AIDecisionRow[] = base.decisions) {
  const result = evaluateScenario({
    filing: { id: "form-8880-test", taxYear: base.taxYear },
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
  const line = (id: string) => value("form-8880", id);
  const missing = result.forms.get("form-8880")?.missingInputs ?? [];
  return { files, field, value, line, missing };
}

const saver = (value: Partial<SaversCreditFactValue>): SaversCreditFactValue => ({
  fullTimeStudent: false,
  claimedAsDependent: false,
  otherDistributions: 0,
  ...value,
});

const withStatus = (status: string) =>
  base.decisions.map((each) =>
    each.decisionKey === "decisions.scope.filing_status" ? { ...each, decision: status } : each,
  );

describe("Form 8880 who files", () => {
  it("files, with Schedule 3, when a person made a contribution and AGI may qualify", () => {
    const run = evaluate(base.facts);
    expect([run.files("form-8880"), run.files("schedule-3")]).toEqual([true, true]);
    expect(run.missing).toEqual([]);
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_8880", false),
    ]);
    expect(run.files("form-8880")).toBe(false);
    expect(run.value("schedule-3", "0.line.4")).toBeUndefined();
  });

  it("does not file when both people are full-time students", () => {
    const run = evaluate(
      factsWith({
        [TAXPAYER]: saver({ fullTimeStudent: true, rothIraContributions: 1000 }),
        [SPOUSE]: saver({ claimedAsDependent: true, rothIraContributions: 1500 }),
      }),
    );
    expect(run.files("form-8880")).toBe(false);
  });

  it("does not file when the least AGI the facts allow is over the limit", () => {
    const run = evaluate(base.facts, withStatus("single"));
    expect(run.files("form-8880")).toBe(false);
  });

  it("asks for each person's answers while they are missing", () => {
    const run = evaluate(factsWith({ [TAXPAYER]: undefined, [SPOUSE]: undefined }));
    expect(run.files("form-8880")).toBe(true);
    expect(run.missing).toEqual([TAXPAYER, SPOUSE]);
    // Both columns wait: line 4 of each needs the other spouse's answers too.
    expect(run.line("0.line.2_elective_deferrals_col_a")).toBeUndefined();
    expect(run.line("0.line.7_total_line_6")).toBeUndefined();
  });

  it("asks for a contributor's date of birth", () => {
    const run = evaluate(factsWith({ "identity.dob": undefined }));
    expect(run.missing).toEqual(["identity.dob"]);
  });
});

describe("Form 8880 columns", () => {
  it("a full-time student's column is blank; the other column still counts", () => {
    const run = evaluate(
      factsWith({
        [SPOUSE]: saver({
          fullTimeStudent: true,
          rothIraContributions: 1500,
          otherDistributions: 300,
        }),
      }),
    );
    expect(run.line("0.line.1_ira_able_contributions_col_b")).toBeUndefined();
    expect(run.line("0.line.4_certain_distributions_col_a")).toBe(300);
    expect(run.line("0.line.7_total_line_6")).toBe(2000);
  });

  it("a person born after January 1, 2008 cannot take the credit", () => {
    const run = evaluate(factsWith({ "identity.spouse.dob": "01/02/2008" }));
    expect(run.line("0.line.6_smaller_of_line_5_or_2000_col_b")).toBeUndefined();
    const onTheDay = evaluate(factsWith({ "identity.spouse.dob": "01/01/2008" }));
    expect(onTheDay.line("0.line.6_smaller_of_line_5_or_2000_col_b")).toBe(2000);
  });

  it("instructions line 4 example: $5,000 in 2025 and a spouse's $2,000 from a separate year → (a) 5,000, (b) 7,000", () => {
    const plan = row("retirement", makeRetirementDistributionFactKey("acme-plan", "code-7"), {
      payerName: "Acme Plan",
      box1: 5000,
      box2a: 5000,
      box7: "7",
      box7IraSepSimple: false,
    });
    const run = evaluate(
      factsWith(
        {
          [SPOUSE]: saver({
            rothIraContributions: 1500,
            otherDistributions: 2000,
            otherDistributionsInSeparateYears: 2000,
          }),
        },
        [plan],
      ),
    );
    expect(run.line("0.line.4_certain_distributions_col_a")).toBe(5000);
    expect(run.line("0.line.4_certain_distributions_col_b")).toBe(7000);
  });

  it("an excluded 1099-R code, an IRA rollover and a conversion stay off line 4", () => {
    const ira = row("retirement", makeRetirementDistributionFactKey("acme-ira", "code-7"), {
      payerName: "Acme IRA",
      box1: 3000,
      box2a: 3000,
      box7: "7",
      box7IraSepSimple: true,
    });
    const loan = row("retirement", makeRetirementDistributionFactKey("acme-plan", "code-l"), {
      payerName: "Acme Plan",
      box1: 900,
      box7: "L1",
      box7IraSepSimple: false,
    });
    const traditional = row("retirement", makeTraditionalIraFactKey("taxpayer"), {
      nondeductibleContributions: 0,
      rolledOver: 2000,
      convertedToRoth: 600,
    });
    const run = evaluate(factsWith({}, [ira, loan, traditional]));
    // 3,000 − 2,000 rolled over − 600 converted = 400, plus Dorian's 300; the code L loan is out.
    expect(run.line("0.line.4_certain_distributions_col_a")).toBe(700);
  });

  it("a direct IRA rollover (code G) comes off line 4 once, not again through rolledOver", () => {
    const direct = row("retirement", makeRetirementDistributionFactKey("acme-ira", "code-g"), {
      payerName: "Acme IRA",
      box1: 5000,
      box2a: 0,
      box7: "G",
      box7IraSepSimple: true,
    });
    const roth = row("retirement", makeRetirementDistributionFactKey("acme-roth", "code-j"), {
      payerName: "Acme Roth IRA",
      box1: 1500,
      box7: "J",
      box7IraSepSimple: false,
    });
    const traditional = row("retirement", makeTraditionalIraFactKey("taxpayer"), {
      nondeductibleContributions: 0,
      rolledOver: 5000,
    });
    const run = evaluate(factsWith({}, [direct, roth, traditional]));
    // The Roth IRA's 1,500 plus Dorian's 300, in both columns.
    expect(run.line("0.line.4_certain_distributions_col_a")).toBe(1800);
    expect(run.line("0.line.4_certain_distributions_col_b")).toBe(1800);
    // Line 5: (a) 2,800 − 1,800 = 1,000; (b) 2,400 − 1,800 = 600. Line 10: 1,600 × 0.5.
    expect(run.line("0.line.6_smaller_of_line_5_or_2000_col_a")).toBe(1000);
    expect(run.line("0.line.6_smaller_of_line_5_or_2000_col_b")).toBe(600);
    expect(run.line("0.line.10_line_7_times_line_9")).toBe(800);
  });

  it("column (b) is blank on a return that is not joint", () => {
    const run = evaluate(
      factsWith({
        "employer.caprock-dental": {
          ...w2Of("employer.caprock-dental"),
          box1: 20000,
        },
      }),
      withStatus("head_of_household"),
    );
    expect(run.files("form-8880")).toBe(true);
    expect(run.line("0.line.1_ira_able_contributions_col_b")).toBeUndefined();
    expect(run.line("0.line.7_total_line_6")).toBe(2000);
  });
});

describe("Form 8880 stops and gaps", () => {
  it("line 9 of 0 stops the form: lines 10–12 and Schedule 3 line 4 are blank", () => {
    // Single with AGI 47,500 (over 39,500); the explicit decision files the form.
    const run = evaluate(base.facts, [
      ...withStatus("single"),
      decision("decisions.scope.must_file_8880", true),
    ]);
    expect(run.line("0.line.8_adjusted_gross_income")).toBe(47500);
    expect(run.line("0.line.9_applicable_decimal_amount")).toBe("0");
    expect(run.line("0.line.10_line_7_times_line_9")).toBeUndefined();
    expect(run.line("0.line.12_retirement_savings_credit")).toBeUndefined();
    expect(isGap(run.field("form-8880", "0.line.12_retirement_savings_credit"))).toBe(false);
    expect(run.value("schedule-3", "0.line.4")).toBeUndefined();
  });

  it("lines 9 and 10 stay blank while the filing status waits", () => {
    const run = evaluate(
      base.facts,
      base.decisions.filter((each) => each.decisionKey !== "decisions.scope.filing_status"),
    );
    expect(run.line("0.line.9_applicable_decimal_amount")).toBeUndefined();
    expect(run.line("0.line.10_line_7_times_line_9")).toBeUndefined();
  });

  it("foreign tax on a 1099 (the election): the worksheet subtracts Schedule 3 line 1", () => {
    const dividend = row("investment_income", makeDividendFactKey("acme-brokerage"), {
      payerName: "Acme Brokerage",
      box1a: 10,
      box7: 1,
    });
    const run = evaluate(factsWith({}, [dividend]));
    expect(run.value("schedule-3", "0.line.1")).toBe(1);
    expect(run.line("1.credit_limit_worksheet.2_schedule_3_credits_total")).toBeGreaterThanOrEqual(
      1,
    );
    expect(isGap(run.field("form-8880", "0.line.12_retirement_savings_credit"))).toBe(false);
  });

  it("a Form 1116 gap makes the worksheet a gap, and Schedule 3 line 4 too", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_1116", true),
    ]);
    expect(isGap(run.field("schedule-3", "0.line.1"))).toBe(true);
    expect(
      isGap(run.field("form-8880", "1.credit_limit_worksheet.2_schedule_3_credits_total")),
    ).toBe(true);
    expect(isGap(run.field("schedule-3", "0.line.4"))).toBe(true);
  });

  it("a Form 2555 makes line 8 a gap, and Schedule 3 line 4 too", () => {
    const run = evaluate(base.facts, [
      ...base.decisions,
      decision("decisions.scope.must_file_2555", true),
    ]);
    expect(isGap(run.field("form-8880", "0.line.8_adjusted_gross_income"))).toBe(true);
    expect(isGap(run.field("schedule-3", "0.line.4"))).toBe(true);
  });

  it("line 7 of 0 stops the form (an explicit decision with no contribution)", () => {
    const run = evaluate(
      factsWith({
        [TAXPAYER]: saver({}),
        [SPOUSE]: saver({}),
        "employer.caprock-dental": {
          ...w2Of("employer.caprock-dental"),
          box12: [],
        },
        "employer.llano-estacado-freight": {
          ...w2Of("employer.llano-estacado-freight"),
          box12: [],
        },
      }),
      [...base.decisions, decision("decisions.scope.must_file_8880", true)],
    );
    expect(run.line("0.line.7_total_line_6")).toBe(0);
    expect(run.line("0.line.8_adjusted_gross_income")).toBeUndefined();
  });
});

describe("Form 8880 with none of its facts", () => {
  it("does not file, and Schedule 3 line 4 stays blank (hollis)", () => {
    const result = evaluateScenario({
      filing: { id: "hollis-8880", taxYear: hollisScenario.taxYear },
      facts: hollisScenario.facts,
      decisions: hollisScenario.decisions,
      authEmail: null,
    });
    const form = result.forms.get("form-8880");
    expect(form?.mustFile.ok && form.mustFile.value).toBe(false);
    expect(
      result.forms.get("schedule-3")?.mustFile.ok && result.forms.get("schedule-3")?.mustFile,
    ).toMatchObject({ value: false });
  });
});
