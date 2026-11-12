import { createTool } from "@mastra/core/tools";
import {
  makeNonemployeeCompensationFactKey,
  type NonemployeeCompensationFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { PayerSchema, recordIngestFact, slugify } from "./ingestShared";
import { requireUserContext } from "./userContext";

export const ingest1099Nec = createTool({
  id: "ingest-1099-nec",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 1099-NEC (nonemployee compensation). Call ONCE per form. Pass only the boxes that have values. Writes one fact under category 'self_employment'. To correct a form, call again with the formId this call returned.",
  inputSchema: z.object({
    year: z.number().int(),
    payer: PayerSchema.describe("The PAYER block of the form"),
    businessId: z
      .string()
      .optional()
      .describe(
        "The businessId record-business returned for the business this pay was for. Leave it out until the user says which business it is.",
      ),
    formId: z
      .string()
      .optional()
      .describe(
        "Stable id for this form. Defaults to the account number, or to the box 1 cents. Pass the returned formId when you correct the form.",
      ),
    accountNumber: z.string().optional(),
    box1: z.number().optional().describe("Nonemployee compensation"),
    box2: z
      .boolean()
      .optional()
      .describe("Payer made direct sales totaling $5,000 or more (checkbox)"),
    box3: z.number().optional().describe("Excess golden parachute payments"),
    box4: z.number().optional().describe("Federal income tax withheld"),
    box5: z.number().optional().describe("State tax withheld"),
    box6: z.string().optional().describe("State/Payer's state no."),
    box7: z.number().optional().describe("State income"),
    sourceNote: z.string().default("Form 1099-NEC ingested via structured payload"),
  }),
  outputSchema: z.object({ factKey: z.string(), formId: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const { year, payer, formId: givenFormId, sourceNote, ...fields } = input;
    const value: NonemployeeCompensationFactValue = {
      payerName: payer.name,
      payerTin: payer.tin,
      ...fields,
    };
    // The payer's TIN, not its name: a name can be spelled two ways on two forms.
    const payerSlug = `tin-${slugify(payer.tin)}`;
    const formId = givenFormId ?? default1099NecFormId(fields);
    const factKey = makeNonemployeeCompensationFactKey(payerSlug, formId);
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
 * The account number, when the form has one: a payer can send one 1099-NEC per
 * account. Without it, the box 1 amount in cents. The same form read twice gets
 * the same id.
 */
export function default1099NecFormId(fields: { accountNumber?: string; box1?: number }): string {
  return fields.accountNumber
    ? slugify(fields.accountNumber)
    : `nec-${String(Math.round((fields.box1 ?? 0) * 100))}`;
}
