import { createTool } from "@mastra/core/tools";
import { MORTGAGE_KEYS } from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

/* Schedule A line 8a: "home mortgage interest and points reported to you on Form 1098" (boxes 1 and 6). */
export const form1098Line8a = (box1: number, box6?: number): number => box1 + (box6 ?? 0);

export const ingest1098 = createTool({
  id: "ingest-1098",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 1098 (Mortgage Interest Statement) from a lender. Call ONCE per form; a second mortgage is not supported yet (say so). Writes three facts under category 'mortgage': box 1 plus box 6 (interest and points, Schedule A line 8a), box 2 (outstanding principal, for the $750,000 acquisition-debt limit) and box 3 (origination date). When box 10 shows real estate taxes paid through escrow, ask the user for the real estate taxes they paid and record the answer.",
  inputSchema: z.object({
    year: z.number().int(),
    lenderName: z.string().describe("Recipient/lender's name as printed"),
    box1: z.number().describe("Mortgage interest received from payer(s)/borrower(s)"),
    box2: z.number().describe("Outstanding mortgage principal"),
    box3: z.string().optional().describe("Mortgage origination date, MM/DD/YYYY"),
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
      sourceNote: `${input.sourceNote} (Form 1098 from ${input.lenderName})`,
    };
    await recordIngestFact(
      ctx,
      "mortgage",
      MORTGAGE_KEYS.interestForm1098,
      form1098Line8a(input.box1, input.box6),
    );
    await recordIngestFact(ctx, "mortgage", MORTGAGE_KEYS.outstandingPrincipalForm1098, input.box2);
    if (input.box3 !== undefined) {
      await recordIngestFact(ctx, "mortgage", MORTGAGE_KEYS.originationDateForm1098, input.box3);
    }
    return { factKey: MORTGAGE_KEYS.interestForm1098 };
  },
});
