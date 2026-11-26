import { asStr } from "../db/corpusStore";
import { lawInstalled, openLibraryDb } from "../db/libsql";
import {
  formatCitation,
  parseLawTarget,
  resolvePath,
  sectionIdOf,
  subdivisionsOf,
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
  /** The citation as resolved: "26 U.S.C. § 469(g)(1)(A)". */
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

/* The newest tax year's document; law.db holds one title per release point. */
export async function lawDocId(): Promise<string> {
  const db = await openLibraryDb("law");
  const res = await db.execute(
    `SELECT doc_id FROM ref_documents ORDER BY tax_year DESC, doc_id DESC LIMIT 1`,
  );
  const docId = res.rows[0]?.doc_id;
  if (docId == null) throw new LawNotInstalledError();
  return asStr(docId);
}

/** null when the citation names nothing in the library. */
export async function readLaw(input: string): Promise<LawReading | null> {
  await requireLaw();
  const target = parseLawTarget(input);
  if (!target)
    throw new Error(`"${input}" is not a Code citation (try 469, "469(g)(1)" or a block id)`);
  if (target.kind === "block") return readBlockId(target.blockId);
  const sectionId = sectionIdOf(await lawDocId(), target.section);
  const section = await sectionBlocks(sectionId);
  if (!section) return null;
  const blocks = resolvePath(section.blocks, target.path);
  if (blocks.length === 0) return null;
  return {
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
  /** As printed: "469", "1400Z–2". */
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

// The section row's heading is "§ 469. Passive activity losses…"; the number sits between.
function sectionNumber(heading: string): string {
  const afterMark = heading.replace(/^§\s*/, "");
  return afterMark.slice(0, afterMark.indexOf(".")).trim();
}

/** "§ 469. Passive activity losses and credits limited" → "Passive activity losses and credits limited". */
export function catchlineOf(heading: string): string {
  return heading.slice(heading.indexOf(".") + 1).trim();
}

const toLawBlock = (block: StoredBlock): LawBlock => ({
  blockId: block.blockId,
  citation: block.citation,
  headings: block.headings,
  text: block.text,
});
