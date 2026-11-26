import { asStr } from "../db/corpusStore";
import { lawInstalled, openLibraryDb } from "../db/libsql";
import {
  formatCitation,
  parseLawTarget,
  resolvePath,
  sectionIdOf,
  sourceOfSection,
  subdivisionsOf,
  type LawSource,
  type LawTarget,
  type PathBlock,
} from "./citation";

/*
 * Reads law.db by citation. Only the law library: nothing here opens
 * corpus.db, and nothing opens law.db before lawInstalled() says it exists.
 */

export const LAW_NOT_INSTALLED =
  "The law library (law.db) is not installed: run `npm run corpus -- law fetch` for the prebuilt file, or `npm run corpus -- law sync` to build it.";

export interface LawBlock {
  blockId: string;
  citation: string;
  headings: string[];
  text: string;
}

export interface LawReading {
  source: LawSource;
  /** The citation as resolved: "26 U.S.C. § 469(g)(1)(A)", "26 CFR § 1.469-5T(a)(1)". */
  citation: string;
  sectionHeading: string;
  blocks: LawBlock[];
  /** The next level down, for narrowing a long read: "26 U.S.C. § 401(a)", … */
  subdivisions: string[];
}

export class LawNotInstalledError extends Error {
  constructor() {
    super(LAW_NOT_INSTALLED);
  }
}

export async function requireLaw(): Promise<void> {
  if (!(await lawInstalled())) throw new LawNotInstalledError();
}

const FORMAT_OF: Record<LawSource, string> = { statute: "uslm", regulations: "ecfr" };

/** "uslm" is the statute, "ecfr" the regulations. */
export const sourceOfFormat = (format: string): LawSource =>
  format === FORMAT_OF.regulations ? "regulations" : "statute";

/* The newest tax year's document of one source; law.db holds one per release. */
export async function lawDocIdOf(source: LawSource): Promise<string | null> {
  const db = await openLibraryDb("law");
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

export const CITATION_HINT = 'try 469, "469(g)(1)", 1.469-5T, "1.469-5T(a)(1)" or a block id';

export type SectionTarget = Exclude<LawTarget, { kind: "block" }>;

/** The section row of a citation, or null when its library is not in law.db. */
export async function targetSectionId(target: SectionTarget): Promise<string | null> {
  const docId = await lawDocIdOf(sourceOfSection(target.section));
  return docId ? sectionIdOf(docId, target.section) : null;
}

/** null when the citation names nothing in the library. */
export async function readLaw(input: string): Promise<LawReading | null> {
  await requireLaw();
  const target = parseLawTarget(input);
  if (!target)
    throw new Error(
      `"${input}" is not a citation of the Code or the regulations (${CITATION_HINT})`,
    );
  if (target.kind === "block") return readBlockId(target.blockId);
  const sectionId = await targetSectionId(target);
  const section = sectionId ? await sectionBlocks(sectionId) : null;
  if (!section) return null;
  const blocks = resolvePath(section.blocks, target.path);
  if (blocks.length === 0) return null;
  return {
    source: sourceOfSection(section.number),
    citation: formatCitation(section.number, target.path),
    sectionHeading: section.heading,
    blocks: blocks.map(toLawBlock),
    subdivisions: subdivisionsOf(section.number, target.path, section.blocks),
  };
}

async function readBlockId(blockId: string): Promise<LawReading | null> {
  const sectionId = blockId.slice(0, blockId.lastIndexOf("::"));
  const section = await sectionBlocks(sectionId);
  const block = section?.blocks.find((row) => row.blockId === blockId);
  if (!section || !block) return null;
  const lawBlock = toLawBlock(block);
  return {
    source: sourceOfSection(section.number),
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
  /** As printed: "469", "1400Z–2", "1.469-5T". */
  number: string;
  heading: string;
  blocks: StoredBlock[];
}

export async function sectionBlocks(sectionId: string): Promise<StoredSection | null> {
  const db = await openLibraryDb("law");
  const head = await db.execute({
    sql: `SELECT heading FROM ref_sections WHERE section_id = ?`,
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
  return { number: sectionNumber(heading), heading, blocks };
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
 * The section row's heading is "§ 469. Passive activity losses…" or
 * "§ 1.469-5T Material participation (temporary).": the number is the word
 * after "§", without the Code's closing period.
 */
function headingParts(heading: string): { number: string; catchline: string } {
  const afterMark = heading.replace(/^§\s*/, "");
  const space = afterMark.indexOf(" ");
  const word = space < 0 ? afterMark : afterMark.slice(0, space);
  const number = word.endsWith(".") ? word.slice(0, -1) : word;
  return { number, catchline: space < 0 ? "" : afterMark.slice(space + 1).trim() };
}

const sectionNumber = (heading: string): string => headingParts(heading).number;

/** "§ 469. Passive activity losses and credits limited" → "Passive activity losses and credits limited". */
export const catchlineOf = (heading: string): string => headingParts(heading).catchline;

const toLawBlock = (block: StoredBlock): LawBlock => ({
  blockId: block.blockId,
  citation: block.citation,
  headings: block.headings,
  text: block.text,
});
