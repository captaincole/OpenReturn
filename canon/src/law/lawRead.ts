import { asStr } from "../db/corpusStore";
import { installedLawJurisdictions, lawFileName, lawInstalled, openLibraryDb } from "../db/libsql";
import {
  ALL_JURISDICTIONS,
  coversAll,
  jurisdictionName,
  jurisdictionOfLawId,
  jurisdictionOfLawSource,
  type Jurisdiction,
} from "../jurisdiction";
import {
  citationIn,
  parseLawTarget,
  resolvePath,
  sectionIdIn,
  sourceOfTarget,
  subdivisionsOf,
  type LawSource,
  type LawTarget,
  type PathBlock,
  type SectionTarget,
} from "./citation";
import { CA_VERSION_MARK } from "./lawIds";
import { lawLibraryOfId, lawLibraryOfSource } from "./lawLibrary";

/*
 * Reads the law files by citation. Only the law library: nothing here opens
 * corpus.db, and nothing opens a jurisdiction's law file before
 * lawInstalled() says it exists.
 */

export const LAW_NOT_INSTALLED =
  "The law library is not installed: run `npm run corpus -- law fetch` for the prebuilt files, or `npm run corpus -- law sync` to build them.";

/** The message for law files that are missing: all of them, or the named jurisdictions'. */
export function lawNotInstalledMessage(missing: readonly Jurisdiction[] = ALL_JURISDICTIONS) {
  if (coversAll(missing)) return LAW_NOT_INSTALLED;
  const names = missing.map(jurisdictionName).join(" and ");
  const files = missing.map((jurisdiction) => `law/${lawFileName(jurisdiction)}`).join(", ");
  const fetches = missing.map(
    (jurisdiction) => `\`npm run corpus -- law fetch --jurisdiction ${jurisdiction}\``,
  );
  return `The ${names} law (${files}) is not installed: run ${fetches.join(" and ")} for the prebuilt file, or \`npm run corpus -- law sync\` to build it.`;
}

export interface LawBlock {
  blockId: string;
  citation: string;
  headings: string[];
  text: string;
}

export interface LawReading {
  source: LawSource;
  /** The citation as resolved: "26 U.S.C. § 469(g)(1)(A)", "26 CFR § 1.469-5T(a)(1)", "Cal. Rev. & Tax. Code § 17041(a)". */
  citation: string;
  sectionHeading: string;
  blocks: LawBlock[];
  /** The next level down, for narrowing a long read: "26 U.S.C. § 401(a)", … */
  subdivisions: string[];
}

export class LawNotInstalledError extends Error {
  constructor(missing?: readonly Jurisdiction[]) {
    super(lawNotInstalledMessage(missing));
  }
}

/** The jurisdictions of these (all unless named) that are installed; throws when none is. */
export async function requireLaw(
  jurisdictions: readonly Jurisdiction[] = ALL_JURISDICTIONS,
): Promise<Jurisdiction[]> {
  const installed = await installedLawJurisdictions(jurisdictions);
  if (installed.length === 0) throw new LawNotInstalledError(jurisdictions);
  return installed;
}

/** The jurisdiction a citation names, or null when it names no law (a corpus block id, no citation). */
export function jurisdictionOfCitation(input: string): Jurisdiction | null {
  const target = parseLawTarget(input);
  return target ? jurisdictionOfTarget(target) : null;
}

const jurisdictionOfTarget = (target: LawTarget): Jurisdiction | null =>
  target.kind === "block"
    ? jurisdictionOfLawId(target.blockId)
    : jurisdictionOfLawSource(sourceOfTarget(target));

const FORMAT_OF: Record<LawSource, string> = {
  statute: "uslm",
  regulations: "ecfr",
  california: "caml",
};

/** The format of a source's document in its law file (a sidecar's format). */
export const formatOfSource = (source: LawSource): string => FORMAT_OF[source];

/** "uslm" is the statute, "ecfr" the regulations, "caml" California's code. */
export const sourceOfFormat = (format: string): LawSource =>
  (Object.keys(FORMAT_OF) as LawSource[]).find((source) => FORMAT_OF[source] === format) ??
  "statute";

/*
 * The newest tax year's document of one source; a law file holds one per
 * release. null when the source's file is not installed: it is never created.
 */
export async function lawDocIdOf(source: LawSource): Promise<string | null> {
  if (!(await lawInstalled(jurisdictionOfLawSource(source)))) return null;
  const db = await openLibraryDb(lawLibraryOfSource(source));
  const res = await db.execute({
    sql: `SELECT doc_id FROM ref_documents WHERE format = ? ORDER BY tax_year DESC, doc_id DESC LIMIT 1`,
    args: [FORMAT_OF[source]],
  });
  const docId = res.rows[0]?.doc_id;
  return docId == null ? null : asStr(docId);
}

/** The statute's document id; the eval and older callers read the Code only. */
export async function lawDocId(): Promise<string> {
  const docId = await lawDocIdOf("statute");
  if (docId == null) throw new LawNotInstalledError();
  return docId;
}

export const CITATION_HINT =
  'try 469, "469(g)(1)", 1.469-5T, "1.469-5T(a)(1)", California\'s "CA 17041(a)" or a block id';

/** The section row of a citation, or null when its source is not installed. */
export async function targetSectionId(target: SectionTarget): Promise<string | null> {
  const source = sourceOfTarget(target);
  const docId = await lawDocIdOf(source);
  return docId ? sectionIdIn(docId, source, target.section) : null;
}

