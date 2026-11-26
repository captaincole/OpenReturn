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
const { parsedRegulations, REG_ENTRY } = await import("../../law/regFixture.js");
const { CA_ENTRY, parsedCalifornia } = await import("../../law/caFixture.js");
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
  files: [],
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
  await writeDocument(lawPayload(REG_ENTRY, parsedRegulations()), "law");
  await writeDocument(lawPayload(CA_ENTRY, parsedCalifornia()), "law");
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
      source: "statute",
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

  it("search both sources by default, or one by name, and name each hit's source", async () => {
    const both = await call(searchLawTool, { query: "activity", mode: "fts", limit: 25 });
    const sources = (hits: unknown) =>
      new Set((hits as { source: string }[]).map((hit) => hit.source));
    expect(sources(both.results)).toEqual(new Set(["statute", "regulations"]));
    // The sources take turns, statute first, so the larger regulations cannot crowd the statute out.
    const order = (both.results as { source: string }[]).slice(0, 4).map((hit) => hit.source);
    expect(order).toEqual(["statute", "regulations", "statute", "regulations"]);
    for (const source of ["statute", "regulations"]) {
      const one = await call(searchLawTool, { query: "activity", mode: "fts", source });
      expect(sources(one.results)).toEqual(new Set([source]));
    }
    const reg = await call(searchLawTool, {
      query: "more than 500 hours",
      mode: "fts",
      section: "1.469-5T",
    });
    expect((reg.results as { citation: string }[])[0].citation).toBe("26 CFR § 1.469-5T(a)(1)");
  });

  it("read a regulation by number, citation or block id", async () => {
    for (const citation of [
      "1.469-5T(a)(1)",
      "26 CFR 1.469-5T(a)(1)",
      "cfr-26-2025::sec::s1.469-5t::a-1",
    ]) {
      const result = await call(readLawTool, { citation });
      expect(result).toMatchObject({
        found: true,
        source: "regulations",
        citation: "26 CFR § 1.469-5T(a)(1)",
        sectionHeading: "§ 1.469-5T Material participation (temporary).",
      });
      expect((result.blocks as { text: string }[])[0].text).toContain("more than 500 hours");
    }
    const qa = await call(readLawTool, { citation: "1.408A-4, Q&A-1(b)" });
    expect(qa).toMatchObject({ found: true, citation: "26 CFR § 1.408A-4, Q&A-1(b)" });
    const whole = await call(readLawTool, { citation: "1.469-5T" });
    expect((whole.subdivisions as string[]).slice(0, 2)).toEqual([
      "26 CFR § 1.469-5T(a)",
      "26 CFR § 1.469-5T(b)",
    ]);
  });

  it("search California only when it is named", async () => {
    const query = "resident temporary or transitory purpose";
    const federal = await call(searchLawTool, { query, mode: "fts", limit: 25 });
    expect((federal.results as { source: string }[]).map((hit) => hit.source)).not.toContain(
      "california",
    );
    const california = await call(searchLawTool, { query, mode: "fts", source: "california" });
    expect((california.results as { blockId: string; citation: string }[])[0]).toMatchObject({
      blockId: "ca-rtc-2025::sec::s17014::a",
      citation: "Cal. Rev. & Tax. Code § 17014(a)",
      source: "california",
    });
    const section = await call(searchLawTool, {
      query: "resident",
      mode: "fts",
      section: "CA 17014",
    });
    expect(
      (section.results as { source: string }[]).every((hit) => hit.source === "california"),
    ).toBe(true);
  });

  it("read a California citation, and keep a bare number the Code's", async () => {
    const resident = await call(readLawTool, { citation: "CA 17014(a)(1)" });
    expect(resident).toMatchObject({
      found: true,
      source: "california",
      citation: "Cal. Rev. & Tax. Code § 17014(a)(1)",
    });
    expect((resident.blocks as { blockId: string }[]).map((block) => block.blockId)).toEqual([
      "ca-rtc-2025::sec::s17014::a",
    ]);
    expect(await call(readLawTool, { citation: "17014" })).toMatchObject({ found: false });
  });

  it("read every version of a California number, each block naming its version", async () => {
    const result = await call(readLawTool, { citation: "R&TC 17552.3" });
    const blocks = result.blocks as { blockId: string; headings: string[] }[];
    expect(blocks.map((block) => block.blockId.split("::")[2])).toEqual(
      expect.arrayContaining(["s17552.3", "s17552.3-v2"]),
    );
    expect(blocks.at(-1)?.headings[0]).toMatch(/^Version 2 of 2: Added by Stats\. 2002, Ch\. 35/);
  });

  it("say found: false for a citation the Code does not hold", async () => {
    expect(await call(readLawTool, { citation: "469(z)" })).toMatchObject({
      found: false,
      blocks: [],
    });
    expect(await call(readLawTool, { citation: "not a citation" })).toMatchObject({ found: false });
  });
});
