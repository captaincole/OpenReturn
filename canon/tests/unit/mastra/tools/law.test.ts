import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(path.join(tmpdir(), "canon-law-tools-test-"));
process.env.CORPUS_DB_PATH = path.join(dir, "corpus.db");
process.env.LAW_DB_PATH = path.join(dir, "law.db");
const lawFile = process.env.LAW_DB_PATH;

// Imported after the env is set, so both libraries resolve to the temp folder.
const { writeDocument } = await import("../../../../src/db/corpusStore.js");
const { lawPayload } = await import("../../../../src/law/ingestLaw.js");
const { parseUslmTitle } = await import("../../../../src/law/parseUslm.js");
const { citeRefDocTool, searchRefDocsTool } =
  await import("../../../../src/mastra/tools/refDocs.js");
const { readLawTool, searchLawTool } = await import("../../../../src/mastra/tools/law.js");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

// Mastra wraps the tool's execute type; the cast allows a direct call outside an agent.
const call = (tool: unknown, input: unknown) =>
  (tool as { execute: (input: unknown) => Promise<Record<string, unknown>> }).execute(input);

const FIXTURES = path.join(__dirname, "../../law/fixtures");
const fixture = (name: string) => readFileSync(path.join(FIXTURES, name), "utf8");

const SIDECAR = {
  docId: "usc-26-2025",
  title: "Internal Revenue Code (26 U.S.C.)",
  publisher: "OLRC",
  taxYear: 2025,
  sourceUrl: null,
  sha256: "0",
  format: "uslm" as const,
  releasePoint: "119-73",
  published: "2026-01-12",
};

async function installLaw(): Promise<void> {
  const xml = fixture("title.xml").replace("{{PART_I}}", fixture("s469-g.xml"));
  const parsed = parseUslmTitle(xml, SIDECAR.docId);
  const entry = {
    sidecar: SIDECAR,
    sidecarPath: "law.meta.json",
    zipPath: "law.zip",
    zipRelPath: "law.zip",
  };
  await writeDocument(lawPayload(entry, parsed), "law");
}

describe("the corpus tools", () => {
  it("never open law.db", async () => {
    await call(searchRefDocsTool, { query: "passive activity", mode: "fts" });
    await call(citeRefDocTool, { blockId: "usc-26-2025::sec::s469::g-1" });
    expect(existsSync(lawFile)).toBe(false);
  });
});

describe("the law tools without law.db", () => {
  it("answer installed: false, name both commands, and create no file", async () => {
    for (const result of [
      await call(searchLawTool, { query: "passive activity" }),
      await call(readLawTool, { citation: "469" }),
    ]) {
      expect(result.installed).toBe(false);
      expect(result.message).toContain("npm run corpus -- law fetch");
      expect(result.message).toContain("npm run corpus -- law sync");
    }
    expect(existsSync(lawFile)).toBe(false);
  });
});

describe("the law tools with law.db", () => {
  it("search the statute only, with the Code citation on each hit", async () => {
    await installLaw();
    const result = await call(searchLawTool, {
      query: "disposes entire interest passive activity",
      mode: "fts",
      section: "469",
    });
    const hits = result.results as { blockId: string; citation: string; headings: string[] }[];
    expect(hits.map((hit) => hit.blockId)).toContain("usc-26-2025::sec::s469::g-1");
    expect(hits.find((hit) => hit.blockId.endsWith("::g-1"))).toMatchObject({
      citation: "26 U.S.C. § 469(g)(1)",
      headings: [
        "Dispositions of entire interest in passive activity",
        "Fully taxable transaction",
      ],
    });
    expect(
      await call(searchLawTool, { query: "passive", mode: "fts", section: "1" }),
    ).toMatchObject({
      results: [],
    });
    const corpus = await call(searchRefDocsTool, { query: "passive activity", mode: "fts" });
    expect(corpus.results).toEqual([]);
  });

  it("read a subdivision packed into its parent's block", async () => {
    const result = await call(readLawTool, { citation: "469(g)(1)(A)" });
    expect(result).toMatchObject({
      installed: true,
      found: true,
      citation: "26 U.S.C. § 469(g)(1)(A)",
      sectionHeading: "§ 469. Passive activity losses and credits limited",
      truncated: false,
    });
    expect((result.blocks as { blockId: string }[]).map((block) => block.blockId)).toEqual([
      "usc-26-2025::sec::s469::g-1",
    ]);
  });

  it("read a whole section in statute order, with its subdivisions", async () => {
    const result = await call(readLawTool, { citation: "§ 469" });
    const blocks = (result.blocks as { blockId: string }[]).map((block) =>
      block.blockId.split("::").at(-1),
    );
    expect(blocks).toEqual(["g", "g-1", "g-2", "g-3"]);
    expect(result.subdivisions).toEqual(["26 U.S.C. § 469(g)"]);
  });

  it("say found: false for a citation the Code does not hold", async () => {
    expect(await call(readLawTool, { citation: "469(z)" })).toMatchObject({
      found: false,
      blocks: [],
    });
    expect(await call(readLawTool, { citation: "not a citation" })).toMatchObject({ found: false });
  });
});
