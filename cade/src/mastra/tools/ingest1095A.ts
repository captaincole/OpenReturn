import { createTool } from "@mastra/core/tools";
import {
  makeMarketplaceCoverageFactKey,
  type MarketplaceCoverageFactValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, slugify } from "./ingestShared";
import { requireUserContext } from "./userContext";

const PersonSchema = z.object({
  name: z.string(),
  ssn: z.string().optional(),
  dob: z.string().optional().describe("MM/DD/YYYY; the form prints it only when it has no SSN"),
});

const AmountsSchema = z.object({
  enrollmentPremium: z.number().optional().describe("Column A, monthly enrollment premiums"),
  slcspPremium: z.number().optional().describe("Column B, second lowest cost silver plan premium"),
  advancePayment: z.number().optional().describe("Column C, advance payment of premium tax credit"),
});

export const ingest1095A = createTool({
  id: "ingest-1095-a",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest one Form 1095-A (Health Insurance Marketplace Statement). Call ONCE per form (one per policy). Pass all 12 rows of Part III, January first, with an empty object for a month the form leaves blank, and line 33. Writes one fact under category 'health_coverage'.",
  inputSchema: z.object({
    year: z.number().int(),
    marketplaceId: z.string().describe("Line 1, Marketplace identifier"),
    policyNumber: z.string().describe("Line 2, Marketplace-assigned policy number"),
    issuerName: z.string().optional().describe("Line 3, policy issuer's name"),
    recipient: PersonSchema.describe("Lines 4–6"),
    recipientSpouse: PersonSchema.optional().describe("Lines 7–9; leave out when blank"),
    policyStartDate: z.string().optional().describe("Line 10, MM/DD/YYYY"),
    policyEndDate: z.string().optional().describe("Line 11, MM/DD/YYYY"),
    address: z
      .object({ street: z.string(), city: z.string(), state: z.string(), zip: z.string() })
      .optional()
      .describe("Lines 12–15"),
    coveredIndividuals: z
      .array(
        PersonSchema.extend({
          startDate: z.string().optional().describe("Column D"),
          endDate: z.string().optional().describe("Column E"),
        }),
      )
      .describe("Part II, lines 16–20, one per covered person"),
    months: z.array(AmountsSchema).describe("Part III, lines 21–32: 12 rows, January first"),
    annualTotals: AmountsSchema.describe("Line 33, annual totals"),
    sourceNote: z.string().default("Form 1095-A ingested via structured payload"),
  }),
  outputSchema: z.object({ factKey: z.string() }),
  execute: async (input, context) => {
    const { scope, userId, filingId } = await requireUserContext(context);
    const { year, sourceNote, ...value } = input;
    if (value.months.length !== 12) {
      throw new Error(`Part III has 12 months; got ${value.months.length} rows.`);
    }
    const factKey = makeMarketplaceCoverageFactKey(
      slugify(value.marketplaceId),
      slugify(value.policyNumber),
    );
    await recordIngestFact(
      { scope, userId, filingId, year, sourceNote },
      "health_coverage",
      factKey,
      value satisfies MarketplaceCoverageFactValue,
    );
    return { factKey };
  },
});
