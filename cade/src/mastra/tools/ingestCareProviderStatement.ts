import { createTool } from "@mastra/core/tools";
import {
  makeDependentCareProviderFactKey,
  type DependentCareProviderFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, slugify, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

const ProviderAddressSchema = z.object({
  line1: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
});

const inputSchema = z.object({
  year: z.number().int(),
  providerSlug: z
    .string()
    .optional()
    .describe("Stable slug for this provider in the fact key. Defaults to the slugified name."),
  name: z.string().describe("The provider's name as printed"),
  address: ProviderAddressSchema.describe("The provider's address as printed"),
  tin: z
    .string()
    .optional()
    .describe("The provider's SSN or EIN as printed. Leave it out for a tax-exempt organization."),
  taxExempt: z
    .boolean()
    .optional()
    .describe("True when the statement says the provider is a tax-exempt organization"),
  phone: z.string().optional().describe("The provider's phone number as printed, area code first"),
  amountPaid: z.number().describe("The total paid to the provider in the year, as printed"),
  careAddress: ProviderAddressSchema.optional().describe(
    "Where the care was given, when the statement prints a place other than the provider's address",
  ),
  householdEmployee: z
    .boolean()
    .describe(
      "The taxpayer's answer, not printed: true only when the provider was their household employee (a nanny paid wages to care for the child in their home). A center, a preschool, or a sitter in the sitter's own home is false.",
    ),
  providerType: z
    .enum(["person", "organization"])
    .optional()
    .describe(
      "The taxpayer's answer for FTB 3506 line 1d: an individual is 'person', a business or center is 'organization'. Leave it out when not known.",
    ),
  employerProvided: z
    .boolean()
    .optional()
    .describe(
      "The taxpayer's answer: true when the employer furnished the care under its dependent care plan",
    ),
  sourceNote: z.string().default("Care provider statement ingested via structured payload"),
});

type CareProviderInput = z.infer<typeof inputSchema>;

/* The provider fact a statement records: the key and the value, one per provider. */
export function careProviderFact(input: Omit<CareProviderInput, "year" | "sourceNote">): {
  factKey: string;
  value: DependentCareProviderFactValue;
} {
  const value: DependentCareProviderFactValue = {
    name: input.name,
    address: input.address,
    tin: input.tin,
    taxExempt: input.taxExempt ?? false,
    householdEmployee: input.householdEmployee,
    amountPaid: input.amountPaid,
    phone: input.phone,
    providerType: input.providerType,
    careAddress: input.careAddress,
    employerProvided: input.employerProvided,
  };
  const slug = input.providerSlug || slugify(input.name) || "provider";
  return { factKey: makeDependentCareProviderFactKey(slug), value };
}

export const ingestCareProviderStatement = createTool({
  id: "ingest-care-provider-statement",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one care provider's year-end statement or Form W-10 (Form 2441 line 1, FTB 3506 line 1). Call ONCE per provider. Copy the provider's name, address, TIN, phone and total paid as printed; Form W-10 prints no amount, so take the total paid from the user. Writes one fact under category 'dependents'. householdEmployee is the user's answer, not printed.",
  inputSchema,
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
    const { factKey, value } = careProviderFact(input);
    await recordIngestFact(ctx, "dependents", factKey, value);
    return { factKey };
  },
});
