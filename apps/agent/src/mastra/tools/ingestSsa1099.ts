import { createTool } from "@mastra/core/tools";
import { makeSocialSecurityFactKey, type SocialSecurityFactValue } from "@openreturn/engine/facts";
import { z } from "zod";
import { recordIngestFact, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

/*
 * Ingest one Form SSA-1099 (Social Security benefits) as a single
 * structured tax_facts row. Box 5 (net benefits) feeds Form 1040 line 6a
 * and the Social Security Benefits Worksheet; box 6 (voluntary
 * withholding) feeds line 25b.
 *
 * Form RRB-1099 is not supported: its boxes differ (box 6 is the
 * workers' compensation offset; withholding is box 10).
 *
 * Convention (see engine/src/facts/kinds/socialSecurity.ts):
 *   category: "retirement"
 *   key:      "payer.ssa.social_security"
 */

export const ingestSsa1099 = createTool({
  id: "ingest-ssa-1099",
  description:
    "Ingest one Form SSA-1099. Not for Form RRB-1099 (railroad retirement), which is not supported. Call ONCE per form. Writes one fact under category 'retirement'. If the filing status is married filing separately, also ask whether the user lived apart from their spouse for all of 2025.",
  inputSchema: z.object({
    year: z.number().int(),
    box3: z.number().optional().describe("Benefits paid in the year"),
    box4: z.number().optional().describe("Benefits repaid to SSA in the year"),
    box5: z.number().describe("Net benefits (box 3 minus box 4)"),
    box6: z.number().optional().describe("Voluntary federal income tax withheld"),
    sourceNote: z.string().default("Form SSA-1099 ingested via structured payload"),
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
    const value: SocialSecurityFactValue = {
      payerName: "Social Security Administration",
      box3: input.box3,
      box4: input.box4,
      box5: input.box5,
      box6: input.box6,
    };
    const factKey = makeSocialSecurityFactKey("ssa");
    await recordIngestFact(ctx, "retirement", factKey, value);
    return { factKey };
  },
});
