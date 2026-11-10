import { describe, expect, it } from "vitest";
import {
  LIFE_QUESTIONS,
  type LifeQuestionId,
  type LifeQuestionStatus,
} from "../../../../src/mastra/deductions/lifeQuestions";
import {
  DOOR_ITEMS,
  NOTHING_ELSE_KEY,
  openDoorAsk,
  planNamedExpenses,
  type NamedExpense,
} from "../../../../src/mastra/deductions/openDoor";

const YEAR = 2025;
const NOTE = "verbal, 2026-11-09";

const expense = (name: string, slug: string, more: Partial<NamedExpense>): NamedExpense => ({
  name,
  slug,
  taxpayerWords: `I paid for ${name}`,
  outcome: "not_sure",
  rationale: `Why ${name}.`,
  confidence: "medium",
  ...more,
});

const everyStatus = (status: LifeQuestionStatus, changed: Partial<Record<string, string>> = {}) =>
  new Map(
    LIFE_QUESTIONS.map((question) => [
      question.id,
      (changed[question.id] ?? status) as LifeQuestionStatus,
    ]),
  ) as ReadonlyMap<LifeQuestionId, LifeQuestionStatus>;

describe("the open door's question", () => {
  it("says what Cade does with an answer on the first ask only", () => {
    const first = openDoorAsk(YEAR, new Map());
    expect(first?.ask).toContain("2025");
    expect(first?.why).toContain("CPA");
    expect(first?.done).toBe("Nothing else");

    const again = openDoorAsk(YEAR, new Map([["deductions.named.home-office", "words"]]));
    expect(again).toMatchObject({ ask: "Anything else?", done: "That's all" });
    expect(again?.why).toBeUndefined();
    expect(again?.suggestions).toEqual(first?.suggestions);
  });

  it("is closed once the taxpayer said that nothing else is left", () => {
    expect(openDoorAsk(YEAR, new Map([[NOTHING_ELSE_KEY, true]]))).toBeUndefined();
    expect(openDoorAsk(YEAR, new Map([[NOTHING_ELSE_KEY, false]]))).toBeDefined();
  });

  it("offers every catalog item with a life question as a place to count", () => {
    expect(new Set(DOOR_ITEMS)).toEqual(new Set(LIFE_QUESTIONS.flatMap((each) => each.items)));
  });
});

describe("planning the named expenses", () => {
  it("plans one fact and one decision per expense, and the decision cites the fact", () => {
    const { expenses, problems } = planNamedExpenses(
      [expense("Commuting", "commuting", { outcome: "does_not_count" })],
      NOTE,
      everyStatus("no"),
    );
    expect(problems).toEqual([]);
    expect(expenses).toEqual([
      {
        name: "Commuting",
        outcome: "does_not_count",
        fact: {
          category: "other",
          key: "deductions.named.commuting",
          value: "I paid for Commuting",
          sourceNote: NOTE,
        },
        decision: {
          decisionKey: "decisions.deductions.named.commuting",
          decision: { outcome: "does_not_count" },
          rationale: "Why Commuting.",
          supportingFactKeys: ["deductions.named.commuting"],
          confidence: "medium",
        },
        opens: undefined,
        question: undefined,
      },
    ]);
  });

  it("leaves a note for the return's conversation or the CPA, with the taxpayer's words", () => {
    const { expenses } = planNamedExpenses(
      [
        expense("Student loan interest", "student-loan-interest", {
          outcome: "counts_elsewhere",
          where: "Schedule 1",
          // `item` belongs to counts_here only: the decision leaves it out.
          item: "gifts_cash",
        }),
        expense("Home office", "home-office", { outcome: "not_sure", where: "nowhere" }),
      ],
      NOTE,
      everyStatus("no"),
    );
    const [loan, office] = expenses;
    expect(loan.decision.decision).toEqual({ outcome: "counts_elsewhere", where: "Schedule 1" });
    expect(loan.question?.question).toContain("it may count here: Schedule 1");
    expect(loan.question?.context).toBe(`"I paid for Student loan interest" (${NOTE})`);
    expect(loan.opens).toBeUndefined();
    expect(office.decision.decision).toEqual({ outcome: "not_sure" });
    expect(office.question?.question).toMatch(/^For the CPA: /);
  });

  it("opens the life question of an item no yes has opened", () => {
    const gift = expense("Church gift", "church-gift", {
      outcome: "counts_here",
      item: "gifts_cash",
    });
    const opens = (statuses: ReadonlyMap<LifeQuestionId, LifeQuestionStatus>) =>
      planNamedExpenses([gift], NOTE, statuses).expenses[0].opens;
    expect(opens(everyStatus("no"))).toBe("gave_money");
    expect(opens(everyStatus("unasked"))).toBe("gave_money");
    expect(opens(everyStatus("no", { gave_money: "yes" }))).toBeUndefined();
    expect(opens(everyStatus("no", { gave_money: "settled" }))).toBeUndefined();
    expect(planNamedExpenses([gift], NOTE, everyStatus("no")).expenses[0].question).toBeUndefined();
  });

  it("returns a problem, and plans nothing, for an expense that lacks what its outcome needs", () => {
    const { expenses, problems } = planNamedExpenses(
      [
        expense("???", "", {}),
        expense("Union dues", "union-dues", { outcome: "counts_here" }),
        expense("Tutoring", "tutoring", { outcome: "counts_elsewhere" }),
        expense("Commuting", "commuting", { outcome: "does_not_count" }),
      ],
      NOTE,
      everyStatus("no"),
    );
    expect(problems.map((each) => each.name)).toEqual(["???", "Union dues", "Tutoring"]);
    expect(expenses.map((each) => each.name)).toEqual(["Commuting"]);
  });
});
