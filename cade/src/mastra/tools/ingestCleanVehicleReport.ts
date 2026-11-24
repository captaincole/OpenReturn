import { createTool } from "@mastra/core/tools";
import { makeCleanVehicleFactKey, type CleanVehicleFactValue } from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, slugify, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

/* "02/08/2025" as the fact holds it: "2025-02-08". A date already in that shape is kept. */
export function isoDateOf(printed: string): string {
  const parts = printed.trim().split("/");
  if (parts.length !== 3) return printed.trim();
  const [month, day, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const firstWordOf = (text: string) => text.trim().split(" ")[0] ?? "";

/* "Aurelle" + "Sona S2" → "aurelle-sona". */
export const vehicleSlugOf = (input: { make: string; model: string; vehicleSlug?: string }) =>
  input.vehicleSlug || slugify(`${input.make} ${firstWordOf(input.model)}`) || "vehicle";

const AnswersSchema = z.object({
  acquiredForUse: z
    .boolean()
    .describe(
      "Bought to use (a new vehicle may also be bought to lease to others), not to resell. False for a vehicle the taxpayer leases.",
    ),
  resoldWithin30Days: z
    .boolean()
    .optional()
    .describe("Sold or traded the vehicle within 30 days of taking possession"),
  businessUsePercent: z
    .number()
    .optional()
    .describe("New vehicle: business or investment use, 0 to 100. 0 for personal use only."),
  businessUseMonths: z
    .number()
    .optional()
    .describe("New vehicle: months of business use, only when the use changed during the year"),
  claimedUsedCreditInPrior3Years: z
    .boolean()
    .optional()
    .describe(
      "Previously owned vehicle: claimed a previously owned clean vehicle credit for a vehicle bought in the 3 years before this sale",
    ),
});

export const CleanVehicleReportSchema = z.object({
  year: z.number().int(),
  vehicleSlug: z
    .string()
    .optional()
    .describe(
      "Stable slug for this vehicle in the fact key. Defaults to the make and the model's first word.",
    ),
  kind: z
    .enum(["new", "previously_owned"])
    .describe(
      "From the report's title: new clean vehicle credit (section 30D) or previously owned clean vehicle credit (section 25E)",
    ),
  vin: z.string().describe("Vehicle identification number (VIN), 17 characters"),
  modelYear: z.number().int(),
  make: z.string(),
  model: z.string(),
  dateOfSale: z.string().describe("Date of sale as printed"),
  placedInServiceDate: z.string().describe("Placed in service date as printed"),
  salesPrice: z.number().optional().describe("Sales price, as printed (previously owned vehicle)"),
  maximumCredit: z
    .number()
    .optional()
    .describe("Maximum credit allowable, as printed (new vehicle)"),
  creditTransferred: z
    .number()
    .optional()
    .describe("Amount of credit transferred to the dealer. Leave it out when the report says No."),
  answers: AnswersSchema.describe("The taxpayer's answers; the report does not print them"),
  sourceNote: z.string().default("Clean vehicle seller report ingested via structured payload"),
});

export type CleanVehicleReportInput = z.infer<typeof CleanVehicleReportSchema>;

/* A field the report leaves blank is absent from the fact: no transfer is no `creditTransferredToDealer`. */
const withoutBlanks = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T;

/* The report's values copied into the fact, next to the taxpayer's answers. */
export function cleanVehicleFactOf(input: CleanVehicleReportInput): {
  key: string;
  value: CleanVehicleFactValue;
} {
  const value: CleanVehicleFactValue = {
    modelYear: input.modelYear,
    make: input.make,
    model: input.model,
    vin: input.vin,
    placedInServiceDate: isoDateOf(input.placedInServiceDate),
    acquiredDate: isoDateOf(input.dateOfSale),
    kind: input.kind,
    creditTransferredToDealer: input.creditTransferred,
    tentativeCredit: input.maximumCredit,
    salesPrice: input.salesPrice,
    ...input.answers,
  };
  return { key: makeCleanVehicleFactKey(vehicleSlugOf(input)), value: withoutBlanks(value) };
}

export const ingestCleanVehicleReport = createTool({
  id: "ingest-clean-vehicle-report",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one clean vehicle seller report (the dealer's time-of-sale report for a new or previously owned clean vehicle; Form 8936). Call ONCE per vehicle. Writes one fact under category 'other'. Copy the values as printed; do not work out a credit. Ask the taxpayer's answers before the call: the fact holds them too. Calling again with the same vehicleSlug replaces the vehicle.",
  inputSchema: CleanVehicleReportSchema,
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
    const { key, value } = cleanVehicleFactOf(input);
    await recordIngestFact(ctx, "other", key, value);
    return { factKey: key };
  },
});
