import { RequestContext } from "@mastra/core/request-context";
import {
  makeRetirementDistributionFactKey,
  type RetirementDistributionFactValue,
} from "@openreturn/engine/facts";
import { loadScenario } from "@openreturn/engine/scenarios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CadeRequestContext } from "../../../../src/mastra/server/requestContext";
import { ingest1099R } from "../../../../src/mastra/tools/ingest1099R.js";
import { slugify } from "../../../../src/mastra/tools/ingestShared.js";

/* The rows the tool writes, in place of app.db. */
const written: Array<{ category: string; key: string; value: unknown }> = [];

vi.mock("../../../../src/mastra/db/filings", () => ({
  resolveOwnerFilingForYear: async () => ({ id: "filing-test" }),
}));
vi.mock("../../../../src/mastra/db/taxFacts", () => ({
  recordFact: async (_scope: unknown, row: { category: string; key: string; value: unknown }) => {
    written.push({ category: row.category, key: row.key, value: row.value });
  },
}));

const context = {
  requestContext: new RequestContext<CadeRequestContext>([
    ["userId", "owner-test"],
    ["userEmail", "owner@example.test"],
  ]),
};

const execute = ingest1099R.execute as (input: unknown, context: unknown) => Promise<unknown>;

/* The call a reader of the printed form makes: payer, plan, owner, and every box. */
function callFor(distributionId: string, form: RetirementDistributionFactValue) {
  const { payerName, payerTin, planName, owner, ...boxes } = form;
  return {
    year: 2025,
    payer: { name: payerName, tin: payerTin },
    planName,
    owner,
    distributionId,
    boxes,
    sourceNote: "test",
  };
}

/* Each scenario's 1099-R, by its payer slug and distribution id in facts.ts. */
const DOCUMENTS: Array<[string, string, string]> = [
  ["siuan", "truckee-valley-water", "pension"],
  ["siuan", "harlow-tool-works", "lump-sum"],
  ["tuon", "redwood-valley-pension", "r-1"],
];

describe("ingest-1099-r", () => {
  beforeEach(() => {
    written.length = 0;
  });

  it.each(DOCUMENTS)(
    "records %s's 1099-R (%s) as facts.ts holds it",
    async (scenario, payerSlug, distributionId) => {
      const { facts } = await loadScenario(scenario);
      const expected = facts.find(
        (fact) => fact.key === makeRetirementDistributionFactKey(payerSlug, distributionId),
      );
      const form = expected?.value as RetirementDistributionFactValue;
      const result = await execute(callFor(distributionId, form), context);
      /* The key's payer slug comes from the printed name; the eval pairs facts by kind. */
      const key = makeRetirementDistributionFactKey(slugify(form.payerName), distributionId);
      expect(result).toEqual({ factKey: key, payerSlug: slugify(form.payerName), distributionId });
      expect(written).toEqual([{ category: "retirement", key, value: form }]);
    },
  );

  it("keeps box 8's percentage and box 9a as printed", async () => {
    const form: RetirementDistributionFactValue = {
      payerName: "Example Plan",
      payerTin: "00-0000009",
      box1: 30_000,
      box2a: 30_000,
      box2b: { totalDistribution: true },
      box7: "7A",
      box7IraSepSimple: false,
      box8: 6_000,
      box8Percent: 40,
      box9a: 40,
    };
    await execute(callFor("lump-sum", form), context);
    expect(written[0]?.value).toEqual(form);
  });
});
