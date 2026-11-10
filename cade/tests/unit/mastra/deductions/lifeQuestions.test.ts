import type { ItemId, ItemState } from "@openreturn/engine";
import { describe, expect, it } from "vitest";
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
    const plan = planLifeAnswers(YEAR, [answer("owns_home", false)], none, []);
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
      atZero: [],
    });
  });

  it("a yes records only the answer", () => {
    const plan = planLifeAnswers(YEAR, [answer("gave_money", true)], none, [
      item("gifts_cash", "unasked"),
    ]);
    expect(plan.facts).toEqual([
      { category: "other", key: "deductions.life.gave_money", value: true, sourceNote: NOTE },
    ]);
    expect(plan.atZero).toEqual([]);
  });

  it.each(["facts", "assumptions"] as const)(
    "a no against an amount stated in the %s records nothing for that question",
    (where) => {
      const stated = { ...none, [where]: new Map([["charitable.cash", 1200]]) };
      const plan = planLifeAnswers(
        YEAR,
        [answer("gave_money", false), answer("gave_things", false)],
        stated,
        [],
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
    const plan = planLifeAnswers(YEAR, [answer("medical", false)], stated, []);
    expect(plan.facts.map((fact) => fact.key)).toEqual(["deductions.life.medical"]);
  });

  it("a yes after a no names the items still at 0", () => {
    const plan = planLifeAnswers(YEAR, [answer("owns_home", true)], none, [
      item("mortgage_interest", "closed"),
      item("real_estate_tax", "closed"),
      item("gifts_cash", "closed"),
    ]);
    expect(plan.atZero).toEqual([
      { id: "owns_home", items: ["mortgage_interest", "real_estate_tax"] },
    ]);
  });
});
