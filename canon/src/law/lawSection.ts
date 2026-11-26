import { asStr, getDocument } from "../db/corpusStore";
import { openLibraryDb } from "../db/libsql";
import { formatCitation, type LawSource, parseLawTarget, sourceOfSection } from "./citation";
import { catchlineOf, lawDocIdOf, sectionBlocks, sourceOfFormat, targetSectionId } from "./lawRead";
import { ancestorsOf, type LawTocEntry } from "./lawToc";

/*
 * One whole section, of the Code or of the regulations, for the web app's
 * law page, and the library's status. Callers check lawInstalled() first:
 * these open law.db.
 */

export interface LawSectionBlock {
  blockId: string;
  /** The citation path: ["g", "1"]. A continuation or a second piece shares its unit's path. */
  path: string[];
  citation: string;
  text: string;
}

export interface LawSectionPage {
  source: LawSource;
  section: {
    /** As printed: "469", "1400Z–2", "1.469-5T". */
    number: string;
    citation: string;
    heading: string;
    /** The structure levels above the section, outermost first: "Subtitle A—Income Taxes", … */
    breadcrumbs: LawTocEntry[];
  };
  release: { title: string; published: string | null };
  blocks: LawSectionBlock[];
}

export interface LawStatusDocument {
  docId: string;
  source: LawSource;
  title: string;
  published: string | null;
  /** Sections with text: Code sections, or regulation sections. */
  sections: number;
}

export interface LawStatus {
  documents: LawStatusDocument[];
}

/** null when the input is not a bare section number, or the library has no such section. */
export async function readLawSection(input: string): Promise<LawSectionPage | null> {
  const target = parseLawTarget(input);
  if (!target || target.kind === "block" || target.path.length > 0) return null;
  const sectionId = await targetSectionId(target);
  const docId = await lawDocIdOf(sourceOfSection(target.section));
  if (!sectionId || !docId) return null;
  const [section, doc] = await Promise.all([sectionBlocks(sectionId), getDocument(docId, "law")]);
  if (!section || !doc) return null;
  return {
    source: sourceOfSection(section.number),
    section: {
      number: section.number,
      citation: formatCitation(section.number, []),
      heading: catchlineOf(section.heading),
      breadcrumbs: await ancestorsOf(sectionId),
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

// A section's heading starts with "§"; a structure level's ("Subtitle A—…", "PART 1—…") does not.
export async function lawStatus(): Promise<LawStatus> {
  const db = await openLibraryDb("law");
  const res = await db.execute(
    `SELECT d.doc_id, d.title, d.published, d.format,
            (SELECT count(*) FROM ref_sections s WHERE s.doc_id = d.doc_id AND s.heading LIKE '§%') AS n
     FROM ref_documents d
     ORDER BY d.format = 'ecfr', d.tax_year DESC, d.doc_id`,
  );
  return {
    documents: res.rows.map((row) => ({
      docId: asStr(row.doc_id),
      source: sourceOfFormat(asStr(row.format)),
      title: asStr(row.title),
      published: row.published == null ? null : asStr(row.published),
      sections: Number(row.n ?? 0),
    })),
  };
}
