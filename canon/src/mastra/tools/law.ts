import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { lawInstalled } from "../../db/libsql";
import { jurisdictionsInputSchema } from "../../jurisdiction";
import { LAW_NOT_INSTALLED, readLaw, type LawBlock } from "../../law/lawRead";
import { searchLaw } from "../../law/lawSearch";

/*
 * The law (law.db: the statute, the Treasury regulations and California's
 * personal income tax law) is a second library, searched only on purpose.
 * Both tools answer { installed: false } when law.db is missing, and never
 * create the file.
 */

const SOURCES = ["statute", "regulations", "california"] as const;

const WHEN_TO_USE =
  'This is the law, not the IRS instructions: the statute, the Internal Revenue Code (26 U.S.C.), and the Treasury regulations (26 CFR Parts 1 and 301). Search the form instructions first (searchRefDocs). Use this only when two instructions conflict, or when the instructions do not settle the question. Write the query in the law\'s own terms, which the instructions supply ("disposition of entire interest in passive activity", not "sold my partnership"). The regulations are Treasury\'s rules under the statute and answer many questions the statute leaves to them. The statute is the law: a regulation can be older than a change to the statute it explains. A passage can conflict with another passage or with the instructions: then report both texts, with their citations, and do not pick one.';

/*
 * California conforms to the Code as of a fixed date (Cal. Rev. & Tax. Code
 * § 17024.5(a)(1): January 1, 2025 for taxable years beginning on or after
 * January 1, 2025), with its own changes; the library's Code is the text as
 * of January 2026.
 */
const CALIFORNIA =
  'California: source "california" is the California Revenue and Taxation Code, Division 2, Part 10 (Personal Income Tax, §§ 17001–18181) and Part 10.2 (administration: penalties, estimated tax, withholding, §§ 18401–19802), Part 11 (Corporation Tax Law, §§ 23001–25141), and the smaller parts of the franchise and income tax laws: the elective tax of a pass-through entity (Part 10.4, §§ 19900–19907), the Taxpayers\' Bill of Rights (Part 10.7, §§ 21001–21028) and the health coverage penalty (Part 32, §§ 61000–61050). Part 11 is the law for corporations: many of its sections repeat a Part 10 rule for a corporation, so for an individual\'s rule cite the Part 10 section. An individual reads Part 11 where Part 10 sends them: Chapter 17 (Allocation of Income, §§ 25101–25141: how business income is divided between California and other states, the sales factor of § 25128.7, the sourcing of sales in §§ 25135–25136) and Chapter 4.5 (S corporations, from § 23800). It is searched only when you name it (source "california", or jurisdictions with "CA"): a search with neither never returns California. Name California\'s code in a citation: "CA 17041(a)" or "Cal. Rev. & Tax. Code § 17024.5"; a bare number is the Internal Revenue Code. California adopts the Internal Revenue Code as of a fixed date, with its own changes: § 17024.5(a)(1) sets January 1, 2025 for taxable years beginning on or after January 1, 2025, and many sections of Part 10 change or refuse a federal rule. The library\'s federal text is the Code as of January 2026, so a federal rule enacted after California\'s date may not be California law: read the California section that adopts or changes it, and cite both.';

const notInstalled = z.object({ installed: z.literal(false), message: z.string() });

const lawHitSchema = z.object({
  blockId: z.string(),
  source: z.enum(SOURCES),
  citation: z.string(),
  sectionHeading: z.string().nullable(),
  headings: z.array(z.string()),
  text: z.string(),
  score: z.number(),
});

