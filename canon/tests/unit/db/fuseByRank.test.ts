import { describe, expect, it } from "vitest";
import { fuseByRank, type MatchRow } from "../../../src/db/corpusSearch.js";

const row = (id: string, fts: number | null, distance: number | null): MatchRow => ({
  block_id: id,
  doc_id: "doc",
  section_id: null,
  page_num: 1,
  block_type: "paragraph",
  text: id,
  contextualized_text: null,
  doc_title: "Doc",
  section_heading: null,
  format: "pdf",
  published: null,
  fts_rank: fts,
  vector_distance: distance,
});

const order = (rows: MatchRow[]) => fuseByRank(rows).map((r) => r.row.block_id);

describe("fuseByRank", () => {
  it("lets the best vector-only hit outrank a weak keyword-only hit", () => {
    // bm25 scores dwarf cosine distances; a raw-score merge would put both keyword hits first.
    const rows = [row("kw-1", 30, null), row("kw-2", 25, null), row("vec-1", null, 0.1)];
    expect(order(rows).indexOf("vec-1")).toBeLessThan(order(rows).indexOf("kw-2"));
  });

  it("ranks a block both legs found above blocks only one leg found", () => {
    const rows = [row("kw", 30, null), row("both", 10, 0.3), row("vec", null, 0.1)];
    expect(order(rows)[0]).toBe("both");
  });

  it("orders a single leg by its own ranking", () => {
    expect(order([row("b", 10, null), row("a", 20, null)])).toEqual(["a", "b"]);
    expect(order([row("far", null, 0.9), row("near", null, 0.2)])).toEqual(["near", "far"]);
  });
});
