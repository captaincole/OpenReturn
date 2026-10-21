import { describe, expect, it } from "vitest";
import { ingest1099B } from "../../../../src/mastra/tools/ingest1099B.js";

describe("ingest-1099-b", () => {
  /* No request context: a call with no sales must not reach the DB at all. */
  it("writes nothing for an empty trades list", async () => {
    const execute = ingest1099B.execute as (input: unknown, context: unknown) => Promise<unknown>;
    const result = await execute(
      {
        year: 2025,
        payer: { name: "Example Broker", tin: "00-0000002" },
        accountNumber: "EXB-1",
        form: "1099-B",
        trades: [],
      },
      undefined,
    );
    expect(result).toEqual({
      accountSlug: "example-broker",
      factsWritten: 0,
      decisionsWritten: 0,
      tradeIds: [],
    });
  });
});
