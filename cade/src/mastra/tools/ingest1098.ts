import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

/* The engine reads one Form 1098 (Schedule A line 8a). The key is the engine's answer key for it. */
export const MORTGAGE_INTEREST_FORM_1098_KEY = "mortgage.interest_form_1098";

/* Schedule A line 8a: "home mortgage interest and points reported to you on Form 1098" (boxes 1 and 6). */
export const form1098Line8a = (box1: number, box6?: number): number => box1 + (box6 ?? 0);

export const ingest1098 = createTool({
  id: "ingest-1098",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 1098 (Mortgage Interest Statement) from a lender. Call ONCE per form; a second mortgage is not supported yet (say so). Writes box 1 plus box 6 (interest and points reported on the 1098) under category 'mortgage' for Schedule A line 8a. The other boxes are not facts: when box 10 shows real estate taxes paid through escrow, ask the user for the real estate taxes they paid and record the answer.",
  inputSchema: z.object({
    year: z.number().int(),
    lenderName: z.string().describe("Recipient/lender's name as printed"),
    box1: z.number().describe("Mortgage interest received from payer(s)/borrower(s)"),
    box6: z.number().optional().describe("Points paid on purchase of principal residence"),
    sourceNote: z.string().default("Form 1098 ingested via structured payload"),
  }),
  outputSchema: z.object({ factKey: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const ctx: IngestCtx = {
      scope,
      userId,
      filingId,
      year: input.year,
      sourceNote: `${input.sourceNote} (Form 1098 from ${input.lenderName}, boxes 1 and 6)`,
    };
    await recordIngestFact(
      ctx,
      "mortgage",
      MORTGAGE_INTEREST_FORM_1098_KEY,
      form1098Line8a(input.box1, input.box6),
    );
    return { factKey: MORTGAGE_INTEREST_FORM_1098_KEY };
  },
});
