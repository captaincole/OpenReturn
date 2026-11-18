import { RequestContext } from "@mastra/core/request-context";
import { describe, expect, it, vi } from "vitest";
import type { CadeRequestContext } from "../../../../src/mastra/server/requestContext";
import { MAX_FACTS_PER_CALL, recordTaxFacts } from "../../../../src/mastra/tools/taxFacts";

/* The call must stop before any DB access: the filing lookup is a stub. */
vi.mock("../../../../src/mastra/db/filings", () => ({
  resolveOwnerFilingForYear: async () => {
    throw new Error("filing lookup reached (test stub)");
  },
}));

const fact = (index: number) => ({
  category: "identity" as const,
  key: `identity.test_${index}`,
  value: "x",
  sourceNote: "test",
});

/* The user identity userMiddleware would have set; the tool's schema requires it. */
const context = {
  requestContext: new RequestContext<CadeRequestContext>([
    ["userId", "owner-test"],
    ["userEmail", "owner@example.test"],
  ]),
};

const run = (count: number) =>
  (
    recordTaxFacts as unknown as {
      execute: (input: unknown, context: unknown) => Promise<unknown>;
    }
  ).execute({ year: 2025, facts: Array.from({ length: count }, (_, i) => fact(i)) }, context);

/* The cap check runs before any DB access, so these calls write nothing. */
describe("record-tax-facts", () => {
  it.each([0, MAX_FACTS_PER_CALL + 1])("refuses %i facts and records nothing", async (count) => {
    await expect(run(count)).rejects.toThrow(/Nothing was recorded/);
  });

  it("passes the cap check with the maximum number of facts", async () => {
    /* Past the cap check, the next step is the filing lookup (stubbed above). */
    await expect(run(MAX_FACTS_PER_CALL)).rejects.toThrow(/filing lookup reached/);
  });

  const recordSsn = (key: string, value: unknown) =>
    (
      recordTaxFacts as unknown as {
        execute: (input: unknown, context: unknown) => Promise<unknown>;
      }
    ).execute(
      { year: 2025, facts: [{ category: "identity", key, value, sourceNote: "test" }] },
      context,
    );

  it.each(["###-##-####", "123-45-678", ""])(
    "refuses the SSN %j and records nothing",
    async (value) => {
      await expect(recordSsn("identity.ssn", value)).rejects.toThrow(
        /9 digits.*Nothing was recorded/,
      );
    },
  );

  it("refuses a spouse SSN that is not 9 digits", async () => {
    await expect(recordSsn("identity.spouse.ssn", "XXX-XX-1234")).rejects.toThrow(/9 digits/);
  });

  it.each(["123-45-6789", "123456789"])("accepts the SSN %j", async (value) => {
    /* Past the SSN check, the next step is the filing lookup (stubbed above). */
    await expect(recordSsn("identity.ssn", value)).rejects.toThrow(/filing lookup reached/);
  });

  it("refuses a call without the user identity before running", async () => {
    const result = await (
      recordTaxFacts as unknown as {
        execute: (input: unknown, context: unknown) => Promise<unknown>;
      }
    ).execute({ year: 2025, facts: [fact(0)] }, undefined);
    expect(result).toMatchObject({ error: true });
    expect((result as { message: string }).message).toMatch(/Request context validation failed/);
  });
});
