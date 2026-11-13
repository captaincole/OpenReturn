import { createTool } from "@mastra/core/tools";
import {
  makeGovernmentPaymentsFactKey,
  type GovernmentPaymentsFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { PayerSchema, recordIngestFact, slugify } from "./ingestShared";
import { requireUserContext } from "./userContext";

export const ingest1099G = createTool({
  id: "ingest-1099-g",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 1099-G (certain government payments, such as unemployment compensation). Call ONCE per form. Pass only the boxes that have values. Writes one fact under category 'other'. To correct a form, call again with the formId this call returned.",
  inputSchema: z.object({
    year: z.number().int(),
    payer: PayerSchema.describe("The PAYER block of the form"),
    formId: z
      .string()
      .optional()
      .describe(
        "Stable id for this form. Defaults to the account number, or to the box 1 cents. Pass the returned formId when you correct the form.",
      ),
    accountNumber: z.string().optional(),
    box1: z.number().optional().describe("Unemployment compensation"),
    box2: z.number().optional().describe("State or local income tax refunds, credits, or offsets"),
    box3: z.string().optional().describe("Box 2 amount is for tax year"),
    box4: z.number().optional().describe("Federal income tax withheld"),
    box5: z.number().optional().describe("RTAA payments"),
    box6: z.number().optional().describe("Taxable grants"),
    box7: z.number().optional().describe("Agriculture payments"),
    box8: z.boolean().optional().describe("Box 2 is trade or business income (checkbox)"),
    box9: z.number().optional().describe("Market gain"),
    box10a: z.string().optional().describe("State"),
    box10b: z.string().optional().describe("State identification no."),
    box11: z.number().optional().describe("State income tax withheld"),
    sourceNote: z.string().default("Form 1099-G ingested via structured payload"),
  }),
  outputSchema: z.object({ factKey: z.string(), formId: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const { year, payer, formId: givenFormId, sourceNote, ...fields } = input;
    const value: GovernmentPaymentsFactValue = {
      payerName: payer.name,
      payerTin: payer.tin,
      ...fields,
    };
    // The payer's TIN, not its name: a name can be spelled two ways on two forms.
    const payerSlug = `tin-${slugify(payer.tin)}`;
    const formId = givenFormId ?? default1099GFormId(fields);
    const factKey = makeGovernmentPaymentsFactKey(payerSlug, formId);
    await recordIngestFact({ scope, userId, filingId, year, sourceNote }, "other", factKey, value);
    return { factKey, formId };
  },
});

/*
 * The account number, when the form has one. Without it, the box 1 amount in
 * cents. The same form read twice gets the same id.
 */
export function default1099GFormId(fields: { accountNumber?: string; box1?: number }): string {
  return fields.accountNumber
    ? slugify(fields.accountNumber)
    : `unemployment-${String(Math.round((fields.box1 ?? 0) * 100))}`;
}
