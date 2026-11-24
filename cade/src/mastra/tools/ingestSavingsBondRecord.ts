import { createTool } from "@mastra/core/tools";
import {
  makeSavingsBondCashedFactKey,
  type SavingsBondCashedFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

export const SavingsBondRowSchema = z.object({
  serialNumber: z
    .string()
    .optional()
    .describe("The bond's serial number as printed. Leave it out when the row prints none."),
  series: z.enum(["EE", "I"]).describe("The bond's series: EE or I"),
  format: z
    .enum(["paper", "electronic"])
    .describe(
      "Paper or electronic as the record prints it. A paper bond converted to electronic is electronic.",
    ),
  issueDate: z
    .string()
    .describe("The issue date as printed: MM/YYYY (a bond is dated the first of its month)"),
  faceValue: z.number().describe("Face value (denomination) of the bond"),
  proceeds: z.number().describe("Total redemption proceeds of this bond, principal and interest"),
  interestReportedInPriorYears: z
    .number()
    .optional()
    .describe(
      "The user's answer: interest on this bond they reported as income before 2025. Leave it out when none.",
    ),
  ownerQualifies: z
    .boolean()
    .describe(
      "The user's answer: the bond is in the filer's name (or both spouses' names) and the owner was 24 or older before the issue date. False for a bond in a child's name.",
    ),
});
export type SavingsBondRow = z.infer<typeof SavingsBondRowSchema>;

export const SavingsBondRecordSchema = z.object({
  year: z.number().int(),
  bonds: z.array(SavingsBondRowSchema).describe("Every bond on the record, one entry per row"),
  sourceNote: z.string().default("Savings bond record ingested via structured payload"),
});
export type SavingsBondRecordInput = z.input<typeof SavingsBondRecordSchema>;

/*
 * The record's "MM/YYYY" as the fact holds it: "2004-03-01". A date with a day
 * ("03/01/2004") keeps its day; a date already in YYYY-MM-DD stays as it is.
 */
export function issueDateOf(printed: string): string {
  const text = printed.trim();
  const slashParts = text.split("/");
  if (slashParts.length === 2) {
    const [month, year] = slashParts;
    return `${year}-${month.padStart(2, "0")}-01`;
  }
  if (slashParts.length === 3) {
    const [month, day, year] = slashParts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const dashParts = text.split("-");
  return dashParts.length === 2 ? `${text}-01` : text;
}

/* "paper-ee", "electronic-ee" or "series-i": what the Line 6 Worksheet sorts bonds by. */
const kindSlugOf = (row: SavingsBondRow): string =>
  row.series === "I" ? "series-i" : `${row.format}-ee`;

/* A second bond of the same kind and issue year takes -2, the third -3. */
function uniqueSlug(base: string, used: ReadonlySet<string>): string {
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

/* Drops the fields that hold nothing, so a blank cell is absent from the fact. */
const withoutBlanks = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T;

function bondValueOf(row: SavingsBondRow): SavingsBondCashedFactValue {
  return withoutBlanks<SavingsBondCashedFactValue>({
    serialNumber: row.serialNumber,
    series: row.series,
    format: row.format,
    issueDate: issueDateOf(row.issueDate),
    faceValue: row.faceValue,
    proceeds: row.proceeds,
    interestReportedInPriorYears: row.interestReportedInPriorYears,
    ownerQualifies: row.ownerQualifies,
  });
}

/* One fact per bond, keyed by the bond's kind and issue year ("paper-ee-2004"). */
export function savingsBondFactsOf(
  rows: SavingsBondRow[],
): { key: string; value: SavingsBondCashedFactValue }[] {
  const slugs: string[] = [];
  return rows.map((row) => {
    const value = bondValueOf(row);
    const issueYear = value.issueDate.split("-")[0];
    const slug = uniqueSlug(`${kindSlugOf(row)}-${issueYear}`, new Set(slugs));
    slugs.push(slug);
    return { key: makeSavingsBondCashedFactKey(slug), value };
  });
}

export const ingestSavingsBondRecord = createTool({
  id: "ingest-savings-bond-record",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest a record of U.S. savings bonds cashed (Form 8818, or a redemption record from the bank or TreasuryDirect) for the education savings bond exclusion (Form 8815). Call ONCE per record with every row in `bonds`. Writes one fact per bond under category 'education'. Copy each row as printed, including a bond issued before 1990; do not work out interest or totals. Each bond also needs the user's answer to the ownership test (`ownerQualifies`). The bonds' interest still comes from the Form 1099-INT, box 3.",
  inputSchema: SavingsBondRecordSchema,
  outputSchema: z.object({ factKeys: z.array(z.string()) }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const facts = savingsBondFactsOf(input.bonds);
    for (const [index, { key, value }] of facts.entries()) {
      const ctx: IngestCtx = {
        scope,
        userId,
        filingId,
        year: input.year,
        sourceNote: `${input.sourceNote} (savings bond record, row ${index + 1})`,
      };
      await recordIngestFact(ctx, "education", key, value);
    }
    return { factKeys: facts.map((fact) => fact.key) };
  },
});
