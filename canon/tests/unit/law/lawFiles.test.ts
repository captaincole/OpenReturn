import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

/*
 * One law file per jurisdiction: a document goes to the file of its
 * jurisdiction, and a search or read of a jurisdiction whose file is missing
 * answers not installed and creates no file.
 */

const dir = mkdtempSync(path.join(tmpdir(), "canon-law-files-test-"));
process.env.CORPUS_DB_PATH = path.join(dir, "corpus.db");
process.env.LAW_DB_DIR = path.join(dir, "law");
// No embedding server: ingest fails soft and keeps the rows.
process.env.EMBEDDINGS_MODEL_URL = "http://127.0.0.1:9";

// Imported after the env is set, so every library resolves to the temp folder.
const { listDocuments, writeDocument } = await import("../../../src/db/corpusStore.js");
const { libraryDbPath } = await import("../../../src/db/libsql.js");
const { ingestLaw, lawPayload } = await import("../../../src/law/ingestLaw.js");
const { parseUslmTitle } = await import("../../../src/law/parseUslm.js");
const { writeZip } = await import("../../../src/law/zipWrite.js");
const { sha256 } = await import("../../../src/refdocs/fetchSource.js");
const { CA_ENTRY, caFixtureFiles } = await import("./caFixture.js");
const { readLawTool, searchLawTool } = await import("../../../src/mastra/tools/law.js");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const call = (tool: unknown, input: unknown) =>
  (tool as { execute: (input: unknown) => Promise<Record<string, unknown>> }).execute(input);

const FIXTURES = path.join(__dirname, "fixtures");
const fixture = (name: string) => readFileSync(path.join(FIXTURES, name), "utf8");
const federalFile = () => libraryDbPath("law:federal");
const caFile = () => libraryDbPath("law:CA");

async function installFederal(): Promise<void> {
  const xml = fixture("title.xml").replace("{{PART_I}}", fixture("s469-g.xml"));
  const sidecar = {
    ...CA_ENTRY.sidecar,
    docId: "usc-26-2025",
    title: "Internal Revenue Code (26 U.S.C.)",
    publisher: "OLRC",
    format: "uslm" as const,
  };
  const entry = { ...CA_ENTRY, sidecar };
  await writeDocument(lawPayload(entry, parseUslmTitle(xml, sidecar.docId)), "law:federal");
}

describe("law files with only the federal file installed", () => {
  it("answer not installed for California, and create no California file", async () => {
    await installFederal();
    const search = await call(searchLawTool, { query: "resident", jurisdictions: ["CA"] });
    expect(search).toMatchObject({ installed: false });
    expect(search.message).toContain("npm run corpus -- law fetch --jurisdiction CA");
    const read = await call(readLawTool, { citation: "CA 17014(a)" });
    expect(read).toMatchObject({ installed: false });
    expect(existsSync(caFile())).toBe(false);
  });

  it("search the installed jurisdictions and name the missing one", async () => {
    const result = await call(searchLawTool, {
      query: "passive activity",
      mode: "fts",
      jurisdictions: ["federal", "CA"],
    });
    expect(result).toMatchObject({ installed: true, missing: ["CA"] });
    const sources = (result.results as { source: string }[]).map((hit) => hit.source);
    expect(new Set(sources)).toEqual(new Set(["statute"]));
    expect(existsSync(caFile())).toBe(false);
  });
});

describe("law sync", () => {
  it("writes a jurisdiction's document to its own file", async () => {
    const zip = writeZip(caFixtureFiles());
    const zipPath = path.join(dir, "ca-law.zip");
    writeFileSync(zipPath, zip);
    const entry = {
      ...CA_ENTRY,
      sidecar: { ...CA_ENTRY.sidecar, sha256: sha256(zip) },
      zipPath,
      zipRelPath: "ca-law.zip",
    };
    const result = await ingestLaw(entry);
    expect(result.blocks).toBeGreaterThan(0);
    expect((await listDocuments("law:CA")).map((doc) => doc.docId)).toEqual(["ca-rtc-2025"]);
    expect((await listDocuments("law:federal")).map((doc) => doc.docId)).toEqual(["usc-26-2025"]);
    expect(existsSync(federalFile()) && existsSync(caFile())).toBe(true);
    const read = await call(readLawTool, { citation: "CA 17014(a)" });
    expect(read).toMatchObject({ installed: true, found: true, source: "california" });
  });
});
