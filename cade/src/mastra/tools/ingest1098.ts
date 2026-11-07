import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

/* The engine reads one Form 1098 (Schedule A line 8a). The key is the engine's answer key for it. */
export const MORTGAGE_INTEREST_FORM_1098_KEY = "mortgage.interest_form_1098";

export const ingest1098 = createTool({
  id: "ingest-1098",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 1098 (Mortgage Interest Statement) from a lender. Call ONCE per form; a second mortgage is not supported yet (say so). Writes the box 1 interest under category 'mortgage' for Schedule A line 8a. Box 10 (other, often real estate taxes paid through escrow) is not a fact: when it shows property tax, ask the user for the real estate taxes they paid and record the answer.",
  inputSchema: z.object({
    year: z.number().int(),
    lenderName: z.string().describe("Recipient/lender's name as printed"),
    box1: z.number().describe("Mortgage interest received from payer(s)/borrower(s)"),
    box2: z.number().optional().describe("Outstanding mortgage principal"),
    box3: z.string().optional().describe("Mortgage origination date, MM/DD/YYYY"),
    box5: z.number().optional().describe("Mortgage insurance premiums"),
    box6: z.number().optional().describe("Points paid on purchase of principal residence"),
    box10: z.number().optional().describe("Other (as printed)"),
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
      sourceNote: `${input.sourceNote} (Form 1098 from ${input.lenderName}, box 1)`,
    };
    await recordIngestFact(ctx, "mortgage", MORTGAGE_INTEREST_FORM_1098_KEY, input.box1);
    return { factKey: MORTGAGE_INTEREST_FORM_1098_KEY };
  },
});
