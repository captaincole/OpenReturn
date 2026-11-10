import { RequestContext } from "@mastra/core/request-context";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import type { CadeRequestContext } from "../../src/mastra/server/requestContext";
import { alexDecisions, alexFacts, HOME_AMOUNTS, YEAR } from "./deductionsFixtures";

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

const storedFacts = async () =>
  new Map((await taxFacts.listFacts(scope, { filingId, limit: 500 })).map((row) => [row.key, row]));

const storedDecisions = async (decisionKey: string) =>
  (await decisions.listDecisions(scope, { filingId, limit: 500 })).filter(
    (row) => row.decisionKey === decisionKey,
  );

const no = (id: string) => ({ id, answer: false, sourceNote: "No, verbal, 2026-11-09" });

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
      Array.from({ length: 7 }, () => "unasked"),
    );
    expect(state.recordedDecisions).toEqual({ itemizeOrStandard: null, scheduleAFiles: null });
  });

  it("close-deductions records nothing before the conversation is ready", async () => {
    const result = await call(tools.closeDeductions);
    expect(result).toMatchObject({ closed: false, recorded: [] });
    expect(result.next.step).toBe("ask_life_questions");
    expect(await storedDecisions(ITEMIZE_KEY)).toEqual([]);
  });

  it("answer-life-questions writes each no as facts of 0, and refuses a no against a stated amount", async () => {
    await seedFacts(HOME_AMOUNTS);
    const result = await call(tools.answerLifeQuestions, {
      answers: ["owns_home", "ca_vehicle", "gave_money", "gave_things", "medical"].map(no),
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
    /* Two questions are left; the Form 1098 facts settled the home. */
    expect(result.next).toMatchObject({
      step: "ask_life_questions",
      questions: [{ id: "itemized_last_year" }, { id: "margin_loan" }],
    });
  });

  it("close-deductions records both decisions when only California itemizes", async () => {
    const answered = await call(tools.answerLifeQuestions, {
      answers: ["itemized_last_year", "margin_loan"].map(no),
    });
    expect(answered.next.step).toBe("close");

    const result = await call(tools.closeDeductions);
    expect(result).toMatchObject({
      closed: true,
      recorded: [ITEMIZE_KEY, SCHEDULE_A_KEY],
      next: { step: "closed" },
    });
    expect(result.summary).toBe(
      "Deductions are done. You take the standard deduction on the federal return ($15,750 against $14,035 itemized) and itemize on the California return ($10,000 against the $5,706 standard deduction). Schedule A is still filled in: the California return starts from it. 2 records are on the list for the CPA; nothing is attached to the return.",
    );
    expect((result.records as { item: string }[]).map((record) => record.item)).toEqual([
      "real_estate_tax",
      "mortgage_interest",
    ]);

    const [itemize] = await storedDecisions(ITEMIZE_KEY);
    expect(itemize.decision).toBe("standard");
    expect(itemize.rationale).toBe(result.summary);
    expect(itemize.sourceNote).toContain("Schedule A line 17");
    expect((await storedDecisions(SCHEDULE_A_KEY)).map((row) => row.decision)).toEqual([true]);

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
