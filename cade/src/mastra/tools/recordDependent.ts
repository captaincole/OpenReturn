import { createTool } from "@mastra/core/tools";
import { makeDependentFactKey, type DependentFactValue } from "@openreturn/engine/facts";
import { z } from "zod";
import type { Scope } from "../db/appDb";
import { listFactsByKeys } from "../db/taxFacts";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, slugify } from "./ingestShared";
import { requireUserContext } from "./userContext";

export const recordDependent = createTool({
  id: "record-dependent",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Record one dependent the user claims (the 1040 Dependents table and Schedule 8812) from the user's answers. Call once per dependent; to correct one, call again with every field and the dependentId the first call returned. Do not decide the credit: the engine checks the child tax credit or the credit for other dependents from the date of birth, relationship, months in the home and SSN.",
  inputSchema: z.object({
    year: z.number().int(),
    dependentId: z
      .string()
      .optional()
      .describe(
        "The dependentId an earlier call returned for this person. Pass it to correct the person; leave it out for a new dependent.",
      ),
    firstName: z.string(),
    lastName: z.string(),
    ssn: z
      .string()
      .optional()
      .describe("Social security number, ###-##-####. Leave it out when the person has none."),
    tin: z
      .string()
      .optional()
      .describe(
        "An ITIN or ATIN when there is no SSN (enough for the credit for other dependents)",
      ),
    relationship: z
      .string()
      .describe("As the 1040 prints it: Son, Daughter, Stepchild, Foster child, Niece, Parent, …"),
    dob: z.string().optional().describe("Date of birth, MM/DD/YYYY"),
    monthsLivedWithYou: z
      .number()
      .int()
      .min(0)
      .max(12)
      .optional()
      .describe("Months the person lived with the user in 2025"),
    placedWithYou: z
      .string()
      .optional()
      .describe(
        "MM/DD/YYYY: the date in 2025 the child was adopted, placed for adoption or placed as a foster child, when that happened during the year",
      ),
    livedInUs: z.boolean().optional().describe("Lived with the user in the United States"),
    usCitizenOrResident: z
      .boolean()
      .optional()
      .describe("A U.S. citizen, U.S. national or U.S. resident alien"),
    fullTimeStudent: z.boolean().optional(),
    permanentlyDisabled: z.boolean().optional(),
    grossIncome: z
      .number()
      .min(0)
      .optional()
      .describe("The person's own gross income for 2025 (FTB 3532 line 4); 0 for none"),
    daysLivedWithYou: z
      .number()
      .int()
      .min(0)
      .max(366)
      .optional()
      .describe(
        "Days the person lived with the user in 2025 (FTB 3532 line 5). A user who was married or an RDP during the year counts half the days the spouse also lived there",
      ),
    form8332Release: z
      .boolean()
      .optional()
      .describe(
        "For a child who lived with the user half the year or less: the other parent released the claim on Form 8332",
      ),
    sourceNote: z.string().default("Dependent answers stated by the user"),
  }),
  outputSchema: z.object({ factKey: z.string(), dependentId: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const { year, sourceNote, dependentId: givenId, ...value } = input;
    const dependentId =
      givenId ??
      (await unusedDependentId(scope, year, slugify(`${input.firstName} ${input.lastName}`)));
    const factKey = makeDependentFactKey(dependentId);
    await recordIngestFact(
      { scope, userId, filingId, year, sourceNote },
      "dependents",
      factKey,
      value satisfies DependentFactValue,
    );
    return { factKey, dependentId };
  },
});

const MAX_SAME_NAME = 20;

/* The ids a new dependent can take, in order: the name's slug, then the slug plus a number. */
export function dependentIdCandidates(base: string): string[] {
  return Array.from({ length: MAX_SAME_NAME }, (_, index) =>
    index === 0 ? base : `${base}-${index + 1}`,
  );
}

async function unusedDependentId(scope: Scope, year: number, base: string): Promise<string> {
  const candidates = dependentIdCandidates(base || "dependent");
  const taken = new Set(
    (await listFactsByKeys(scope, year, candidates.map(makeDependentFactKey))).map(
      (row) => row.key,
    ),
  );
  return candidates.find((id) => !taken.has(makeDependentFactKey(id))) ?? crypto.randomUUID();
}
