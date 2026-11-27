/*
 * Form 8862 on a whole return: who files, what each stated denial does to
 * its credit, the parts each line 2 box opens, and the gaps. The synthetic
 * lini (Section A, all three credits) and ghealdan (Section B) scenarios are
 * the bases.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  EIC_KEYS,
  FORM_8862_KEYS,
  SPOUSE_KEYS,
  makeDependentFactKey,
} from "../../../../src/facts/index.js";
import type { AIDecisionRow, TaxFactRow } from "../../../../src/facts/rows.js";
import { evaluateScenario, pendingInputs } from "../../../../src/index.js";
import { decisionRow } from "../../../helpers/fixtureBuilders.js";
import { ghealdanScenario } from "../../../scenarios/synthetic/ghealdan/index.js";
import { liniScenario as lini } from "../../../scenarios/synthetic/lini/index.js";
import type { Scenario } from "../../../types.js";

/* Each case evaluates whole returns synchronously: yield to the event loop first (as requiredInputs.test.ts does). */
beforeEach(() => new Promise<void>((resolve) => setImmediate(resolve)));

const DENIAL_KEYS = [
  EIC_KEYS.deniedInEarlierYear,
  FORM_8862_KEYS.eicOnlyIncomeMisreported,
  FORM_8862_KEYS.ctcDeniedInEarlierYear,
  FORM_8862_KEYS.ctcBarredByIrs,
  FORM_8862_KEYS.aotcDeniedInEarlierYear,
  FORM_8862_KEYS.aotcBarredByIrs,
];
const DARA = makeDependentFactKey("dara");

/* The base facts with each fact for a key replaced (undefined drops it) and extra facts added. */
function factsWith(
  base: Scenario,
  changes: Record<string, unknown>,
  extra: TaxFactRow[] = [],
): TaxFactRow[] {
  const kept = base.facts
    .filter((fact) => !(fact.key in changes) || changes[fact.key] !== undefined)
    .map((fact) => (fact.key in changes ? { ...fact, value: changes[fact.key] } : fact));
  return [...kept, ...extra];
}

const row = (base: Scenario, category: string, key: string, value: unknown): TaxFactRow => ({
  ...base.facts[0]!,
  id: `f-${key}`,
  category,
  key,
  value,
});

const valueOf = (base: Scenario, key: string) =>
  base.facts.find((fact) => fact.key === key)!.value as Record<string, unknown>;

