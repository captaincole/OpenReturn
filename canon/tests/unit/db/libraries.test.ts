import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import type { IngestPayload } from "../../../src/db/corpusStore.js";
import type { Library } from "../../../src/db/libsql.js";

const dir = mkdtempSync(path.join(tmpdir(), "canon-libraries-test-"));
process.env.CORPUS_DB_PATH = path.join(dir, "corpus.db");
process.env.LAW_DB_PATH = path.join(dir, "law.db");

// Imported after the env is set, so every library resolves to the temp folder.
const { lawInstalled, libraryDbPath } = await import("../../../src/db/libsql.js");
const { writeDocument } = await import("../../../src/db/corpusStore.js");
const { getBlock, hybridSearchRefDocs, searchRefDocs } =
  await import("../../../src/db/corpusSearch.js");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

// One document with one block whose text holds a word only that library has.
function payload(docId: string, word: string): IngestPayload {
  const text = `A block about ${word} rules.`;
  const sectionId = `${docId}::sec::preamble`;
  return {
    document: {
      docId,
      title: docId,
      publisher: "IRS",
      taxYear: 2025,
      sourcePath: `${docId}.pdf`,
      sourceUrl: null,
      sha256: "0",
      totalPages: 1,
      totalChars: text.length,
      canonicalTextPath: `${docId}.txt`,
      format: "pdf",
      published: null,
    },
    pages: [{ docId, pageNum: 1, charStart: 0, charEnd: text.length }],
    sections: [
      {
        sectionId,
        docId,
        heading: "(Preamble)",
        headingSlug: "preamble",
        parentSectionId: null,
        ordinal: 0,
        firstPage: 1,
        charStart: 0,
        charEnd: text.length,
      },
    ],
    blocks: [
      {
        blockId: `${sectionId}::b01`,
        docId,
        sectionId,
        pageNum: 1,
        blockType: "paragraph",
        ordinal: 0,
        text,
        charStart: 0,
        charEnd: text.length,
      },
    ],
  };
}

const ftsDocIds = async (query: string, library?: Library) =>
  (await hybridSearchRefDocs({ query, mode: "fts", library })).map((hit) => hit.docId);

describe("library files", () => {
  it("reports the law library missing without creating its file", async () => {
    expect(await lawInstalled()).toBe(false);
    expect(existsSync(libraryDbPath("law"))).toBe(false);
  });

  it("keeps each library's blocks in its own file", async () => {
    await writeDocument(payload("irs-pub-test", "instructions"));
    await writeDocument(payload("usc-26-test", "statute"), "law");

    expect(await ftsDocIds("statute", "law")).toEqual(["usc-26-test"]);
    expect(await ftsDocIds("statute")).toEqual([]);
    expect(await ftsDocIds("instructions")).toEqual(["irs-pub-test"]);
    expect(await ftsDocIds("instructions", "law")).toEqual([]);

    const lawHits = await searchRefDocs({ query: "statute", library: "law" });
    expect(lawHits.map((hit) => hit.docId)).toEqual(["usc-26-test"]);
    expect(await searchRefDocs({ query: "statute" })).toEqual([]);
    expect(await getBlock("usc-26-test::sec::preamble::b01")).toBeNull();
    expect((await getBlock("usc-26-test::sec::preamble::b01", "law"))?.docId).toBe("usc-26-test");
  });

  it("reports the law library installed once it holds a document", async () => {
    expect(existsSync(libraryDbPath("law"))).toBe(true);
    expect(await lawInstalled()).toBe(true);
  });
});
