import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { IngestPayload } from "../../../src/db/corpusStore.js";

/*
 * The jurisdictions filter on a fixture corpus. The federal blocks match the
 * query better in both legs, so a filter applied after a leg's top-N would
 * leave a California search with nothing. Each leg must filter first.
 */

const dir = mkdtempSync(path.join(tmpdir(), "canon-jurisdiction-search-test-"));
process.env.CORPUS_DB_PATH = path.join(dir, "corpus.db");
process.env.EMBEDDINGS_MODEL = "ollama/test-model";

const QUERY_VECTOR = [1, 0, 0];
vi.mock("../../../src/refdocs/embeddings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../src/refdocs/embeddings")>()),
  embedQuery: async () => QUERY_VECTOR,
}));

const { writeDocument, setBlockEmbeddings } = await import("../../../src/db/corpusStore.js");
const { hybridSearchRefDocs } = await import("../../../src/db/corpusSearch.js");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const BLOCKS_PER_DOC = 4;
const TOP_N = 3;

// Federal blocks: the word three times, and a vector close to the query. California: once, and farther.
function payload(docId: string, publisher: string): IngestPayload {
  const federal = publisher === "IRS";
  const sectionId = `${docId}::sec::preamble`;
  const texts = Array.from({ length: BLOCKS_PER_DOC }, (_, i) =>
    federal
      ? `Deduction deduction deduction block ${i}.`
      : `The deduction here is one of many other California words in block ${i}.`,
  );
  const totalChars = texts.join("").length;
  return {
    document: {
      docId,
      title: docId,
      publisher,
      taxYear: 2025,
      sourcePath: `${docId}.pdf`,
      sourceUrl: null,
      sha256: "0",
      totalPages: 1,
      totalChars,
      canonicalTextPath: `${docId}.txt`,
      format: "pdf",
      published: null,
    },
    pages: [{ docId, pageNum: 1, charStart: 0, charEnd: totalChars }],
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
        charEnd: totalChars,
      },
    ],
    blocks: texts.map((text, i) => ({
      blockId: `${sectionId}::b0${i + 1}`,
      docId,
      sectionId,
      pageNum: 1,
      blockType: "paragraph",
      ordinal: i,
      text,
      charStart: 0,
      charEnd: text.length,
    })),
  };
}

const vectorOf = (federal: boolean, i: number): number[] =>
  federal ? [1, 0.01 * (i + 1), 0] : [1, 0.5 + 0.1 * i, 0];

beforeAll(async () => {
  for (const [docId, publisher] of [
    ["irs-test-inst-2025", "IRS"],
    ["ca-test-inst-2025", "FTB"],
  ]) {
    const doc = payload(docId, publisher);
    await writeDocument(doc);
    await setBlockEmbeddings(
      doc.blocks.map((block, i) => ({
        blockId: block.blockId,
        embedding: vectorOf(publisher === "IRS", i),
      })),
      { embeddingModel: "ollama/test-model" },
    );
  }
});

type Mode = "fts" | "vector" | "hybrid";
const search = (mode: Mode, jurisdictions?: ("federal" | "CA")[]) =>
  hybridSearchRefDocs({
    query: "deduction",
    mode,
    limit: TOP_N,
    candidatesPerLeg: TOP_N,
    jurisdictions,
  });
const docIds = async (mode: Mode, jurisdictions?: ("federal" | "CA")[]) =>
  (await search(mode, jurisdictions)).map((hit) => hit.docId);

describe.each<Mode>(["fts", "vector", "hybrid"])("the jurisdictions filter, %s", (mode) => {
  it("searches everything with no list: the federal blocks win", async () => {
    expect(await docIds(mode)).toEqual(Array(TOP_N).fill("irs-test-inst-2025"));
  });

  it("returns the same hits for every jurisdiction as for no list", async () => {
    expect(await search(mode, ["federal", "CA"])).toEqual(await search(mode));
  });

  it("gets a full top-N of California blocks for ['CA']", async () => {
    expect(await docIds(mode, ["CA"])).toEqual(Array(TOP_N).fill("ca-test-inst-2025"));
  });

  it("keeps only federal blocks for ['federal']", async () => {
    expect(await docIds(mode, ["federal"])).toEqual(Array(TOP_N).fill("irs-test-inst-2025"));
  });
});

describe("a bad jurisdictions list", () => {
  it("is an error, not a search with no hits", async () => {
    await expect(hybridSearchRefDocs({ query: "deduction", jurisdictions: [] })).rejects.toThrow(
      /Name at least one jurisdiction/,
    );
    await expect(
      hybridSearchRefDocs({ query: "deduction", jurisdictions: ["NY" as "CA"] }),
    ).rejects.toThrow(/Unknown jurisdiction "NY"/);
  });
});
