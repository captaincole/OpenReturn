import { createTool } from "@mastra/core/tools";
import {
  makeGamblingWinningsFactKey,
  type GamblingWinningsFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { PayerSchema, recordIngestFact, slugify } from "./ingestShared";
import { requireUserContext } from "./userContext";

export const ingestW2G = createTool({
  id: "ingest-w2g",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form W-2G (certain gambling winnings). Call ONCE per form. Pass only the boxes that have values. Writes one fact under category 'other'. To correct a form, call again with the winId this call returned.",
  inputSchema: z.object({
    year: z.number().int(),
    payer: PayerSchema,
    winId: z
      .string()
      .optional()
      .describe(
        "Stable id for this form. Defaults to '{box2 date}-{box1 cents}'. Pass the returned winId when you correct the form.",
      ),
    box1: z.number().describe("Reportable winnings"),
    box2: z.string().optional().describe("Date won, as printed"),
    box3: z.string().optional().describe("Type of wager"),
    box4: z.number().optional().describe("Federal income tax withheld"),
    box7: z.number().optional().describe("Winnings from identical wagers"),
    box13: z.string().optional().describe("State / payer's state identification no."),
    box14: z.number().optional().describe("State winnings"),
    box15: z.number().optional().describe("State income tax withheld"),
    sourceNote: z.string().default("Form W-2G ingested via structured payload"),
  }),
  outputSchema: z.object({ factKey: z.string(), winId: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const { year, payer, winId: givenWinId, sourceNote, ...boxes } = input;
    const value: GamblingWinningsFactValue = {
      payerName: payer.name,
      payerTin: payer.tin,
      ...boxes,
    };
    // The payer's TIN, not its name: a name can be spelled two ways on two forms.
    const payerSlug = `tin-${slugify(payer.tin)}`;
    const winId = givenWinId ?? defaultWinId(boxes);
    const factKey = makeGamblingWinningsFactKey(payerSlug, winId);
    await recordIngestFact({ scope, userId, filingId, year, sourceNote }, "other", factKey, value);
    return { factKey, winId };
  },
});

/*
 * The date won (box 2) and the winnings in cents (box 1): two wins from one payer
 * get two keys, and the same form read twice gets the same key.
 */
export function defaultWinId(boxes: { box1: number; box2?: string }): string {
  return slugify(`${boxes.box2 ?? "undated"}-${String(Math.round(boxes.box1 * 100))}`);
}
