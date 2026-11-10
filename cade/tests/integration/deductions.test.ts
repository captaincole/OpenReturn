import { evaluateScenario, type EvaluatedScenario } from "@openreturn/engine";
import { tcbCa005Scenario } from "@openreturn/engine/scenarios";
import { describe, expect, it } from "vitest";
import { ITEMIZE_KEY, planClosing, SCHEDULE_A_KEY } from "../../src/mastra/deductions/closing";
import { deductionsFlow } from "../../src/mastra/deductions/flow";
import { deductionsView } from "../../src/mastra/deductions/state";
import {
  alex,
  alexDecisions,
  decision,
  EVERY_NO,
  fact,
  HOME_AMOUNTS,
  HOMEOWNER,
  NOTHING_BUT_A_HOME,
  NOTHING_ELSE,
  RENTER,
  type FactRow,
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
      "gift_carryover",
      "medical",
      "margin_loan",
      "investment_fees",
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

  it("opens the door after the life questions, and keeps it open until nothing else is left", () => {
    const answered = RENTER.filter((each) => each !== NOTHING_ELSE);
    const first = deductionsFlow(alex(answered)).next;
    expect(first).toMatchObject({
      step: "ask_anything_else",
      ask: "Anything else you paid for in 2025 that you think might count? Say it in your own words.",
      done: "Nothing else",
    });
    expect(first.step === "ask_anything_else" && first.why).toBeTruthy();
    expect(first.step === "ask_anything_else" && first.suggestions).toContain("Home office");

    /* After one named expense the door asks again, in fewer words. */
    const named = fact("deductions.named.home-office", "I work from a room at home");
    const again = deductionsFlow(alex([named, ...answered])).next;
    expect(again).toMatchObject({ step: "ask_anything_else", ask: "Anything else?" });
    expect(again.step === "ask_anything_else" && again.why).toBeUndefined();

    /* Nothing else is left: the door closes, and the named expense changes no later step. */
    expect(deductionsFlow(alex([named, ...RENTER])).next.step).toBe("close");
  });

  it("asks the amounts a yes opened, with each key's category", () => {
    const answers = [
      NOTHING_ELSE,
      fact("deductions.life.owns_home", true),
      ...EVERY_NO,
      ...NOTHING_BUT_A_HOME,
    ];
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

  it("asks the amounts of a no that became a yes, and does not close on the old facts of 0", () => {
    const older = (row: FactRow): FactRow => ({ ...row, createdAt: "2026-11-01T10:00:00.000Z" });
    const yes = {
      ...fact("deductions.life.owns_home", true),
      createdAt: "2026-11-02T10:00:00.000Z",
    };
    const afterYes = alex([yes, ...RENTER.map(older)]);
    expect(deductionsFlow(afterYes).next).toEqual({
      step: "ask_amounts",
      items: [
        {
          item: "real_estate_tax",
          title: "Real estate tax paid on your home or land",
          keys: [
            {
              key: "state_local_tax.real_estate",
              category: "state_local_tax",
              roughAllowed: false,
            },
          ],
        },
        {
          item: "mortgage_interest",
          title: "Mortgage interest on your home (Form 1098)",
          keys: [{ key: "mortgage.interest_form_1098", category: "mortgage", roughAllowed: false }],
        },
      ],
    });

    /* A 0 the taxpayer states after the yes is an answer: a home with no mortgage. */
    const newer = (row: FactRow): FactRow => ({ ...row, createdAt: "2026-11-03T10:00:00.000Z" });
    const answered = alex([
      newer(fact("mortgage.interest_form_1098", 0, "mortgage")),
      newer(fact("state_local_tax.real_estate", 3000, "state_local_tax")),
      yes,
      ...RENTER.map(older),
    ]);
    expect(deductionsFlow(answered).next.step).toBe("close");
  });

  it("does not close while a catalog item was never asked: the two with no document", () => {
    const withoutTwo = RENTER.filter(
      (each) =>
        !each.key.endsWith("gift_carryover") &&
        !each.key.endsWith("investment_fees") &&
        each.key !== "charitable.carryover",
    );
    const { next } = deductionsFlow(alex(withoutTwo));
    expect(next.step === "ask_life_questions" && next.questions.map(({ id }) => id)).toEqual([
      "gift_carryover",
      "investment_fees",
    ]);

    /* A yes asks the amount; the fees are recorded under "other". */
    const yeses = ["gift_carryover", "investment_fees"].map((id) =>
      fact(`deductions.life.${id}`, true),
    );
    expect(deductionsFlow(alex([...yeses, ...withoutTwo])).next).toEqual({
      step: "ask_amounts",
      items: [
        {
          item: "gift_carryover",
          title: "Gifts carried over from last year's return",
          keys: [{ key: "charitable.carryover", category: "charitable", roughAllowed: true }],
        },
        {
          item: "ca_investment_fees",
          title: "Investment advisory and management fees from taxable accounts",
          keys: [{ key: "misc_deductions.investment_fees", category: "other", roughAllowed: true }],
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
    /* Her documents settled six questions; three were never answered. */
    const { next } = deductionsFlow(madison);
    expect(next.step === "ask_life_questions" && next.questions.map(({ id }) => id)).toEqual([
      "itemized_last_year",
      "ca_vehicle",
      "gift_carryover",
    ]);
  });
});

describe("what the web app reads", () => {
  it("holds the paragraph back until the conversation is closed, and lists the records before", () => {
    const open = deductionsView(alex(HOMEOWNER));
    expect(open.next.step).toBe("close");
    expect(open.summary).toBeNull();
    expect(open.records.map((record) => record.item)).toEqual([
      "real_estate_tax",
      "mortgage_interest",
    ]);
    expect(open.comparison.ca).toMatchObject({ itemized: 10000, recommendation: "itemize" });

    const closed = deductionsView(alex(HOMEOWNER, recordedFrom(alex(HOMEOWNER))));
    expect(closed.next.step).toBe("closed");
    expect(closed.summary).toBe(planClosing(alex(HOMEOWNER))!.summary);
  });

  it("has no paragraph and no records while the comparison waits for the return", () => {
    const view = deductionsView(alex());
    expect(view.summary).toBeNull();
    expect(view.records).toEqual([]);
    expect(view.namedExpenses).toEqual([]);
  });

  it("lists each expense the taxpayer named, with its outcome once Cade decided it", () => {
    const view = deductionsView(
      alex(
        [
          fact("deductions.named.home-office", "I work from a room at home"),
          fact("deductions.named.gym", "my gym membership"),
        ],
        [
          decision("decisions.deductions.named.home-office", {
            outcome: "counts_elsewhere",
            where: "Schedule C, when you have a business",
          }),
        ],
      ),
    );
    expect(view.namedExpenses).toEqual([
      {
        slug: "home-office",
        words: "I work from a room at home",
        outcome: "counts_elsewhere",
        where: "Schedule C, when you have a business",
      },
      { slug: "gym", words: "my gym membership", outcome: null, where: null },
    ]);
  });
});
