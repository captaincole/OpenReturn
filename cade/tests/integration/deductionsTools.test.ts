import { RequestContext } from "@mastra/core/request-context";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import type { CadeRequestContext } from "../../src/mastra/server/requestContext";
import { alexDecisions, alexFacts, fact, HOME_AMOUNTS, YEAR } from "./deductionsFixtures";

/* The tools read and write a real app.db: a temp file, set before the db modules load. */
const dir = mkdtempSync(path.join(tmpdir(), "openreturn-deductions-test-"));
process.env.APP_DB_PATH = path.join(dir, "app.db");
process.env.MASTRA_DB_PATH = path.join(dir, "mastra.db");
/* The closing decisions get the grounding review in the app; Canon is not part of this test. */
process.env.DECISION_REVIEW = "off";

const filings = await import("../../src/mastra/db/filings");
const taxFacts = await import("../../src/mastra/db/taxFacts");
const decisions = await import("../../src/mastra/db/aiDecisions");
const tools = await import("../../src/mastra/tools/deductions");
const { requestDocumentUploadFor } = await import("../../src/mastra/tools/requestDocument");
const { dismissRequestedAction } = await import("../../src/mastra/tools/dismissRequestedAction");
const { getAppDb } = await import("../../src/mastra/db/appDb");
const { ITEMIZE_KEY, SCHEDULE_A_KEY } = await import("../../src/mastra/deductions/closing");

const userId = "owner-test";
const filingId = crypto.randomUUID();
const scope = { userId, filingId };
const owned = { userId, filingId, taxYear: YEAR };

const context = {
  requestContext: new RequestContext<CadeRequestContext>([
    ["userId", userId],
    ["userEmail", "alex@example.com"],
  ]),
};

type Output = Record<string, unknown> & { next: { step: string } };
const call = (tool: unknown, input: unknown = {}) =>
  (tool as { execute: (input: unknown, context: unknown) => Promise<Output> }).execute(
    input,
    context,
  );

const seedFacts = (rows: typeof alexFacts) =>
  taxFacts.recordFacts(
    scope,
    rows.map(({ category, key, value, sourceNote }) => ({
      ...owned,
      id: crypto.randomUUID(),
      category,
      key,
      value,
      sourceNote: sourceNote ?? undefined,
    })),
  );

/* The newest row of each key: the rows come newest first, and a Map keeps the last entry. */
const storedFacts = async () => {
  const newestFirst = await taxFacts.listFacts(scope, { filingId, limit: 500 });
  return new Map([...newestFirst].reverse().map((row) => [row.key, row]));
};

const storedDecisions = async (decisionKey: string) =>
  (await decisions.listDecisions(scope, { filingId, limit: 500 })).filter(
    (row) => row.decisionKey === decisionKey,
  );

/* Each requested action as "conversation document status", sorted. */
const cards = async () => {
  const res = await getAppDb().execute({
    sql: "SELECT conversation, document_type, status FROM requested_actions WHERE filing_id = ?",
    args: [filingId],
  });
  return res.rows.map((row) => `${row.conversation} ${row.document_type} ${row.status}`).sort();
};

const upload = (documentType: string) => ({
  year: YEAR,
  documentType,
  title: `Upload your ${YEAR} Form ${documentType}`,
  detail: "The return needs its amounts.",
});

const no = (id: string) => ({ id, answer: false, sourceNote: "No, verbal, 2026-11-09" });

const named = (name: string, taxpayerWords: string, outcome: string, more: object = {}) => ({
  name,
  taxpayerWords,
  outcome,
  rationale: `Why ${name} is ${outcome}.`,
  confidence: "medium",
  ...more,
});

beforeAll(async () => {
  await filings.createOwnerFiling({ ...owned });
  await seedFacts(alexFacts);
  for (const row of alexDecisions) {
    await decisions.recordDecision(scope, {
      ...owned,
      id: crypto.randomUUID(),
      decisionKey: row.decisionKey,
      decision: row.decision,
      rationale: row.rationale,
      supportingFactKeys: row.supportingFactKeys,
      confidence: row.confidence,
    });
  }
});

