import { createTool } from "@mastra/core/tools";
import { makeForm1098TFactKey, type Form1098TFactValue } from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { AddressSchema, recordIngestFact, slugify, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

const amountBox = (label: string) =>
  z.number().optional().describe(`${label}. Leave it out when the box is blank.`);

const checkBox = (label: string) =>
  z.boolean().optional().describe(`${label}. True when checked; leave it out when not.`);

export const form1098TInput = z.object({
  year: z.number().int(),
  filer: z.object({
    name: z.string().describe("FILER'S name: the educational institution"),
    address: AddressSchema.describe("FILER'S street address, city, state and ZIP"),
    ein: z.string().describe("FILER'S employer identification no., as printed (00-0000000)"),
  }),
  student: z.object({
    name: z.string().describe("STUDENT'S name, as printed"),
    tin: z.string().optional().describe("STUDENT'S TIN, as printed (often masked)"),
  }),
  institutionSlug: z
    .string()
    .optional()
    .describe("Stable slug for the institution in the fact key. Defaults to the slugified name."),
  studentSlug: z
    .string()
    .optional()
    .describe(
      "The student's slug in the fact key: the first name, lowercased ('perrin'). Use the same slug for that student's education.credit_student fact. Defaults to the first name.",
    ),
  box1: amountBox("Box 1: payments received for qualified tuition and related expenses"),
  box4: amountBox("Box 4: adjustments made for a prior year"),
  box5: amountBox("Box 5: scholarships or grants"),
  box6: amountBox("Box 6: adjustments to scholarships or grants for a prior year"),
  box7: checkBox(
    "Box 7: box 1 includes amounts for an academic period beginning January–March 2026",
  ),
  box8: checkBox("Box 8: at least half-time student"),
  box9: checkBox("Box 9: graduate student"),
  box10: amountBox("Box 10: insurance contract reimbursement or refund"),
  sourceNote: z.string().default("Form 1098-T ingested via structured payload"),
});

export type Form1098TInput = z.input<typeof form1098TInput>;

const firstName = (name: string): string => name.trim().split(" ")[0] ?? "";

const checkedOnly = (box: boolean | undefined): true | undefined =>
  box === true ? true : undefined;

/* Drops the fields that hold nothing, so a blank box is absent from the fact, as on the form. */
const withoutBlanks = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T;

/* The fact one Form 1098-T produces: the boxes as printed, under the institution and the student. */
export function form1098TFact(input: Form1098TInput): { key: string; value: Form1098TFactValue } {
  const institution = input.institutionSlug || slugify(input.filer.name) || "institution";
  const student = input.studentSlug || slugify(firstName(input.student.name)) || "student";
  const value = withoutBlanks<Form1098TFactValue>({
    filerName: input.filer.name,
    filerAddress: withoutBlanks(input.filer.address),
    filerEin: input.filer.ein,
    studentName: input.student.name,
    studentTin: input.student.tin,
    box1: input.box1,
    box4: input.box4,
    box5: input.box5,
    box6: input.box6,
    box7: checkedOnly(input.box7),
    box8: checkedOnly(input.box8),
    box9: checkedOnly(input.box9),
    box10: input.box10,
  });
  return { key: makeForm1098TFactKey(institution, student), value };
}

export const ingest1098T = createTool({
  id: "ingest-1098-t",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 1098-T (Tuition Statement) from an educational institution. Call ONCE per form: each student gets one form from each institution. Writes one fact under category 'education'. Copy the boxes as printed; do not work out what was paid. The credit then needs the student's answers, which the form does not carry (education.credit_student.<studentSlug>).",
  inputSchema: form1098TInput,
  outputSchema: z.object({ factKey: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const ctx: IngestCtx = {
      scope,
      userId,
      filingId,
      year: input.year,
      sourceNote: `${input.sourceNote} (Form 1098-T from ${input.filer.name})`,
    };
    const { key, value } = form1098TFact(input);
    await recordIngestFact(ctx, "education", key, value);
    return { factKey: key };
  },
});
