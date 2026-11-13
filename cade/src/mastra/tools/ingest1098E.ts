import { createTool } from "@mastra/core/tools";
import {
  makeStudentLoanInterestFactKey,
  type StudentLoanInterestFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, slugify, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

/*
 * One fact per form: the lender's name, then the borrower on a joint return, so
 * each spouse's 1098-E from one servicer is its own fact. A name with no letters
 * or digits falls back to "lender", so the key stays one the engine reads.
 */
export const studentLoanSlug = (lenderName: string, owner: "taxpayer" | "spouse"): string => {
  const lender = slugify(lenderName) || "lender";
  return owner === "spouse" ? `${lender}-spouse` : lender;
};

export const ingest1098E = createTool({
  id: "ingest-1098-e",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 1098-E (Student Loan Interest Statement) from a lender. Call ONCE per form. Writes one fact under category 'education' per form (on a joint return, set owner from the borrower's name): box 1 (student loan interest, Schedule 1 line 21) and the box 2 checkbox. Record it only for a qualified student loan: a loan for the education of the user, their spouse, or a person who was their dependent. Then ask whether anyone claims the user (or the spouse, on a joint return) as a dependent on their 2025 return, and record the answer as student_loan.claimed_as_dependent, category 'education', a boolean.",
  inputSchema: z.object({
    year: z.number().int(),
    lenderName: z.string().describe("Recipient/lender's name as printed"),
    owner: z
      .enum(["taxpayer", "spouse"])
      .default("taxpayer")
      .describe("Whose loan: the borrower named on the form"),
    box1: z.number().describe("Student loan interest received by lender"),
    box2: z
      .boolean()
      .optional()
      .describe(
        "Checked: box 1 does not include loan origination fees and/or capitalized interest for loans made before September 1, 2004",
      ),
    sourceNote: z.string().default("Form 1098-E ingested via structured payload"),
  }),
  outputSchema: z.object({ factKey: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const ctx: IngestCtx = {
      scope,
      userId,
      filingId,
      year: input.year,
      sourceNote: `${input.sourceNote} (Form 1098-E from ${input.lenderName})`,
    };
    const value: StudentLoanInterestFactValue = {
      lenderName: input.lenderName,
      box1: input.box1,
      box2: input.box2,
    };
    const factKey = makeStudentLoanInterestFactKey(studentLoanSlug(input.lenderName, input.owner));
    await recordIngestFact(ctx, "education", factKey, value);
    return { factKey };
  },
});
