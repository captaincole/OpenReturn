import { beforeEach, describe, expect, it, vi } from "vitest";

// searchRefDocs takes an optional jurisdictions list, passes it to the search and says what it searched.

const search = vi.hoisted(() => vi.fn(async () => []));
vi.mock("../../../../src/db/corpusSearch", () => ({
  hybridSearchRefDocs: search,
  getBlock: async () => null,
}));

const { searchRefDocsTool } = await import("../../../../src/mastra/tools/refDocs");

// Mastra wraps the tool's execute type; the cast allows a direct call outside an agent.
const execute = (input: object) =>
  (
    searchRefDocsTool as unknown as { execute: (input: object) => Promise<Record<string, unknown>> }
  ).execute(input);

beforeEach(() => search.mockClear());

describe("searchRefDocs and the jurisdictions", () => {
  it("passes ['CA'] to the search and reports it", async () => {
    const out = await execute({ query: "standard deduction", jurisdictions: ["CA"] });
    expect(search).toHaveBeenCalledWith(expect.objectContaining({ jurisdictions: ["CA"] }));
    expect(out.jurisdictions).toEqual(["CA"]);
  });

  it("reports every jurisdiction when the input names none", async () => {
    const out = await execute({ query: "standard deduction" });
    expect(search).toHaveBeenCalledWith(expect.objectContaining({ jurisdictions: undefined }));
    expect(out.jurisdictions).toEqual(["federal", "CA"]);
  });

  it.each([
    [[], /Name at least one jurisdiction/],
    [["both"], /Unknown jurisdiction "both"/],
  ])("refuses %j with a clear message", async (jurisdictions, message) => {
    const out = await execute({ query: "standard deduction", jurisdictions });
    expect(out.error).toBe(true);
    expect(String(out.message)).toMatch(message);
    expect(search).not.toHaveBeenCalled();
  });
});
