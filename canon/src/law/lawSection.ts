import { asStr, getDocument } from "../db/corpusStore";
import {
  installedLawJurisdictions,
  lawLibrary,
  type LawLibrary,
  openLibraryDb,
} from "../db/libsql";
import { versionOfSectionId } from "./caCitation";
import { citationIn, type LawSource, parseLawTarget, sourceOfTarget } from "./citation";
import { lawLibraryOfSource } from "./lawLibrary";
import {
  catchlineOf,
  lawDocIdOf,
  sectionBlocks,
  sourceOfFormat,
  type StoredSection,
  targetSectionId,
  versionSectionIds,
} from "./lawRead";
import { ancestorsOf, type LawTocEntry } from "./lawToc";

/*
 * One whole section, of the Code, the regulations or California's code,
 * for the web app's law page, and the library's status. A California
 * number with several versions shows them all, in order, each under its
 * own heading. lawDocIdOf() returns null for a source whose law file is not
 * installed, so a missing file is never opened.
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
  /** A number with several versions: each one's heading and first block. Empty for one version. */
  versions: LawSectionVersion[];
}

export interface LawSectionVersion {
  version: number;
  /** "Version 2 of 2. (Amended by Stats. 2026, … Operative January 1, 2027, …)". */
  heading: string;
  firstBlockId: string;
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
  const source = sourceOfTarget(target);
  const sectionId = await targetSectionId(target);
  const docId = await lawDocIdOf(source);
  if (!sectionId || !docId) return null;
  const ids = await versionSectionIds(sectionId);
  const [doc, ...found] = await Promise.all([
    getDocument(docId, lawLibraryOfSource(source)),
    ...ids.map(sectionBlocks),
  ]);
  const sections = found.filter((section): section is StoredSection => section !== null);
  if (!doc || sections.length === 0) return null;
  const [first] = sections;
  return {
    source,
    section: {
      number: first.number,
      citation: citationIn(source, first.number, []),
      heading: catchlineOf(first.heading),
      breadcrumbs: await ancestorsOf(ids[0]),
    },
    release: { title: doc.title, published: doc.published },
    blocks: sections.flatMap((section) =>
      section.blocks.map(({ blockId, path, citation, text }) => ({
        blockId,
        path,
        citation,
        text,
      })),
    ),
    versions:
      sections.length > 1 ? sections.flatMap((section, i) => versionOf(section, ids[i])) : [],
  };
}

function versionOf(section: StoredSection, sectionId: string): LawSectionVersion[] {
  const first = section.blocks[0];
  if (!first) return [];
  return [
    {
      version: versionOfSectionId(sectionId),
      heading: catchlineOf(section.heading),
      firstBlockId: first.blockId,
    },
  ];
}

/*
 * The documents of every installed law file, in table order: federal (the
 * statute, then the regulations), then California.
 */
export async function lawStatus(): Promise<LawStatus> {
  const documents: LawStatusDocument[] = [];
  for (const jurisdiction of await installedLawJurisdictions())
    documents.push(...(await statusOf(lawLibrary(jurisdiction))));
  return { documents };
}

/* A section's heading starts with "§"; a structure level's ("Subtitle A—…", "PART 1—…") does not. */
async function statusOf(library: LawLibrary): Promise<LawStatusDocument[]> {
  const db = await openLibraryDb(library);
  const res = await db.execute(
    `SELECT d.doc_id, d.title, d.published, d.format,
            (SELECT count(*) FROM ref_sections s WHERE s.doc_id = d.doc_id AND s.heading LIKE '§%') AS n
     FROM ref_documents d
     ORDER BY CASE d.format WHEN 'uslm' THEN 0 WHEN 'ecfr' THEN 1 ELSE 2 END, d.tax_year DESC, d.doc_id`,
  );
  return res.rows.map((row) => ({
    docId: asStr(row.doc_id),
    source: sourceOfFormat(asStr(row.format)),
    title: asStr(row.title),
    published: row.published == null ? null : asStr(row.published),
    sections: Number(row.n ?? 0),
  }));
}