/*
 * The rows of every version of a section: one for most, "s17058" and
 * "s17058-v2" for a California number with a version in force and one to
 * come. The first version's id has no mark.
 */
export async function versionSectionIds(sectionId: string): Promise<string[]> {
  const db = await openLibraryDb(lawLibraryOfId(sectionId));
  const res = await db.execute({
    sql: `SELECT section_id FROM ref_sections
          WHERE section_id = ? OR substr(section_id, 1, ?) = ? ORDER BY ordinal`,
    args: [sectionId, sectionId.length + CA_VERSION_MARK.length, `${sectionId}${CA_VERSION_MARK}`],
  });
  return res.rows.map((row) => asStr(row.section_id));
}

/** null when the citation names nothing in the library. */
export async function readLaw(input: string): Promise<LawReading | null> {
  const target = parseLawTarget(input);
  if (!target)
    throw new Error(`"${input}" is not a citation of the law library (${CITATION_HINT})`);
  const jurisdiction = jurisdictionOfTarget(target);
  if (jurisdiction === null) return null;
  await requireLaw([jurisdiction]);
  if (target.kind === "block") return readBlockId(target.blockId);
  const sectionId = await targetSectionId(target);
  const versions = sectionId ? await versionSections(sectionId) : [];
  if (versions.length === 0) return null;
  // Every version of a California number answers: no version is picked silently.
  const blocks = versions.flatMap((version) => resolvePath(version.blocks, target.path));
  if (blocks.length === 0) return null;
  const [first] = versions;
  const source = sourceOfTarget(target);
  const subdivisions = versions.flatMap((version) =>
    subdivisionsOf(first.number, target.path, version.blocks, source),
  );
  return {
    source,
    citation: citationIn(source, first.number, target.path),
    sectionHeading: first.heading,
    blocks: blocks.map(toLawBlock),
    subdivisions: [...new Set(subdivisions)],
  };
}

async function versionSections(sectionId: string): Promise<StoredSection[]> {
  const sections = await Promise.all((await versionSectionIds(sectionId)).map(sectionBlocks));
  return sections.filter((section): section is StoredSection => section !== null);
}

async function readBlockId(blockId: string): Promise<LawReading | null> {
  const sectionId = blockId.slice(0, blockId.lastIndexOf("::"));
  const section = await sectionBlocks(sectionId);
  const block = section?.blocks.find((row) => row.blockId === blockId);
  if (!section || !block) return null;
  const lawBlock = toLawBlock(block);
  return {
    source: section.source,
    citation: lawBlock.citation,
    sectionHeading: section.heading,
    blocks: [lawBlock],
    subdivisions: [],
  };
}

export interface StoredBlock extends PathBlock {
  citation: string;
  headings: string[];
}

export interface StoredSection {
  source: LawSource;
  /** As printed: "469", "1400Z–2", "1.469-5T", "17024.5". */
  number: string;
  heading: string;
  blocks: StoredBlock[];
}

export async function sectionBlocks(sectionId: string): Promise<StoredSection | null> {
  const db = await openLibraryDb(lawLibraryOfId(sectionId));
  const head = await db.execute({
    sql: `SELECT s.heading, d.format FROM ref_sections s JOIN ref_documents d ON d.doc_id = s.doc_id
          WHERE s.section_id = ?`,
    args: [sectionId],
  });
  if (!head.rows[0]) return null;
  const res = await db.execute({
    sql: `SELECT block_id, text, metadata_json FROM ref_blocks WHERE section_id = ? ORDER BY ordinal`,
    args: [sectionId],
  });
  const blocks = res.rows.map((row) =>
    storedBlock(asStr(row.block_id), asStr(row.text), row.metadata_json),
  );
  const heading = asStr(head.rows[0].heading);
  const source = sourceOfFormat(asStr(head.rows[0].format));
  return { source, number: sectionNumber(heading), heading, blocks };
}

function storedBlock(blockId: string, text: string, metadataJson: unknown): StoredBlock {
  const metadata = JSON.parse(asStr(metadataJson) || "{}") as Partial<StoredBlock>;
  return {
    blockId,
    text,
    path: metadata.path ?? [],
    citation: metadata.citation ?? "",
    headings: metadata.headings ?? [],
  };
}

/*
 * The section row's heading is "§ 469. Passive activity losses…",
 * "§ 1.469-5T Material participation (temporary)." or California's
 * "§ 17041. (Amended by Stats. …)": the number is the word after "§",
 * without the closing period.
 */
function headingParts(heading: string): { number: string; catchline: string } {
  const afterMark = heading.replace(/^§\s*/, "");
  const space = afterMark.indexOf(" ");
  const word = space < 0 ? afterMark : afterMark.slice(0, space);
  const number = word.endsWith(".") ? word.slice(0, -1) : word;
  return { number, catchline: space < 0 ? "" : afterMark.slice(space + 1).trim() };
}

/** "§ 469. Passive activity losses…" → "469"; "§ 1.469-5T Material…" → "1.469-5T". */
export const sectionNumber = (heading: string): string => headingParts(heading).number;

/** "§ 469. Passive activity losses and credits limited" → "Passive activity losses and credits limited". */
export const catchlineOf = (heading: string): string => headingParts(heading).catchline;

const toLawBlock = (block: StoredBlock): LawBlock => ({
  blockId: block.blockId,
  citation: block.citation,
  headings: block.headings,
  text: block.text,
});
