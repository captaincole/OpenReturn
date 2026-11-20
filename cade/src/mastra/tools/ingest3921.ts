import { createTool } from "@mastra/core/tools";
import { makeIsoExerciseFactKey, type IsoExerciseFactValue } from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, slugify, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

/* "06/16/2025" as it goes in the fact key: "2025-06-16". Another shape is kept as a slug. */
export function keyDateOf(formDate: string): string {
  const parts = formDate.trim().split("/");
  if (parts.length !== 3) return slugify(formDate);
  const [month, day, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export const ingest3921 = createTool({
  id: "ingest-3921",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 3921 (Exercise of an Incentive Stock Option Under Section 422(b)). Call ONCE per form: each exercise has its own form. Writes one fact under category 'other'. Copy the boxes as printed; do not work out the spread. The return then needs one answer the form does not carry: whether the shares were still held at the end of the year ('amt.iso_shares_held_at_year_end').",
  inputSchema: z.object({
    year: z.number().int(),
    employer: z.object({
      name: z.string().describe("The TRANSFEROR'S name: the corporation that granted the option"),
      tin: z.string().optional().describe("The TRANSFEROR'S TIN"),
    }),
    employerSlug: z
      .string()
      .optional()
      .describe("Stable slug for this employer in the fact key. Defaults to the slugified name."),
    box1: z.string().describe("Date option granted, MM/DD/YYYY"),
    box2: z.string().describe("Date option exercised, MM/DD/YYYY"),
    box3: z.number().describe("Exercise price per share"),
    box4: z.number().describe("Fair market value per share on exercise date"),
    box5: z.number().describe("No. of shares transferred"),
    sourceNote: z.string().default("Form 3921 ingested via structured payload"),
  }),
  outputSchema: z.object({ factKey: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const ctx: IngestCtx = {
      scope,
      userId,
      filingId,
      year: input.year,
      sourceNote: input.sourceNote,
    };
    const value: IsoExerciseFactValue = {
      employerName: input.employer.name,
      employerTin: input.employer.tin,
      box1: input.box1,
      box2: input.box2,
      box3: input.box3,
      box4: input.box4,
      box5: input.box5,
    };
    const slug = input.employerSlug || slugify(input.employer.name) || "employer";
    const factKey = makeIsoExerciseFactKey(slug, keyDateOf(input.box2));
    await recordIngestFact(ctx, "other", factKey, value);
    return { factKey };
  },
});
