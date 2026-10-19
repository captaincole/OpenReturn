import { describe, expect, it } from "vitest";
import { MAX_FACTS_PER_CALL, recordTaxFacts } from "../../../../src/mastra/tools/taxFacts";

const fact = (n: number) => ({
  category: "identity" as const,
  key: `identity.test_${n}`,
  value: "x",
  sourceNote: "test",
});

const run = (count: number) =>
  (recordTaxFacts as unknown as { execute: (input: unknown) => Promise<unknown> }).execute({
    year: 2025,
    facts: Array.from({ length: count }, (_, i) => fact(i)),
  });

/* The cap check runs before any DB access, so these calls write nothing. */
describe("record-tax-facts", () => {
  it.each([0, MAX_FACTS_PER_CALL + 1])("refuses %i facts and records nothing", async (count) => {
    await expect(run(count)).rejects.toThrow(/Nothing was recorded/);
  });

  it("passes the cap check with the maximum number of facts", async () => {
    /*
     * The call stops at the user lookup, after the cap check. Which error
     * depends on the checkout: "owner missing" without an app.db,
     * "requestContext missing" with one (userContext.ts).
     */
    await expect(run(MAX_FACTS_PER_CALL)).rejects.toThrow(/owner missing|requestContext missing/);
  });
});
