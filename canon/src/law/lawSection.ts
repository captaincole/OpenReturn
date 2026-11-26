import { asStr, getDocument } from "../db/corpusStore";
import { openLibraryDb } from "../db/libsql";
import { formatCitation, parseLawTarget, sectionIdOf } from "./citation";
import { catchlineOf, lawDocId, sectionBlocks } from "./lawRead";

/*
 * One whole Code section for the web app's statute page, and the library's
 * status. Callers check lawInstalled() first: these open law.db.
 */

export interface LawSectionBlock {
  blockId: string;
  /** The citation path: ["g", "1"]. A continuation or a second piece shares its unit's path. */
  path: string[];
  citation: string;
  text: string;
}

export interface LawSectionPage {
  section: {
    /** As printed: "469", "1400Z–2". */
    number: string;
    citation: string;
    heading: string;
    /** The structure levels above the section, outermost first: "Subtitle A—Income Taxes", … */
    breadcrumbs: string[];
  };
  release: { title: string; published: string | null };
  blocks: LawSectionBlock[];
}

export interface LawStatus {
  docId: string;
  title: string;
  published: string | null;
  /** Code sections with statute text. */
  sections: number;
}

/** null when the input is not a bare section number, or the Code has no such section. */
export async function readLawSection(input: string): Promise<LawSectionPage | null> {
  const target = parseLawTarget(input);
  if (target?.kind !== "citation" || target.path.length > 0) return null;
  const docId = await lawDocId();
  const sectionId = sectionIdOf(docId, target.section);
  const [section, doc] = await Promise.all([sectionBlocks(sectionId), getDocument(docId, "law")]);
  if (!section || !doc) return null;
  return {
    section: {
      number: section.number,
      citation: formatCitation(section.number, []),
      heading: catchlineOf(section.heading),
      breadcrumbs: await breadcrumbsOf(sectionId),
    },
    release: { title: doc.title, published: doc.published },
    blocks: section.blocks.map(({ blockId, path, citation, text }) => ({
      blockId,
      path,
      citation,
      text,
    })),
  };
}

// Walks parent_section_id up to the title; the section itself is not a crumb.
async function breadcrumbsOf(sectionId: string): Promise<string[]> {
  const db = await openLibraryDb("law");
  const res = await db.execute({
    sql: `WITH RECURSIVE up(section_id, heading, parent_section_id, depth) AS (
            SELECT section_id, heading, parent_section_id, 0 FROM ref_sections WHERE section_id = ?
            UNION ALL
            SELECT s.section_id, s.heading, s.parent_section_id, up.depth + 1
            FROM ref_sections s JOIN up ON s.section_id = up.parent_section_id
          )
          SELECT heading FROM up WHERE depth > 0 ORDER BY depth DESC`,
    args: [sectionId],
  });
  return res.rows.map((row) => asStr(row.heading));
}

// A Code section's heading starts with "§"; a structure level's ("Subtitle A—…") does not.
export async function lawStatus(): Promise<LawStatus> {
  const docId = await lawDocId();
  const doc = await getDocument(docId, "law");
  const db = await openLibraryDb("law");
  const count = await db.execute({
    sql: `SELECT count(*) AS n FROM ref_sections WHERE doc_id = ? AND heading LIKE '§%'`,
    args: [docId],
  });
  return {
    docId,
    title: doc?.title ?? docId,
    published: doc?.published ?? null,
    sections: Number(count.rows[0]?.n ?? 0),
  };
}
