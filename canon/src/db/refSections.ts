import { asNum, asStr } from "./corpusStore";
import { ensureCorpusSchema, getCorpusDb } from "./libsql";

/*
 * Whole sections for readers that need more than a search hit: Canon's search
 * finds and quotes a block, and a binding drafter reads the block's whole
 * section, or all of "Part II", from here. PDF sections are flat (a section
 * runs to the next heading); HTML sections nest h3 and h4 under h2. A read
 * takes the named sections and every section nested under them.
 */

export interface SectionBlock {
  blockId: string;
  section: string;
  page: number;
  text: string;
}

export interface OutlineSection {
  section: string;
  heading: string;
  /** 0 for a top-level section; HTML subsections are 1 or 2. */
  depth: number;
  firstPage: number;
  /** The section's own blocks, not its subsections'. */
  chars: number;
}

export async function readOutline(docId: string): Promise<OutlineSection[]> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute({
    sql: `SELECT s.section_id, s.parent_section_id, s.heading_slug, s.heading, s.first_page,
                 coalesce(sum(length(b.text)), 0) AS chars
          FROM ref_sections s LEFT JOIN ref_blocks b ON b.section_id = s.section_id
          WHERE s.doc_id = ?
          GROUP BY s.section_id ORDER BY s.ordinal`,
    args: [docId],
  });
  /* Parents come first in document order, so each depth is known when its children arrive. */
  const depthById = new Map<string, number>();
  return res.rows.map((row) => {
    const parent = row.parent_section_id === null ? null : asStr(row.parent_section_id);
    const depth = parent === null ? 0 : (depthById.get(parent) ?? 0) + 1;
    depthById.set(asStr(row.section_id), depth);
    return {
      section: asStr(row.heading_slug),
      heading: asStr(row.heading),
      depth,
      firstPage: asNum(row.first_page),
      chars: asNum(row.chars),
    };
  });
}

async function sectionOrdinal(docId: string, section: string): Promise<number> {
  const res = await getCorpusDb().execute({
    sql: `SELECT ordinal FROM ref_sections WHERE doc_id = ? AND heading_slug = ?`,
    args: [docId, section],
  });
  if (!res.rows[0]) throw new Error(`no section "${section}" in ${docId}`);
  return asNum(res.rows[0].ordinal);
}

/* The document and section a block id (as Canon's search returns it) belongs to. */
export async function sectionOfBlock(blockId: string): Promise<{ docId: string; section: string }> {
  await ensureCorpusSchema();
  const res = await getCorpusDb().execute({
    sql: `SELECT b.doc_id, s.heading_slug
          FROM ref_blocks b JOIN ref_sections s ON s.section_id = b.section_id
          WHERE b.block_id = ?`,
    args: [blockId],
  });
  if (!res.rows[0]) throw new Error(`no block "${blockId}" in the corpus`);
  return { docId: asStr(res.rows[0].doc_id), section: asStr(res.rows[0].heading_slug) };
}

/* Sections section..through (inclusive, in document order), with their subsections. */
export async function readSections(opts: {
  docId: string;
  section: string;
  through?: string;
}): Promise<SectionBlock[]> {
  await ensureCorpusSchema();
  const first = await sectionOrdinal(opts.docId, opts.section);
  const last = opts.through ? await sectionOrdinal(opts.docId, opts.through) : first;
  if (last < first) throw new Error(`"${opts.through}" comes before "${opts.section}"`);
  const res = await getCorpusDb().execute({
    sql: `WITH RECURSIVE picked(section_id) AS (
            SELECT section_id FROM ref_sections WHERE doc_id = ? AND ordinal BETWEEN ? AND ?
            UNION
            SELECT s.section_id FROM ref_sections s JOIN picked p ON s.parent_section_id = p.section_id
          )
          SELECT b.block_id, s.heading_slug, b.page_num, b.text
          FROM ref_blocks b JOIN ref_sections s ON s.section_id = b.section_id
          WHERE s.section_id IN (SELECT section_id FROM picked)
          ORDER BY b.ordinal`,
    args: [opts.docId, first, last],
  });
  return res.rows.map((row) => ({
    blockId: asStr(row.block_id),
    section: asStr(row.heading_slug),
    page: asNum(row.page_num),
    text: asStr(row.text),
  }));
}
