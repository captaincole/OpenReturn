import { DEDUCTION_ITEMS, type ItemId, type ItemState } from "@openreturn/engine";
import {
  CA_MISC_DEDUCTION_KEYS,
  INVESTMENT_INTEREST_KEYS,
  MORTGAGE_KEYS,
} from "@openreturn/engine/facts";
import { describe, expect, it } from "vitest";
import { knownCategory } from "../../../../src/mastra/deductions/categories";
import {
  LIFE_QUESTIONS,
  lifeQuestionStatus,
  planLifeAnswers,
  type LifeQuestionId,
} from "../../../../src/mastra/deductions/lifeQuestions";

const YEAR = 2025;
const NOTE = "verbal, 2026-11-09";

const item = (id: ItemId, status: ItemState["status"]): ItemState => ({
  id,
  title: id,
  status,
  assumed: false,
  missing: [],
  federalLine: "",
  caLine: "",
});

const question = (id: LifeQuestionId) => LIFE_QUESTIONS.find((each) => each.id === id)!;
const none = { facts: new Map<string, unknown>(), assumptions: new Map<string, unknown>() };
const answer = (id: LifeQuestionId, yes: boolean) => ({ id, answer: yes, sourceNote: NOTE });

describe("the life questions and the engine's catalog", () => {
  const asked = DEDUCTION_ITEMS.filter((each) => each.amountKeys.length > 0);

  it("every item with an amount to ask has a life question that opens it", () => {
    const opened = new Set(LIFE_QUESTIONS.flatMap((each) => each.items));
    expect(asked.map((each) => each.id).filter((id) => !opened.has(id))).toEqual([]);
  });

  it("a no records 0 only for amounts of the question's own items, and for each item", () => {
    for (const each of LIFE_QUESTIONS) {
      const items = asked.filter((candidate) => each.items.includes(candidate.id));
      const amountKeys = items.flatMap((candidate) => candidate.amountKeys);
      expect(each.zeroKeys.filter((key) => !amountKeys.includes(key))).toEqual([]);
      const left = items.filter(
        (candidate) => !candidate.amountKeys.some((key) => each.zeroKeys.includes(key)),
      );
      expect(left).toEqual([]);
    }
  });

  it("every amount the engine can ask for has a category", () => {
    const keys = [
      ...asked.flatMap((each) => each.amountKeys),
      ...Object.values(MORTGAGE_KEYS),
      ...Object.values(INVESTMENT_INTEREST_KEYS),
      ...Object.values(CA_MISC_DEDUCTION_KEYS),
    ];
    expect(keys.filter((key) => knownCategory(key) === undefined)).toEqual([]);
    expect(knownCategory(MORTGAGE_KEYS.originationDateForm1098)).toBe("mortgage");
    expect(knownCategory(INVESTMENT_INTEREST_KEYS.investmentExpenses)).toBe("investment_income");
    expect(knownCategory("charitable.carryover")).toBe("charitable");
    expect(knownCategory(CA_MISC_DEDUCTION_KEYS.investmentFees)).toBe("other");
  });
});

describe("a life question's status", () => {
  const unaskedHome = [item("mortgage_interest", "unasked"), item("real_estate_tax", "unasked")];

  it("is unasked with no answer and no fact on its items", () => {
    expect(lifeQuestionStatus(question("owns_home"), new Map(), unaskedHome)).toBe("unasked");
  });

  it("is the recorded answer", () => {
    const yes = new Map([["deductions.life.owns_home", true]]);
    const no = new Map([["deductions.life.owns_home", false]]);
    expect(lifeQuestionStatus(question("owns_home"), yes, unaskedHome)).toBe("yes");
    expect(lifeQuestionStatus(question("owns_home"), no, unaskedHome)).toBe("no");
  });

  it("is settled when a fact arrived early for one of its items", () => {
    const items = [item("mortgage_interest", "open"), item("real_estate_tax", "unasked")];
    expect(lifeQuestionStatus(question("owns_home"), new Map(), items)).toBe("settled");
  });

  it("stays unasked for a question with no items until it is answered", () => {
    expect(lifeQuestionStatus(question("itemized_last_year"), new Map(), unaskedHome)).toBe(
      "unasked",
    );
  });
});

describe("what a batch of life answers records", () => {
  it("a no records the answer and a fact of 0 for each amount: a renter", () => {
    const plan = planLifeAnswers(YEAR, [answer("owns_home", false)], none);
    const zeroNote = `"Did you own your home in 2025?" No. ${NOTE}`;
    expect(plan).toEqual({
      facts: [
        { category: "other", key: "deductions.life.owns_home", value: false, sourceNote: NOTE },
        {
          category: "mortgage",
          key: "mortgage.interest_form_1098",
          value: 0,
          sourceNote: zeroNote,
        },
        {
          category: "state_local_tax",
          key: "state_local_tax.real_estate",
          value: 0,
          sourceNote: zeroNote,
        },
      ],
      conflicts: [],
    });
  });

  it("a yes records only the answer, also after an earlier no", () => {
    const afterNo = { ...none, facts: new Map([["charitable.cash", 0]]) };
    for (const stated of [none, afterNo]) {
      expect(planLifeAnswers(YEAR, [answer("gave_money", true)], stated)).toEqual({
        facts: [
          { category: "other", key: "deductions.life.gave_money", value: true, sourceNote: NOTE },
        ],
        conflicts: [],
      });
    }
  });

  it.each(["facts", "assumptions"] as const)(
    "a no against an amount stated in the %s records nothing for that question",
    (where) => {
      const stated = { ...none, [where]: new Map([["charitable.cash", 1200]]) };
      const plan = planLifeAnswers(
        YEAR,
        [answer("gave_money", false), answer("gave_things", false)],
        stated,
      );
      expect(plan.conflicts).toEqual([{ id: "gave_money", key: "charitable.cash", stated: 1200 }]);
      expect(plan.facts.map((fact) => fact.key)).toEqual([
        "deductions.life.gave_things",
        "charitable.noncash",
      ]);
    },
  );

  it("a no writes no second fact of 0", () => {
    const stated = { ...none, facts: new Map([["medical.expenses_total", 0]]) };
    const plan = planLifeAnswers(YEAR, [answer("medical", false)], stated);
    expect(plan.facts.map((fact) => fact.key)).toEqual(["deductions.life.medical"]);
  });
});
