import { evaluateScenario, type EvaluatedScenario } from "@openreturn/engine";
import { tcbCa005Scenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import { ITEMIZE_KEY, planClosing, SCHEDULE_A_KEY } from "../../src/mastra/deductions/closing";
import { deductionsFlow } from "../../src/mastra/deductions/flow";
import {
  alex,
  alexDecisions,
  decision,
  EVERY_NO,
  fact,
  HOME_AMOUNTS,
  HOMEOWNER,
  NOTHING_BUT_A_HOME,
  RENTER,
} from "./deductionsFixtures";

const statuses = (scenario: EvaluatedScenario) =>
  Object.fromEntries(
    deductionsFlow(scenario).lifeQuestions.map((question) => [question.id, question.status]),
  );

const lineValue = (scenario: EvaluatedScenario, formId: string, fieldId: string) => {
  const field = scenario.forms.get(formId)?.fields.find((each) => each.fieldId === fieldId);
  return field?.result.ok ? field.result.value : undefined;
};

/* The decisions a closing plan records, as the rows the engine reads next. */
const recordedFrom = (scenario: EvaluatedScenario) =>
  planClosing(scenario)!.decisions.map((planned) =>
    decision(planned.decisionKey, planned.decision),
  );

describe("the next step of the deductions conversation", () => {
  it("asks every life question when nothing is known", () => {
    const { next } = deductionsFlow(alex());
    expect(next.step).toBe("ask_life_questions");
    expect(next.step === "ask_life_questions" && next.questions.map(({ id }) => id)).toEqual([
      "itemized_last_year",
      "owns_home",
      "ca_vehicle",
      "gave_money",
      "gave_things",
      "medical",
      "margin_loan",
    ]);
  });

  it("never asks a question a fact already settled: a Form 1098 before 'do you own your home?'", () => {
    const scenario = alex(HOME_AMOUNTS);
    expect(statuses(scenario).owns_home).toBe("settled");
    const { next } = deductionsFlow(scenario);
    expect(next.step === "ask_life_questions" && next.questions.map(({ id }) => id)).not.toContain(
      "owns_home",
    );
  });

  it("asks the amounts a yes opened, with each key's category", () => {
    const answers = [fact("deductions.life.owns_home", true), ...EVERY_NO, ...NOTHING_BUT_A_HOME];
    expect(deductionsFlow(alex(answers)).next).toEqual({
      step: "ask_amounts",
      items: [
        {
          item: "real_estate_tax",
          title: "Real estate tax paid on your home or land",
          keys: [
            { key: "state_local_tax.real_estate", category: "state_local_tax", roughAllowed: true },
          ],
        },
        {
          item: "mortgage_interest",
          title: "Mortgage interest on your home (Form 1098)",
          keys: [{ key: "mortgage.interest_form_1098", category: "mortgage", roughAllowed: true }],
        },
      ],
    });

    /* Interest above 0 opens the loan balance: the $750,000 limit reads it. */
    const withInterest = alex([HOME_AMOUNTS[0], HOME_AMOUNTS[2], ...answers]);
    expect(deductionsFlow(withInterest).next).toEqual({
      step: "ask_amounts",
      items: [
        {
          item: "mortgage_interest",
          title: "Mortgage interest on your home (Form 1098)",
          keys: [
            {
              key: "mortgage.outstanding_principal_form_1098",
              category: "mortgage",
              roughAllowed: true,
            },
          ],
        },
      ],
    });
  });

  it("waits for the return when the comparison has no filing status", () => {
    const scenario = alex(RENTER);
    const withoutStatus = evaluateScenario({
      filing: scenario.filing,
      facts: scenario.facts,
      decisions: alexDecisions.filter(
        (each) => each.decisionKey !== "decisions.scope.filing_status",
      ),
      authEmail: null,
    });
    expect(deductionsFlow(withoutStatus).next.step).toBe("wait_for_return");
  });

  it("asks the exact amount behind every rough amount when a return itemizes", () => {
    const rough = HOME_AMOUNTS.slice(0, 2);
    const scenario = alex(
      HOMEOWNER.filter((each) => !rough.includes(each)),
      [],
      rough,
    );
    expect(deductionsFlow(scenario).next).toEqual({
      step: "get_exact_amounts",
      items: [
        {
          item: "mortgage_interest",
          title: "Mortgage interest on your home (Form 1098)",
          keys: [
            { key: "mortgage.interest_form_1098", category: "mortgage", roughAllowed: false },
            {
              key: "mortgage.outstanding_principal_form_1098",
              category: "mortgage",
              roughAllowed: false,
            },
          ],
        },
      ],
    });
  });

  it("closes over a rough amount that cannot change two standard deductions", () => {
    const cash = fact("charitable.cash", 200, "charitable");
    const scenario = alex(
      RENTER.filter((each) => each.key !== cash.key),
      [],
      [cash],
    );
    expect(deductionsFlow(scenario).next.step).toBe("close");
    expect(planClosing(scenario)!.summary).toContain(
      "1 rough amount is still in use. They do not change this result, but each needs its exact amount before the return is ready to file.",
    );
  });
});

describe("closing the deductions conversation", () => {
  it("a renter takes both standard deductions, and no records go to the CPA", () => {
    const scenario = alex(RENTER);
    expect(deductionsFlow(scenario).next.step).toBe("close");
    const plan = planClosing(scenario)!;
    expect(plan.summary).toBe(
      "Deductions are done. You take the standard deduction on both returns: federal $15,750 against $4,035 itemized, California $5,706 against $0 itemized.",
    );
    expect(plan.records).toEqual([]);
    expect(plan.decisions.map((each) => [each.decisionKey, each.decision])).toEqual([
      [ITEMIZE_KEY, "standard"],
    ]);
    expect(deductionsFlow(alex(RENTER, recordedFrom(scenario))).next.step).toBe("closed");
  });

  it("federal standard with California itemized files Schedule A for California", () => {
    const scenario = alex(HOMEOWNER);
    const plan = planClosing(scenario)!;
    expect(plan.summary).toBe(
      "Deductions are done. You take the standard deduction on the federal return ($15,750 against $14,035 itemized) and itemize on the California return ($10,000 against the $5,706 standard deduction). Schedule A is still filled in: the California return starts from it. 2 records are on the list for the CPA; nothing is attached to the return.",
    );
    expect(plan.decisions.map((each) => [each.decisionKey, each.decision])).toEqual([
      [ITEMIZE_KEY, "standard"],
      [SCHEDULE_A_KEY, true],
    ]);
    expect(plan.records.map((record) => [record.item, record.amount])).toEqual([
      ["real_estate_tax", 3000],
      ["mortgage_interest", 7000],
    ]);

    /* The engine reads the recorded decisions: each return takes its own larger deduction. */
    const closed = alex(HOMEOWNER, recordedFrom(scenario));
    expect(lineValue(closed, "form-1040", "form-1040.line.12e")).toBe(15750);
    expect(lineValue(closed, "form-540", "form-540.line.18_deductions")).toBe(10000);
    expect(deductionsFlow(closed).next.step).toBe("closed");
  });

  it("without the Schedule A decision, California loses its itemized deductions", () => {
    const standardOnly = alex(HOMEOWNER, [decision(ITEMIZE_KEY, "standard")]);
    expect(lineValue(standardOnly, "form-540", "form-540.line.18_deductions")).toBe(5706);
    expect(deductionsFlow(standardOnly).next.step).toBe("close");
  });

  it("Madison itemizes on both returns, and her recorded decisions already say so", () => {
    const { taxYear, facts, decisions } = tcbCa005Scenario;
    const madison = evaluateScenario({
      filing: { id: "madison", taxYear },
      facts,
      decisions,
      authEmail: null,
    });
    const plan = planClosing(madison)!;
    expect(plan.summary).toBe(
      "Deductions are done. You itemize on both returns: federal $49,940 against the $31,500 standard deduction, California $41,859 against $11,412. 5 records are on the list for the CPA; nothing is attached to the return.",
    );
    expect(plan.decisions).toEqual([]);
    /* Her documents settled five questions; two were never answered. */
    const { next } = deductionsFlow(madison);
    expect(next.step === "ask_life_questions" && next.questions.map(({ id }) => id)).toEqual([
      "itemized_last_year",
      "ca_vehicle",
    ]);
  });
});
