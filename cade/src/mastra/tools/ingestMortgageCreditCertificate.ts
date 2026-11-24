import { createTool } from "@mastra/core/tools";
import {
  MORTGAGE_CREDIT_KEYS,
  type MortgageCreditCertificateFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

/* What the certificate prints. */
const printedCertificate = z.object({
  issuerName: z.string().describe("The issuing state or local housing agency, as printed"),
  certificateNumber: z.string().optional().describe("Certificate number, as printed"),
  issueDate: z.string().optional().describe("Date of issue, MM/DD/YYYY"),
  creditRatePercent: z
    .number()
    .describe("Certificate credit rate in percent: 20 for 20%. Not the loan's interest rate."),
  certifiedIndebtedness: z.number().describe("Certified indebtedness amount"),
  homeAddress: z
    .string()
    .optional()
    .describe("The residence's address. Only when it differs from the address on the return."),
});

export const mortgageCreditCertificateInput = z.object({
  year: z.number().int(),
  certificate: printedCertificate,
  /* Not on the certificate: another document's value and the user's answers. */
  interestPaid: z
    .number()
    .describe(
      "NOT on the certificate: Form 1098 box 1 for this loan (not box 6). With a co-owner other than a joint-return spouse, only the user's share.",
    ),
  originalLoanAmount: z
    .number()
    .describe(
      "NOT on the certificate: the original amount of the loan, from the user (loan papers).",
    ),
  ownershipShare: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe(
      "The user's share (0 to 1) of the home when someone other than a joint-return spouse also owns it. Leave it out otherwise.",
    ),
  reissued: z
    .object({
      creditUnderOriginalCertificate: z
        .number()
        .describe("The credit the original certificate would allow this year, as stated"),
      ratesDifferThisYear: z.boolean().optional(),
    })
    .optional()
    .describe("Only when the loan was refinanced and the certificate reissued."),
  sourceNote: z.string().default("Mortgage Credit Certificate ingested via structured payload"),
});

export type MortgageCreditCertificateInput = z.input<typeof mortgageCreditCertificateInput>;

/* Drops the fields that hold nothing, so an absent answer is absent from the fact. */
const withoutBlanks = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T;

/* The one fact a certificate produces: its printed values with the loan's interest and amount. */
export function mortgageCreditCertificateFact(input: MortgageCreditCertificateInput): {
  key: string;
  value: MortgageCreditCertificateFactValue;
} {
  const value = withoutBlanks<MortgageCreditCertificateFactValue>({
    ...input.certificate,
    originalLoanAmount: input.originalLoanAmount,
    interestPaid: input.interestPaid,
    ownershipShare: input.ownershipShare,
    reissued: input.reissued && withoutBlanks(input.reissued),
  });
  return { key: MORTGAGE_CREDIT_KEYS.certificate, value };
}

export const ingestMortgageCreditCertificate = createTool({
  id: "ingest-mortgage-credit-certificate",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Mortgage Credit Certificate (MCC) from a state or local housing agency (Form 8396). Call ONCE; a second certificate is not supported (say so). Writes one fact under category 'mortgage'. Copy the certificate's values as printed. Two amounts are not on it and must come first: the interest paid (Form 1098 box 1) and the loan's original amount (ask). Never fill either from a guess.",
  inputSchema: mortgageCreditCertificateInput,
  outputSchema: z.object({ factKey: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const ctx: IngestCtx = {
      scope,
      userId,
      filingId,
      year: input.year,
      sourceNote: `${input.sourceNote} (Mortgage Credit Certificate from ${input.certificate.issuerName})`,
    };
    const { key, value } = mortgageCreditCertificateFact(input);
    await recordIngestFact(ctx, "mortgage", key, value);
    return { factKey: key };
  },
});
