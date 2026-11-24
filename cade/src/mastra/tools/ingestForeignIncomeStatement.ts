import { createTool } from "@mastra/core/tools";
import {
  makeDividendFactKey,
  makeForeignIncomeStatementKey,
  makeInterestFactKey,
  type ForeignIncomeStatementValue,
} from "@openreturn/engine/facts";
import { z } from "zod";
import { cadeRequestContextSchema } from "../server/requestContext";
import { recordIngestFact, slugify, type IngestCtx } from "./ingestShared";
import { requireUserContext } from "./userContext";

/* The engine reads the statement from the 1099's category. */
const CATEGORY = "investment_income";

const DOCUMENT_KEY = { "1099-DIV": makeDividendFactKey, "1099-INT": makeInterestFactKey } as const;

type StatementForm = keyof typeof DOCUMENT_KEY;

/* What Cade reads off the statement, and the slug of the 1099 it explains. */
export interface ForeignIncomeStatementInput {
  form: StatementForm;
  payerName: string;
  accountSlug?: string;
  grossIncome: number;
  qualifiedDividends?: number;
  capitalGainDistributions?: number;
  country?: string;
}

/*
 * The statement sits next to its 1099: "account.<slug>.dividends" gives
 * "account.<slug>.dividends.foreign_income". A value the statement does not
 * print stays out of the fact.
 */
export function foreignIncomeStatementFact(input: ForeignIncomeStatementInput): {
  key: string;
  value: ForeignIncomeStatementValue;
} {
  const slug = input.accountSlug || slugify(input.payerName) || "account";
  const printed = Object.entries({
    qualifiedDividends: input.qualifiedDividends,
    capitalGainDistributions: input.capitalGainDistributions,
    country: input.country,
  }).filter(([, value]) => value !== undefined);
  return {
    key: makeForeignIncomeStatementKey(DOCUMENT_KEY[input.form](slug)),
    value: { grossIncome: input.grossIncome, ...Object.fromEntries(printed) },
  };
}

export const ingestForeignIncomeStatement = createTool({
  id: "ingest-foreign-income-statement",
  requestContextSchema: cadeRequestContextSchema,
  description:
    "Ingest a fund's or broker's foreign income statement: the year-end page next to a 1099-DIV (or 1099-INT) that gives the foreign-source part of the income, for Form 1116. Call ONCE per account and form, after the 1099 itself, with the same accountSlug. Writes one fact under category 'investment_income'. Copy the amounts as printed; do not work one out from others. Pass only the values the statement prints.",
  inputSchema: z.object({
    year: z.number().int(),
    form: z
      .enum(["1099-DIV", "1099-INT"])
      .default("1099-DIV")
      .describe("The 1099 the statement explains"),
    payerName: z.string().describe("The fund or broker that sent the statement"),
    accountSlug: z
      .string()
      .optional()
      .describe(
        "The accountSlug the matching ingest-1099-div (or ingest-1099-int) call returned. Defaults to the slugified payer name.",
      ),
    grossIncome: z
      .number()
      .describe(
        "Foreign-source income, in U.S. dollars: the part of 1099-DIV box 1a (or 1099-INT box 1) from foreign sources",
      ),
    qualifiedDividends: z
      .number()
      .optional()
      .describe("The foreign-source part of the qualified dividends (box 1b)"),
    capitalGainDistributions: z
      .number()
      .optional()
      .describe("The foreign-source part of the capital gain distributions (box 2a)"),
    country: z
      .string()
      .optional()
      .describe(
        "The one foreign country the statement or 1099-DIV box 8 names. Leave it out for a mutual fund that lists many countries or none.",
      ),
    sourceNote: z.string().default("Foreign income statement ingested via structured payload"),
  }),
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
    const { key, value } = foreignIncomeStatementFact(input);
    await recordIngestFact(ctx, CATEGORY, key, value);
    return { factKey: key };
  },
});