/* One conversation, in order: each test continues from the rows the one before it wrote. */
describe("the deductions tools, over one filing", () => {
  it("get-deductions asks every life question on a return with no deduction facts", async () => {
    const state = await call(tools.getDeductions);
    expect(state.taxYear).toBe(YEAR);
    expect(state.next.step).toBe("ask_life_questions");
    expect((state.lifeQuestions as { status: string }[]).map((each) => each.status)).toEqual(
      Array.from({ length: 9 }, () => "unasked"),
    );
    expect(state.recordedDecisions).toEqual({ itemizeOrStandard: null, scheduleAFiles: null });
  });

  it("close-deductions records nothing before the conversation is ready", async () => {
    const result = await call(tools.closeDeductions);
    expect(result).toMatchObject({ closed: false, recorded: [] });
    expect(result.next.step).toBe("ask_life_questions");
    expect(await storedDecisions(ITEMIZE_KEY)).toEqual([]);
  });

  it("a requested document records its conversation, and each conversation has one card", async () => {
    const first = await call(requestDocumentUploadFor("deductions"), upload("1098"));
    expect(first.requested).toBe(true);
    const repeat = await call(requestDocumentUploadFor("deductions"), upload("1098"));
    expect(repeat).toEqual({ id: first.id, requested: false });
    expect((await call(requestDocumentUploadFor("return"), upload("1098"))).requested).toBe(true);
    expect(await cards()).toEqual(["deductions 1098 open", "return 1098 open"]);

    /* The document is in: its card closes in both conversations. */
    const dismissed = await call(dismissRequestedAction, { documentType: "1098" });
    expect(dismissed).toEqual({ dismissed: true, closed: 2 });
    expect(await cards()).toEqual(["deductions 1098 resolved", "return 1098 resolved"]);
  });

  it("answer-life-questions writes each no as facts of 0, and refuses a no against a stated amount", async () => {
    await seedFacts(HOME_AMOUNTS);
    const result = await call(tools.answerLifeQuestions, {
      answers: [
        "owns_home",
        "ca_vehicle",
        "gave_money",
        "gave_things",
        "gift_carryover",
        "medical",
      ].map(no),
    });
    expect(result.conflicts).toEqual([
      { id: "owns_home", key: "mortgage.interest_form_1098", stated: 7000 },
      { id: "owns_home", key: "state_local_tax.real_estate", stated: 3000 },
    ]);
    expect(result.recorded).toEqual([
      "deductions.life.ca_vehicle",
      "state_local_tax.personal_property",
      "deductions.life.gave_money",
      "charitable.cash",
      "deductions.life.gave_things",
      "charitable.noncash",
      "deductions.life.gift_carryover",
      "charitable.carryover",
      "deductions.life.medical",
      "medical.expenses_total",
    ]);

    const facts = await storedFacts();
    expect(facts.has("deductions.life.owns_home")).toBe(false);
    expect(facts.get("mortgage.interest_form_1098")?.value).toBe(7000);
    expect(facts.get("deductions.life.gave_money")).toMatchObject({
      category: "other",
      value: false,
      sourceNote: "No, verbal, 2026-11-09",
    });
    expect(facts.get("charitable.cash")).toMatchObject({
      category: "charitable",
      value: 0,
      sourceNote: '"Did you give money to a charity in 2025?" No. No, verbal, 2026-11-09',
    });
    /* Three questions are left; the Form 1098 facts settled the home. */
    expect(result.next).toMatchObject({
      step: "ask_life_questions",
      questions: [{ id: "itemized_last_year" }, { id: "margin_loan" }, { id: "investment_fees" }],
    });
  });

  it("record-named-expenses records each outcome as a decision over the taxpayer's words, and no amount", async () => {
    const answered = await call(tools.answerLifeQuestions, {
      answers: ["itemized_last_year", "margin_loan", "investment_fees"].map(no),
    });
    expect(answered.next).toMatchObject({ step: "ask_anything_else", done: "Nothing else" });

    const result = await call(tools.recordNamedExpenses, {
      expenses: [
        named("Home office", "I work from a room at home", "not_sure"),
        named("Student loan interest", "I paid interest on my student loan", "counts_elsewhere", {
          where: "Schedule 1, student loan interest deduction",
        }),
        named("Commuting", "I drive to the office every day", "does_not_count"),
        named("Church gift", "I gave $250 to my church", "counts_here", { item: "gifts_cash" }),
        named("Union dues", "I pay union dues", "counts_here"),
      ],
      nothingElse: true,
      sourceNote: "verbal, 2026-11-09",
    });
    expect(result.recorded).toEqual([
      "deductions.named.home-office",
      "deductions.named.student-loan-interest",
      "deductions.named.commuting",
      "deductions.named.church-gift",
      "deductions.life.gave_money",
    ]);
    expect(result.decisions).toEqual([
      "decisions.deductions.named.home-office",
      "decisions.deductions.named.student-loan-interest",
      "decisions.deductions.named.commuting",
      "decisions.deductions.named.church-gift",
    ]);
    /* A problem records nothing for its expense, and keeps the door open. */
    expect(result.problems).toEqual([
      {
        name: "Union dues",
        problem: "counts_here needs `item`. An expense that no item covers is not_sure.",
      },
    ]);
    expect(result.next).toMatchObject({ step: "ask_anything_else", ask: "Anything else?" });

    const facts = await storedFacts();
    expect(facts.get("deductions.named.church-gift")).toMatchObject({
      category: "other",
      value: "I gave $250 to my church",
      sourceNote: "verbal, 2026-11-09",
    });
    expect(facts.has("deductions.named.union-dues")).toBe(false);
    expect(facts.has("deductions.nothing_else")).toBe(false);
    /* The door wrote the yes; the $250 in the taxpayer's words is not an amount on the item. */
    expect(facts.get("deductions.life.gave_money")?.value).toBe(true);
    expect(facts.get("charitable.cash")?.value).toBe(0);

    const [loan] = await storedDecisions("decisions.deductions.named.student-loan-interest");
    expect(loan).toMatchObject({
      decision: {
        outcome: "counts_elsewhere",
        where: "Schedule 1, student loan interest deduction",
      },
      supportingFactKeys: ["deductions.named.student-loan-interest"],
      confidence: "medium",
    });
    const [gift] = await storedDecisions("decisions.deductions.named.church-gift");
    expect(gift.decision).toEqual({ outcome: "counts_here", item: "gifts_cash" });

    /* Two notes: one for the return's conversation, one for the CPA. */
    const questions = await taxFacts.listOpenQuestions(scope);
    expect(questions.map((each) => each.question).sort()).toEqual([
      'For the CPA: the taxpayer named "Home office" in the deductions conversation, and Cade could not say whether it counts.',
      'The taxpayer named "Student loan interest" in the deductions conversation. It is not an itemized deduction, and it may count here: Schedule 1, student loan interest deduction. Take it up in the return\'s conversation.',
    ]);
    expect(questions.map((each) => each.context)).toContain(
      '"I work from a room at home" (verbal, 2026-11-09)',
    );
  });

  it("nothing else closes the door, and the item the door opened asks its exact amount", async () => {
    const input = { expenses: [], nothingElse: true, sourceNote: "verbal, 2026-11-09" };
    const result = await call(tools.recordNamedExpenses, input);
    expect(result.recorded).toEqual(["deductions.nothing_else"]);
    /* The fact of 0 from the earlier no is still there: only an exact amount replaces it. */
    expect(result.next).toEqual({
      step: "ask_amounts",
      items: [
        {
          item: "gifts_cash",
          title: expect.any(String),
          keys: [{ key: "charitable.cash", category: "charitable", roughAllowed: false }],
        },
      ],
    });
    expect((await call(tools.recordNamedExpenses, input)).recorded).toEqual([]);
  });

  it("close-deductions records both decisions when only California itemizes", async () => {
    await seedFacts([fact("charitable.cash", 250, "charitable")]);
    expect((await call(tools.getDeductions)).next.step).toBe("close");
    await call(requestDocumentUploadFor("deductions"), upload("1098"));
    await call(requestDocumentUploadFor("return"), upload("W-2"));

    const result = await call(tools.closeDeductions);
    expect(result).toMatchObject({
      closed: true,
      recorded: [ITEMIZE_KEY, SCHEDULE_A_KEY],
      next: { step: "closed" },
    });
    expect(result.summary).toBe(
      "Deductions are done. You take the standard deduction on the federal return ($15,750 against $14,285 itemized) and itemize on the California return ($10,250 against the $5,706 standard deduction). Schedule A is still filled in: the California return starts from it. 3 records are on the list for the CPA; nothing is attached to the return.",
    );
    expect((result.records as { item: string }[]).map((record) => record.item)).toEqual([
      "real_estate_tax",
      "mortgage_interest",
      "gifts_cash",
    ]);

    const [itemize] = await storedDecisions(ITEMIZE_KEY);
    expect(itemize.decision).toBe("standard");
    expect(itemize.rationale).toBe(result.summary);
    expect(itemize.sourceNote).toContain("Schedule A line 17");
    expect((await storedDecisions(SCHEDULE_A_KEY)).map((row) => row.decision)).toEqual([true]);

    /* No rough amount is in use, so what this conversation asked for closes with it. */
    expect(await cards()).toEqual([
      "deductions 1098 dismissed",
      "deductions 1098 resolved",
      "return 1098 resolved",
      "return W-2 open",
    ]);

    const state = await call(tools.getDeductions);
    expect(state.next.step).toBe("closed");
    expect(state.recordedDecisions).toEqual({
      itemizeOrStandard: "standard",
      scheduleAFiles: true,
    });
  });

  it("close-deductions gives the summary again and writes nothing twice", async () => {
    const again = await call(tools.closeDeductions);
    expect(again).toMatchObject({ closed: true, recorded: [], next: { step: "closed" } });
    expect(again.summary).toContain("itemize on the California return");
    expect(await storedDecisions(ITEMIZE_KEY)).toHaveLength(1);
    expect(await storedDecisions(SCHEDULE_A_KEY)).toHaveLength(1);
  });
});
