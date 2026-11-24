import { createTool } from "@mastra/core/tools";
import { makeLtcBenefitsFactKey, type LtcBenefitsFactValue } from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, slugify, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

/*
 * One Form 1099-LTC: the boxes as printed. The Form 8853 Section C answers the
 * form does not carry (other payees, the LTC period's days, costs and
 * reimbursements) are questions in the form-1099-ltc skill.
 */

export const form1099LtcInput = z.object({
  year: z.number().int(),
  payer: z.object({
    name: z.string().describe("The PAYER'S name"),
    tin: z.string().optional().describe("The PAYER'S TIN, when printed"),
  }),
  payerSlug: z
    .string()
    .optional()
    .describe("Stable slug for this payer in the fact key. Defaults to the slugified name."),
  formId: z
    .string()
    .optional()
    .describe(
      "Stable id for this form. Defaults to the slugified insured's name; pass another for a second form from one payer for one insured.",
    ),
  owner: z
    .enum(["taxpayer", "spouse"])
    .optional()
    .describe("Whose form it is, from the POLICYHOLDER'S name. Omit for the taxpayer."),
  insuredName: z.string().describe("The INSURED'S name"),
  insuredSsn: z.string().describe("The INSURED'S TIN"),
  box1: z.number().describe("Gross long-term care benefits paid"),
  box2: z.number().optional().describe("Accelerated death benefits paid"),
  box3: z.enum(["per_diem", "reimbursed"]).describe("Box 3: Per diem or Reimbursed amount"),
  box4: z.boolean().optional().describe("Qualified contract: true when checked; omit when blank"),
  box5: z
    .enum(["chronically_ill", "terminally_ill"])
    .optional()
    .describe("The box 5 checkbox, when one is checked"),
  box5DateCertified: z.string().optional().describe("Box 5 date certified, when printed"),
  sourceNote: z.string().default("Form 1099-LTC ingested via structured payload"),
});

export type Form1099LtcInput = z.input<typeof form1099LtcInput>;

const withoutBlanks = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T;

export function form1099LtcFact(input: Form1099LtcInput): {
  key: string;
  value: LtcBenefitsFactValue;
} {
  const payerSlug = input.payerSlug || slugify(input.payer.name) || "payer";
  const formId = input.formId || slugify(input.insuredName) || "insured";
  const value = withoutBlanks<LtcBenefitsFactValue>({
    payerName: input.payer.name,
    payerTin: input.payer.tin,
    owner: input.owner,
    insuredName: input.insuredName,
    insuredSsn: input.insuredSsn,
    box1: input.box1,
    box2: input.box2,
    box3: input.box3,
    box4: input.box4 === true ? true : undefined,
    box5: input.box5,
    box5DateCertified: input.box5DateCertified,
  });
  return { key: makeLtcBenefitsFactKey(payerSlug, formId), value };
}

export const ingest1099Ltc = createTool({
  id: "ingest-1099-ltc",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 1099-LTC (long-term care and accelerated death benefits). Call ONCE per form. Writes one fact under category 'medical'. Copy the boxes as printed. On a joint return, set owner from the POLICYHOLDER'S name.",
  inputSchema: form1099LtcInput,
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
    const { key, value } = form1099LtcFact(input);
    await recordIngestFact(ctx, "medical", key, value);
    return { factKey: key };
  },
});
