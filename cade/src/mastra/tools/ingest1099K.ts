import { createTool } from "@mastra/core/tools";
import {
  makePaymentTransactionsFactKey,
  type PaymentTransactionsFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { PayerSchema, recordIngestFact, slugify } from "./ingestShared";
import { requireUserContext } from "./userContext";

export const ingest1099K = createTool({
  id: "ingest-1099-k",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 1099-K (payment card and third party network transactions). Call ONCE per form. Pass only the boxes that have values; leave out the monthly boxes 5a-5l. Writes one fact under category 'self_employment'. To correct a form, call again with the formId this call returned.",
  inputSchema: z.object({
    year: z.number().int(),
    payer: PayerSchema.describe("The FILER block of the form"),
    businessId: z
      .string()
      .optional()
      .describe(
        "The businessId record-business returned for the business these payments were for. Leave it out until the user says which business it is.",
      ),
    formId: z
      .string()
      .optional()
      .describe(
        "Stable id for this form. Defaults to the account number, or to the box 1a cents. Pass the returned formId when you correct the form.",
      ),
    filerType: z
      .enum(["payment_settlement_entity", "electronic_payment_facilitator"])
      .optional()
      .describe("The checked box: PSE, or EPF/Other third party"),
    transactionType: z
      .enum(["payment_card", "third_party_network"])
      .optional()
      .describe("The checked box: payment card, or third party network"),
    accountNumber: z.string().optional(),
    box1a: z.number().describe("Gross amount of payment card/third party network transactions"),
    box1b: z.number().optional().describe("Card not present transactions"),
    box2: z.string().optional().describe("Merchant category code"),
    box3: z.number().int().optional().describe("Number of payment transactions"),
    box4: z.number().optional().describe("Federal income tax withheld"),
    box6: z.string().optional().describe("State"),
    box7: z.string().optional().describe("State identification no."),
    box8: z.number().optional().describe("State income tax withheld"),
    sourceNote: z.string().default("Form 1099-K ingested via structured payload"),
  }),
  outputSchema: z.object({ factKey: z.string(), formId: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const { year, payer, formId: givenFormId, sourceNote, ...fields } = input;
    const value: PaymentTransactionsFactValue = {
      filerName: payer.name,
      filerTin: payer.tin,
      ...fields,
    };
    // The filer's TIN, not its name: a name can be spelled two ways on two forms.
    const payerSlug = `tin-${slugify(payer.tin)}`;
    const formId = givenFormId ?? default1099KFormId(fields);
    const factKey = makePaymentTransactionsFactKey(payerSlug, formId);
    await recordIngestFact(
      { scope, userId, filingId, year, sourceNote },
      "self_employment",
      factKey,
      value,
    );
    return { factKey, formId };
  },
});

/*
 * The account number, when the form has one: a filer sends one 1099-K per
 * account. Without it, the gross amount (box 1a) in cents. The same form read
 * twice gets the same id.
 */
export function default1099KFormId(fields: { accountNumber?: string; box1a: number }): string {
  return fields.accountNumber
    ? slugify(fields.accountNumber)
    : `gross-${String(Math.round(fields.box1a * 100))}`;
}
