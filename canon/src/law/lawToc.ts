import { asStr, getDocument } from "../db/corpusStore";
import { openLibraryDb } from "../db/libsql";
import { formatCitation, type LawSource } from "./citation";
import { catchlineOf, lawDocIdOf, sectionNumber } from "./lawRead";

/*
 * The table of contents of the law: one level of the tree at a time, for the
 * web app's law pages. A node is a structure level (a subtitle, a chapter, a
 * part, a subject group), named by its section id without "<docId>::sec::":
 * "sta-ch1-sche-ptii-sptc", "pt1-sgecfr504ddca54174c57". Callers check
 * lawInstalled() first: these open law.db.
 */

/** A structure level: its node and its heading as printed. */
export interface LawTocEntry {
  node: string;
  heading: string;
}

export type LawTocChild =
  | ({ kind: "group" } & LawTocEntry)
  | { kind: "section"; number: string; citation: string; heading: string };

export interface LawToc {
  source: LawSource;
  docId: string;
  release: { title: string; published: string | null };
  /** null at the top level of the document. */
  node: LawTocEntry | null;
  /** The levels above the node, outermost first; empty at the top level. */
  ancestors: LawTocEntry[];
  /** The next level down, in document order: structure levels and sections. */
  children: LawTocChild[];
}

const SOURCES: readonly LawSource[] = ["statute", "regulations"];
export const isLawSource = (raw: string): raw is LawSource => SOURCES.includes(raw as LawSource);

const SECTION_ID_MARK = "::sec::";
const sectionIdOfNode = (docId: string, node: string) => `${docId}${SECTION_ID_MARK}${node}`;
const nodeOf = (sectionId: string) =>
  sectionId.slice(sectionId.indexOf(SECTION_ID_MARK) + SECTION_ID_MARK.length);

// A section's heading starts with "§"; a structure level's ("Subtitle A—…", "PART 1—…") does not.
const SECTION_MARK = "§";
export const isSectionHeading = (heading: string): boolean => heading.startsWith(SECTION_MARK);

/** null when the library has no such document, or no structure level with that node. */
export async function readLawToc(source: LawSource, node?: string): Promise<LawToc | null> {
  const docId = await lawDocIdOf(source);
  const doc = docId ? await getDocument(docId, "law") : null;
  if (!docId || !doc) return null;
  const sectionId = node ? sectionIdOfNode(docId, node) : null;
  const entry = sectionId ? await structureEntry(docId, sectionId) : null;
  if (node && !entry) return null;
  return {
    source,
    docId,
    release: { title: doc.title, published: doc.published },
    node: entry,
    ancestors: sectionId ? await ancestorsOf(sectionId) : [],
    children: await childrenOf(docId, sectionId),
  };
}

async function structureEntry(docId: string, sectionId: string): Promise<LawTocEntry | null> {
  const db = await openLibraryDb("law");
  const res = await db.execute({
    sql: `SELECT heading FROM ref_sections WHERE section_id = ? AND doc_id = ?`,
    args: [sectionId, docId],
  });
  const heading = res.rows[0] ? asStr(res.rows[0].heading) : null;
  return heading && !isSectionHeading(heading) ? { node: nodeOf(sectionId), heading } : null;
}

// "parent_section_id IS ?" matches NULL too, so the top level is the same query.
async function childrenOf(docId: string, sectionId: string | null): Promise<LawTocChild[]> {
  const db = await openLibraryDb("law");
  const res = await db.execute({
    sql: `SELECT section_id, heading FROM ref_sections
          WHERE doc_id = ? AND parent_section_id IS ? ORDER BY ordinal`,
    args: [docId, sectionId],
  });
  return res.rows.map((row) => tocChild(asStr(row.section_id), asStr(row.heading)));
}

function tocChild(sectionId: string, heading: string): LawTocChild {
  if (!isSectionHeading(heading)) return { kind: "group", node: nodeOf(sectionId), heading };
  const number = sectionNumber(heading);
  return {
    kind: "section",
    number,
    citation: formatCitation(number, []),
    heading: catchlineOf(heading),
  };
}

/** The structure levels above a row, outermost first; the row itself is not one. */
export async function ancestorsOf(sectionId: string): Promise<LawTocEntry[]> {
  const db = await openLibraryDb("law");
  const res = await db.execute({
    sql: `WITH RECURSIVE up(section_id, heading, parent_section_id, depth) AS (
            SELECT section_id, heading, parent_section_id, 0 FROM ref_sections WHERE section_id = ?
            UNION ALL
            SELECT s.section_id, s.heading, s.parent_section_id, up.depth + 1
            FROM ref_sections s JOIN up ON s.section_id = up.parent_section_id
          )
          SELECT section_id, heading FROM up WHERE depth > 0 ORDER BY depth DESC`,
    args: [sectionId],
  });
  return res.rows.map((row) => ({
    node: nodeOf(asStr(row.section_id)),
    heading: asStr(row.heading),
  }));
}
