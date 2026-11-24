import { createTool } from "@mastra/core/tools";
import { makeNoncashGiftFactKey, type NoncashGiftFactValue } from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { keyDateOf } from "./ingest3921";
import { recordIngestFact, slugify } from "./ingestShared";
import { requireUserContext } from "./userContext";

/*
 * Form 1098-C prints the donee, the vehicle, the sale and the exception boxes.
 * The noncash gift fact also requires two values no 1098-C prints: the fair
 * market value and how it was found (Form 8283 columns (h) and (i)). They are
 * the taxpayer's answers, so the tool takes them apart from the boxes and
 * records nothing until both are given. It never fills them in.
 */
const doneeSchema = z.object({
  name: z.string().describe("The DONEE'S name: the charity"),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
});

const formSchema = z.object({
  donee: doneeSchema,
  box1: z.string().describe("Date of contribution, MM/DD/YYYY"),
  box2a: z.string().optional().describe("Odometer mileage as printed (motor vehicles only)"),
  box2b: z.string().describe("Year"),
  box2c: z.string().describe("Make"),
  box2d: z.string().describe("Model"),
  box3: z.string().optional().describe("Vehicle or other identification number"),
  box4c: z.number().optional().describe("Gross proceeds from sale. Leave out when blank."),
  box5a: z.boolean().describe("Box 5a checked: material improvements or significant use"),
  box5b: z.boolean().describe("Box 5b checked: transferred to a needy individual"),
  box6a: z.boolean().describe("Box 6a: true when the donee checked Yes (goods or services)"),
  box6c: z.boolean().optional().describe("Box 6c checked: intangible religious benefits only"),
});

const answersSchema = z.object({
  fairMarketValue: z
    .number()
    .optional()
    .describe("The taxpayer's stated value on the date of the gift. Never estimate it."),
  valuationMethod: z
    .string()
    .optional()
    .describe("How the taxpayer found the value: Appraisal, Catalog, Comparable sales"),
  condition: z.string().optional().describe("The vehicle's condition, in the taxpayer's words"),
  dateAcquired: z.string().optional().describe("When the taxpayer got the vehicle, MM/DD/YYYY"),
  howAcquired: z.string().optional().describe("Purchase, gift, inheritance or exchange"),
  costBasis: z.number().optional().describe("What the taxpayer paid, or other basis"),
});

export type Form1098CInput = z.infer<typeof formSchema>;
export type Form1098CAnswers = z.infer<typeof answersSchema>;

export type VehicleGiftResult =
  | { kind: "gift"; giftSlug: string; gift: NoncashGiftFactValue }
  | { kind: "missing"; missingAnswers: string[] }
  | { kind: "unsupported"; reason: string };

/* Column (c): the year, make, model and mileage the form prints, then the taxpayer's condition. */
export function vehicleDescription(form: Form1098CInput, condition: string | undefined): string {
  const vehicle = [form.box2b, form.box2c, form.box2d].filter((part) => part.trim()).join(" ");
  const mileage = form.box2a?.trim() ? `${form.box2a.trim()} miles` : undefined;
  return [vehicle, mileage, condition?.trim() || undefined]
    .filter((part): part is string => part !== undefined)
    .join(", ");
}

const GOODS_OR_SERVICES =
  "The donee gave goods or services for the vehicle (box 6a). They reduce the deduction, " +
  "and the return has no place for them yet: a CPA must figure this gift.";

/* The noncash gift fact the form and the answers make, or what is still needed. */
export function vehicleGiftFrom(
  form: Form1098CInput,
  answers: Form1098CAnswers,
): VehicleGiftResult {
  if (form.box6a && form.box6c !== true) return { kind: "unsupported", reason: GOODS_OR_SERVICES };
  const { fairMarketValue, valuationMethod } = answers;
  if (fairMarketValue === undefined || !valuationMethod?.trim()) {
    const missingAnswers = [
      fairMarketValue === undefined ? "fairMarketValue" : undefined,
      valuationMethod?.trim() ? undefined : "valuationMethod",
    ].filter((name): name is string => name !== undefined);
    return { kind: "missing", missingAnswers };
  }
  const gift: NoncashGiftFactValue = {
    donee: form.donee,
    propertyType: "vehicle",
    description: vehicleDescription(form, answers.condition),
    contributionDate: form.box1,
    dateAcquired: answers.dateAcquired,
    howAcquired: answers.howAcquired,
    costBasis: answers.costBasis,
    fairMarketValue,
    valuationMethod: valuationMethod.trim(),
    vehicle: {
      vin: form.box3,
      /* The form read is the acknowledgment; the return attaches its Copy B (Copy B's notice). */
      acknowledgmentAttached: true,
      grossProceeds: form.box4c,
      fmvException: form.box5a || form.box5b,
    },
  };
  const giftSlug = `${slugify(form.donee.name) || "donee"}-vehicle-${keyDateOf(form.box1)}`;
  return { kind: "gift", giftSlug, gift };
}

export const ingest1098C = createTool({
  id: "ingest-1098-c",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 1098-C (Contributions of Motor Vehicles, Boats, and Airplanes). Call ONCE per form, after you have the taxpayer's answers. Copy the boxes as printed in `form`. Put only what the taxpayer stated in `answers`: the form does not print the fair market value or how it was found, and nothing is recorded without both. Writes one noncash gift fact under category 'charitable'.",
  inputSchema: z.object({
    year: z.number().int(),
    form: formSchema,
    answers: answersSchema.default({}),
    sourceNote: z.string().default("Form 1098-C ingested via structured payload"),
  }),
  outputSchema: z.object({
    recorded: z.boolean(),
    factKey: z.string().optional(),
    missingAnswers: z.array(z.string()).optional(),
    unsupported: z.string().optional(),
  }),
  execute: async (input, context) => {
    const result = vehicleGiftFrom(input.form, input.answers);
    if (result.kind === "missing")
      return { recorded: false, missingAnswers: result.missingAnswers };
    if (result.kind === "unsupported") return { recorded: false, unsupported: result.reason };
    const { scope, userId, filingId } = await requireUserContext(context);
    const ctx = { scope, userId, filingId, year: input.year, sourceNote: input.sourceNote };
    const factKey = makeNoncashGiftFactKey(result.giftSlug);
    await recordIngestFact(ctx, "charitable", factKey, result.gift);
    return { recorded: true, factKey };
  },
});
