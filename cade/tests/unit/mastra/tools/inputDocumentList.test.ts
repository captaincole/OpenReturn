import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ingestTools } from "../../../../src/mastra/tools/ingestTools";

/*
 * The README says how many kinds of input document Cade reads. The count comes
 * from a list that the engine's coverage script keeps by hand; this test keeps
 * the list equal to the ingest tools. The record-* tools read no document.
 */
const LIST_PATH = resolve(
  __dirname,
  "../../../../../engine/scripts/formLists/input-documents-2025.json",
);

describe("the input document list", () => {
  const listed: string[] = JSON.parse(readFileSync(LIST_PATH, "utf8")).documents.map(
    (document: { ingestTool: string }) => document.ingestTool,
  );
  const tools = Object.values(ingestTools)
    .map((tool) => tool.id)
    .filter((id) => id.startsWith("ingest-"));

  it("has one row for each ingest tool", () => {
    expect([...listed].sort()).toEqual([...tools].sort());
  });
});