export const searchLawTool = createTool({
  id: "search-law",
  description: `Search the Internal Revenue Code and the Treasury regulations, or California's personal income tax law and its apportionment rules. ${WHEN_TO_USE} ${CALIFORNIA} Each hit names its source and citation ("26 U.S.C. § 469(h)(2)", "26 CFR § 1.469-5T(a)(1)", "Cal. Rev. & Tax. Code § 17041(a)"); read the whole subdivision with readLaw.`,
  inputSchema: z.object({
    query: z.string().describe("The rule in the law's words, taken from the instructions."),
    source: z
      .enum(SOURCES)
      .optional()
      .describe(
        'Optional: one source only. Default: the sources of jurisdictions, else the statute and the regulations. "california" is California\'s code, searched only when named.',
      ),
    jurisdictions: jurisdictionsInputSchema.describe(
      'Optional: the law of these jurisdictions. ["federal"] is the statute and the regulations; ["CA"] is California\'s code; ["federal", "CA"] is all three. Each source is searched on its own, and the hits take turns: statute, regulations, california. With source as well, the source must belong to a jurisdiction in the list. Leave out both for the federal law only: California hits mixed into a federal question push out federal hits, so ask for California on purpose, with ["CA"] or source "california".',
    ),
    section: z
      .string()
      .optional()
      .describe('Optional: search one section only, e.g. "469", "1.469-5T" or "CA 17041".'),
    limit: z.number().int().min(1).max(25).optional().describe("Max hits to return (default 8)."),
    mode: z
      .enum(["fts", "vector", "hybrid"])
      .optional()
      .describe("Retrieval mode. Default 'hybrid'. Override only for evals or debugging."),
  }),
  outputSchema: z.union([
    z.object({ installed: z.literal(true), query: z.string(), results: z.array(lawHitSchema) }),
    notInstalled,
  ]),
  execute: async (input) => {
    if (!(await lawInstalled())) return { installed: false as const, message: LAW_NOT_INSTALLED };
    const results = await searchLaw(input);
    return { installed: true as const, query: input.query, results };
  },
});

// A whole long section (401 is over 300 KB) would flood the caller: it gets the start and the way to narrow.
const MAX_READ_BLOCKS = 40;
const MAX_READ_CHARS = 40_000;

const lawBlockSchema = z.object({
  blockId: z.string(),
  citation: z.string(),
  headings: z.array(z.string()),
  text: z.string(),
});

export const readLawTool = createTool({
  id: "read-law",
  description: `Read the Internal Revenue Code, a Treasury regulation or California's code by citation: a section ("469", "1.469-5T", "CA 17041"), a subdivision ("469(g)(1)(A)", "1.469-5T(a)(1)", "CA 17041(i)(1)") or a block id from searchLaw. A number with a dot is a regulation; a California section must name its code ("CA", "R&TC" or "Cal. Rev. & Tax. Code"). A California number with two versions (one operative until a date, one from that date) returns both; each block's headings name its version and dates. ${WHEN_TO_USE} ${CALIFORNIA} Returns the blocks in order. A long read is cut short with truncated: true and the list of its subdivisions: read one of them instead.`,
  inputSchema: z.object({
    citation: z
      .string()
      .describe(
        'A citation, e.g. "469(g)(1)", "26 CFR 1.469-5T(a)" or "CA 17041(a)", or a block id.',
      ),
  }),
  outputSchema: z.union([
    z.object({
      installed: z.literal(true),
      found: z.boolean(),
      source: z.enum(SOURCES).optional(),
      citation: z.string(),
      sectionHeading: z.string().nullable(),
      blocks: z.array(lawBlockSchema),
      truncated: z.boolean(),
      subdivisions: z.array(z.string()),
      message: z.string().optional(),
    }),
    notInstalled,
  ]),
  execute: async ({ citation }) => {
    if (!(await lawInstalled())) return { installed: false as const, message: LAW_NOT_INSTALLED };
    const reading = await readLaw(citation).catch((err: unknown) =>
      err instanceof Error ? err.message : String(err),
    );
    if (reading === null || typeof reading === "string") {
      const message = reading ?? `nothing in the law library at ${citation}`;
      const empty = { citation, sectionHeading: null, blocks: [], subdivisions: [] };
      return { installed: true as const, found: false, truncated: false, message, ...empty };
    }
    const blocks = capped(reading.blocks);
    return {
      installed: true as const,
      found: true,
      ...reading,
      blocks,
      truncated: blocks.length < reading.blocks.length,
    };
  },
});

function capped(blocks: LawBlock[]): LawBlock[] {
  let chars = 0;
  const kept: LawBlock[] = [];
  for (const block of blocks.slice(0, MAX_READ_BLOCKS)) {
    chars += block.text.length;
    if (chars > MAX_READ_CHARS && kept.length > 0) break;
    kept.push(block);
  }
  return kept;
}