function evaluate(
  base: Scenario,
  facts: TaxFactRow[],
  decisions: AIDecisionRow[] = base.decisions,
) {
  const result = evaluateScenario({
    filing: { id: "form-8862-test", taxYear: base.taxYear },
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
  return {
    files,
    field,
    line: (id: string) => value("form-8862", id),
    form1040: (id: string) => value("form-1040", id),
    form1040Result: (id: string) => field("form-1040", id),
    missing: result.forms.get("form-8862")?.missingInputs ?? [],
    pending: pendingInputs(result).pendingFacts,
  };
}

const CREDIT_LINES = ["line.19", "line.27a", "line.28", "line.29", "line.35a"];

describe("Form 8862 who files", () => {
  it("files with a stated denial, and no stated denial changes nothing else", () => {
    const withForm = evaluate(lini, lini.facts);
    const without = evaluate(
      lini,
      factsWith(lini, Object.fromEntries(DENIAL_KEYS.map((key) => [key, undefined]))),
    );
    expect(withForm.files("form-8862")).toBe(true);
    expect(without.files("form-8862")).toBe(false);
    // A denial that is not stated is "no": the EIC answer itself is asked as before.
    const noDenial = evaluate(
      lini,
      factsWith(lini, {
        [EIC_KEYS.deniedInEarlierYear]: false,
        [FORM_8862_KEYS.ctcDeniedInEarlierYear]: undefined,
        [FORM_8862_KEYS.aotcDeniedInEarlierYear]: undefined,
      }),
    );
    expect(noDenial.files("form-8862")).toBe(false);
    for (const line of CREDIT_LINES) {
      expect(noDenial.form1040(line)).toBe(withForm.form1040(line));
    }
  });

  it("an explicit decision false still wins", () => {
    const run = evaluate(lini, lini.facts, [
      ...lini.decisions,
      decisionRow({
        userId: lini.userId,
        taxYear: lini.taxYear,
        key: "decisions.scope.must_file_8862",
        decision: false,
        rationale: "test",
      }),
    ]);
    expect(run.files("form-8862")).toBe(false);
  });

  it("leaves the return when no line 2 box ends up checked", () => {
    // Only the EIC was denied, and wages over the EIC limit leave no EIC to claim.
    const w2Key = lini.facts.find((fact) => fact.category === "wages")!.key;
    const w2 = valueOf(lini, w2Key);
    const run = evaluate(
      lini,
      factsWith(lini, {
        [w2Key]: { ...w2, box1: 70_000, box3: 70_000, box5: 70_000 },
        [FORM_8862_KEYS.ctcDeniedInEarlierYear]: false,
        [FORM_8862_KEYS.aotcDeniedInEarlierYear]: false,
      }),
    );
    expect(run.form1040("line.27a")).toBeUndefined();
    expect(run.files("form-8862")).toBe(false);
    // Only the AOTC was denied, and AGI over $90,000 leaves no AOTC: the box takes the form off.
    const over = evaluate(
      lini,
      factsWith(lini, {
        [w2Key]: { ...w2, box1: 95_000, box3: 95_000, box5: 95_000 },
        [EIC_KEYS.deniedInEarlierYear]: false,
        [FORM_8862_KEYS.ctcDeniedInEarlierYear]: false,
      }),
    );
    expect(over.form1040("line.29")).toBeUndefined();
    expect(over.files("form-8862")).toBe(false);
  });

  it("does not file for the EIC alone under the exception for a denial only for a child", () => {
    const run = evaluate(
      ghealdanScenario,
      factsWith(ghealdanScenario, { [FORM_8862_KEYS.eicDeniedOnlyForChild]: true }),
    );
    expect(run.files("form-8862")).toBe(false);
    expect(run.form1040("line.27a")).toBe(649);
  });
});

describe("Form 8862 and the EIC", () => {
  it("line 27a waits while line 3 is unanswered, and Form 8862 asks for it", () => {
    const run = evaluate(
      lini,
      factsWith(lini, { [FORM_8862_KEYS.eicOnlyIncomeMisreported]: undefined }),
    );
    expect(run.form1040("line.27a")).toBeUndefined();
    expect(run.form1040Result("line.27a")).not.toHaveProperty("unsupported", true);
    expect(run.missing).toEqual([FORM_8862_KEYS.eicOnlyIncomeMisreported]);
    expect(run.pending).toContain(FORM_8862_KEYS.eicOnlyIncomeMisreported);
    expect(run.line("0.line.2_claiming_eic")).toBeUndefined();
  });

  it("line 3 Yes ends Part II; the EIC is claimed", () => {
    const run = evaluate(
      lini,
      factsWith(lini, { [FORM_8862_KEYS.eicOnlyIncomeMisreported]: true }),
    );
    expect(run.form1040("line.27a")).toBe(2428);
    expect(run.line("0.line.3_eic_only_income_misreported_yes")).toBe(true);
    expect(run.line("0.line.4_qualifying_child_of_another_no")).toBeUndefined();
    expect(run.line("0.line.5a_child_1_name")).toBeUndefined();
    expect(run.line("0.line.7_days_lived_in_us_child_3")).toBeUndefined();
  });

  it("asks for a child's days when the months do not settle them", () => {
    const { daysLivedWithYouInUs: _days, ...dara } = valueOf(lini, DARA);
    const run = evaluate(lini, factsWith(lini, { [DARA]: dara }));
    expect(run.missing).toEqual([DARA]);
    expect(run.form1040("line.27a")).toBeUndefined();
  });

  it("is a gap when line 7 is under 183 days for a child the EIC counts", () => {
    const run = evaluate(
      lini,
      factsWith(lini, { [DARA]: { ...valueOf(lini, DARA), daysLivedWithYouInUs: 182 } }),
    );
    expect(run.form1040Result("line.27a")).toMatchObject({
      unsupported: true,
      reason: expect.stringContaining("Dara Thornbury lived with you"),
    });
    expect(run.field("form-8862", "0.line.2_claiming_eic")).toMatchObject({ unsupported: true });
  });

  it("prints a child's month and day of death on line 8, and 365 on line 7", () => {
    const owen = makeDependentFactKey("owen");
    const run = evaluate(
      lini,
      factsWith(lini, {
        [owen]: { ...valueOf(lini, owen), dateOfDeath: "11/20/2025", monthsLivedWithYou: 9 },
      }),
    );
    expect(run.line("0.line.8_child_2_death_month")).toBe("11");
    expect(run.line("0.line.8_child_2_death_day")).toBe("20");
    expect(run.line("0.line.7_days_lived_in_us_child_2")).toBe(365);
    // Schedule EIC face-page-1::b04: a child who died in 2025 enters "12", not the months alive.
    expect(run.field("schedule-eic", "0.line.6_months_lived_in_us_child_2")).toMatchObject({
      ok: true,
      value: 12,
    });
  });

  it("an EIC ban stops the EIC; the form still files for the other credits", () => {
    const run = evaluate(lini, factsWith(lini, { [EIC_KEYS.barredByIrs]: true }));
    expect(run.form1040("line.27a")).toBeUndefined();
    expect(run.line("0.line.2_claiming_eic")).toBe(false);
    expect(run.line("0.line.2_claiming_ctc_actc_odc")).toBe(true);
    expect(run.line("0.line.3_eic_only_income_misreported_no")).toBeUndefined();
  });
});

describe("Form 8862 Section B", () => {
  it("asks for line 9b on a joint return, and is a gap under 183 days", () => {
    const missing = evaluate(
      ghealdanScenario,
      factsWith(ghealdanScenario, { [FORM_8862_KEYS.spouseDaysMainHomeInUs]: undefined }),
    );
    expect(missing.missing).toEqual([FORM_8862_KEYS.spouseDaysMainHomeInUs]);
    expect(missing.form1040("line.27a")).toBeUndefined();
    const short = evaluate(
      ghealdanScenario,
      factsWith(ghealdanScenario, { [FORM_8862_KEYS.spouseDaysMainHomeInUs]: 150 }),
    );
    expect(short.form1040Result("line.27a")).toMatchObject({ unsupported: true });
  });

  it("asks the exception first for a filer with no qualifying child", () => {
    const run = evaluate(
      ghealdanScenario,
      factsWith(ghealdanScenario, { [FORM_8862_KEYS.eicDeniedOnlyForChild]: undefined }),
    );
    expect(run.missing).toEqual([FORM_8862_KEYS.eicDeniedOnlyForChild]);
  });

  it("line 10b is a gap for a spouse who died during 2025", () => {
    const died = row(ghealdanScenario, "identity", SPOUSE_KEYS.yearOfDeath, "2025");
    const run = evaluate(ghealdanScenario, [...ghealdanScenario.facts, died]);
    expect(run.field("form-8862", "1.line.10b_spouse_age_year_end")).toMatchObject({
      unsupported: true,
    });
    expect(run.line("1.line.10a_your_age_year_end")).toBe(31);
  });
});

describe("Form 8862 and the child tax credits", () => {
  it("a ban stops the child tax credits: no Schedule 8812, no Part III", () => {
    const run = evaluate(lini, factsWith(lini, { [FORM_8862_KEYS.ctcBarredByIrs]: true }));
    expect(run.files("schedule-8812")).toBe(false);
    expect(run.form1040("line.19")).toBeUndefined();
    expect(run.form1040("line.28")).toBeUndefined();
    expect(run.line("0.line.2_claiming_ctc_actc_odc")).toBe(false);
    expect(run.line("1.line.12a_ctc_child_1_name")).toBeUndefined();
  });

  it("a child tax credit denial alone fills Part III only", () => {
    const run = evaluate(
      lini,
      factsWith(lini, {
        [EIC_KEYS.deniedInEarlierYear]: false,
        [FORM_8862_KEYS.aotcDeniedInEarlierYear]: false,
      }),
    );
    expect(run.line("0.line.2_claiming_eic")).toBe(false);
    expect(run.line("0.line.2_claiming_aotc")).toBe(false);
    expect(run.line("0.line.3_eic_only_income_misreported_no")).toBeUndefined();
    expect(run.line("1.line.12b_ctc_child_2_name")).toBe("Owen Thornbury");
    expect(run.line("2.line.18a_student_1_name")).toBeUndefined();
  });

  it("a child released by Form 8332 answers Yes on lines 14 and 15 (rule decision A89)", () => {
    const owen = makeDependentFactKey("owen");
    const run = evaluate(
      lini,
      factsWith(lini, {
        [owen]: { ...valueOf(lini, owen), monthsLivedWithYou: 4, form8332Release: true },
        [EIC_KEYS.deniedInEarlierYear]: false,
        [FORM_8862_KEYS.aotcDeniedInEarlierYear]: false,
      }),
    );
    expect(run.line("1.line.12b_ctc_child_2_name")).toBe("Owen Thornbury");
    expect(run.line("1.line.14_child_2_lived_with_you_yes")).toBe(true);
    expect(run.line("1.line.15_child_2_qualifying_child_yes")).toBe(true);
    expect(run.line("1.line.15_child_2_qualifying_child_no")).toBe(false);
  });

  it("line 12d is a gap with a fifth child, who needs a statement", () => {
    const mira = valueOf(lini, makeDependentFactKey("mira"));
    const extra = [1, 2, 3].map((index) =>
      row(lini, "dependents", makeDependentFactKey(`extra-${index}`), {
        ...mira,
        firstName: `Extra${index}`,
        ssn: `400-00-889${index}`,
      }),
    );
    const run = evaluate(lini, [...lini.facts, ...extra]);
    expect(run.line("1.line.12c_ctc_child_3_name")).toBe("Extra1 Thornbury");
    expect(run.field("form-8862", "1.line.12d_ctc_child_4_name")).toMatchObject({
      unsupported: true,
    });
  });
});

describe("Form 8862 and the AOTC", () => {
  it("a ban is a gap on Form 1040 line 29, never a credit", () => {
    const run = evaluate(lini, factsWith(lini, { [FORM_8862_KEYS.aotcBarredByIrs]: true }));
    expect(run.form1040Result("line.29")).toMatchObject({ unsupported: true });
    expect(run.line("0.line.2_claiming_aotc")).toBe(false);
  });
});
