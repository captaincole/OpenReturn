import { RequestContext } from "@mastra/core/request-context";
import {
  makeChildInvestmentIncomeFactKey,
  makeDependentFactKey,
  makeDividendFactKey,
  type TaxFactRow,
} from "@openreturn/engine/facts";
import { loadScenario } from "@openreturn/engine/scenarios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaxFact } from "../../../../src/mastra/db/taxFacts";
import type { CadeRequestContext } from "../../../../src/mastra/server/requestContext";
import { ingest1099Div, ingest1099Int } from "../../../../src/mastra/tools/ingest1099Forms";
import { recordChildInvestmentAnswers } from "../../../../src/mastra/tools/ingestChild1099";

/* An in-memory tax_facts table: rows in the order recorded, read newest first. */
const store: TaxFactRow[] = [];

const toRow = (fact: TaxFact): TaxFactRow => ({
  id: fact.id,
  userId: fact.userId,
  taxYear: fact.taxYear,
  category: fact.category,
  key: fact.key,
  value: fact.value,
  sourceNote: fact.sourceNote ?? null,
  createdAt: String(store.length).padStart(6, "0"),
});

vi.mock("../../../../src/mastra/db/taxFacts", () => ({
  recordFact: async (_scope: unknown, fact: TaxFact) => void store.push(toRow(fact)),
  recordFacts: async (_scope: unknown, facts: TaxFact[]) =>
    void facts.forEach((fact) => store.push(toRow(fact))),
  listFacts: async (_scope: unknown, opts: { category?: string }) =>
    [...store].reverse().filter((row) => !opts.category || row.category === opts.category),
  listFactsByKeys: async (_scope: unknown, _year: number, keys: string[]) =>
    store.filter((row) => keys.includes(row.key)),
}));

vi.mock("../../../../src/mastra/tools/userContext", () => ({
  requireUserContext: async () => ({
    scope: { userId: "u", filingId: "f" },
    userId: "u",
    filingId: "f",
  }),
}));

/* The user identity userMiddleware would have set; the tools' schema requires it. */
const context = {
  requestContext: new RequestContext<CadeRequestContext>([
    ["userId", "u"],
    ["userEmail", "u@example.test"],
  ]),
};

type Execute = { execute: (input: unknown, context: unknown) => Promise<Record<string, unknown>> };
const run = (tool: unknown, input: object) =>
  (tool as Execute).execute({ year: 2025, ...input }, context);

const latest = (key: string) => [...store].reverse().find((row) => row.key === key)?.value;

const seedDependent = (dependentSlug: string) =>
  store.push(
    toRow({
      id: "d",
      userId: "u",
      filingId: "f",
      taxYear: 2025,
      category: "dependents",
      key: makeDependentFactKey(dependentSlug),
      value: {},
    }),
  );

const scenarioValue = async (scenario: string, key: string) =>
  (await loadScenario(scenario)).facts.find((fact) => fact.key === key)?.value;

beforeEach(() => {
  store.length = 0;
});

describe("ingest-1099-div", () => {
  it("records box 7 in the dividend fact as galad's facts hold it", async () => {
    await run(ingest1099Div, {
      accountSlug: "larchmont-international",
      payer: { name: "Larchmont International Index Fund", tin: "00-0011160" },
      box1a: 28640,
      box1b: 23915.4,
      box2a: 1240,
      box7: 2436.85,
    });
    const key = makeDividendFactKey("larchmont-international");
    expect(latest(key)).toEqual(await scenarioValue("galad", key));
  });
});

/* verin's docs/01-1099-int-lucia.pdf and docs/02-1099-div-lucia.pdf, as printed. */
const LUCIA = "lucia-castellanos";
const luciaInterest = {
  payer: { name: "Capitol Mall Securities", tin: "00-0006131" },
  dependentSlug: LUCIA,
  box1: 1240,
  box8: 900,
};
const luciaDividends = {
  payer: { name: "Sierra Crest Growth Fund", tin: "00-0006132" },
  dependentSlug: LUCIA,
  box1a: 3150,
  box1b: 2400,
  box2a: 760,
};
const luciaAnswers = {
  dependentSlug: LUCIA,
  estimatedTaxPaid: false,
  californiaEstimatedTaxPaid: false,
  hadOtherIncome: false,
  taxExemptInterestTaxedByCalifornia: 600,
};

describe("a child's 1099-INT and 1099-DIV", () => {
  const childKey = makeChildInvestmentIncomeFactKey(LUCIA);

  it("adds the child's forms and the answers into the child's fact as verin's facts hold it", async () => {
    seedDependent(LUCIA);
    await run(ingest1099Int, luciaInterest);
    await run(recordChildInvestmentAnswers, luciaAnswers);
    const result = await run(ingest1099Div, luciaDividends);
    expect(result.factKey).toBe(childKey);
    expect(latest(childKey)).toEqual(await scenarioValue("verin", childKey));
  });

  it("gives the same fact in another order, and a form read twice counts once", async () => {
    seedDependent(LUCIA);
    await run(recordChildInvestmentAnswers, luciaAnswers);
    await run(ingest1099Div, luciaDividends);
    await run(ingest1099Int, luciaInterest);
    await run(ingest1099Int, luciaInterest);
    expect(latest(childKey)).toEqual(await scenarioValue("verin", childKey));
  });

  it("records nothing on the parents' accounts", async () => {
    seedDependent(LUCIA);
    await run(ingest1099Int, luciaInterest);
    expect(store.filter((row) => row.category === "investment_income")).toEqual([]);
  });

  it("carries box 3 as U.S. obligation interest, as tomas's facts hold it", async () => {
    const juniper = "juniper-albrecht";
    seedDependent(juniper);
    await run(recordChildInvestmentAnswers, {
      dependentSlug: juniper,
      estimatedTaxPaid: false,
      californiaEstimatedTaxPaid: false,
      hadOtherIncome: false,
    });
    await run(ingest1099Int, {
      payer: { name: "Grand Lake Brokerage", tin: "00-0007131" },
      dependentSlug: juniper,
      box1: 1800,
      box3: 1600,
    });
    await run(ingest1099Div, {
      payer: { name: "Redwood Dividend Fund", tin: "00-0007132" },
      dependentSlug: juniper,
      box1a: 1900,
      box1b: 1500,
    });
    const key = makeChildInvestmentIncomeFactKey(juniper);
    expect(latest(key)).toEqual(await scenarioValue("tomas", key));
  });

  it("names the boxes Form 8814 does not take", async () => {
    seedDependent(LUCIA);
    const result = await run(ingest1099Div, { ...luciaDividends, box7: 12 });
    expect(result.boxesNotOnChildFact).toEqual(["box7"]);
  });

  it("refuses a child with no dependent fact and records nothing", async () => {
    await expect(run(ingest1099Int, luciaInterest)).rejects.toThrow(/record-dependent first/);
    expect(store).toEqual([]);
  });
});
