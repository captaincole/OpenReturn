import { RequestContext } from "@mastra/core/request-context";
import { describe, expect, it, vi } from "vitest";
import type { CadeRequestContext } from "../../../../src/mastra/server/requestContext";
import { recordAssumptions } from "../../../../src/mastra/tools/assumptions";
import { MAX_FACTS_PER_CALL } from "../../../../src/mastra/tools/taxFacts";

/* The call must stop before any DB access: the filing lookup is a stub. */
vi.mock("../../../../src/mastra/db/filings", () => ({
  resolveOwnerFilingForYear: async () => {
    throw new Error("filing lookup reached (test stub)");
  },
}));

const assumption = (index: number) => ({
  category: "charitable" as const,
  key: `charitable.test_${index}`,
  value: 1000,
  sourceNote: "about $1,000, verbal",
});

/* The owner identity ownerMiddleware would have set; the tool's schema requires it. */
const context = {
  requestContext: new RequestContext<CadeRequestContext>([
    ["userId", "owner-test"],
    ["userEmail", "owner@example.test"],
  ]),
};

const run = (count: number) =>
  (
    recordAssumptions as unknown as {
      execute: (input: unknown, context: unknown) => Promise<unknown>;
    }
  ).execute(
    { year: 2025, assumptions: Array.from({ length: count }, (_, i) => assumption(i)) },
    context,
  );

/* The cap check runs before any DB access, so these calls write nothing. */
describe("record-assumptions", () => {
  it.each([0, MAX_FACTS_PER_CALL + 1])(
    "refuses %i assumptions and records nothing",
    async (count) => {
      await expect(run(count)).rejects.toThrow(/Nothing was recorded/);
    },
  );

  it("passes the cap check with the maximum number of assumptions", async () => {
    /* Past the cap check, the next step is the filing lookup (stubbed above). */
    await expect(run(MAX_FACTS_PER_CALL)).rejects.toThrow(/filing lookup reached/);
  });

  it("refuses a call without the owner identity before running", async () => {
    const result = await (
      recordAssumptions as unknown as {
        execute: (input: unknown, context: unknown) => Promise<unknown>;
      }
    ).execute({ year: 2025, assumptions: [assumption(0)] }, undefined);
    expect(result).toMatchObject({ error: true });
    expect((result as { message: string }).message).toMatch(/Request context validation failed/);
  });
});
