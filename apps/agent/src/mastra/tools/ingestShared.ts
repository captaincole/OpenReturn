import { z } from "zod";
import type { Scope } from "../db/appDb";
import { recordFact } from "../db/taxFacts";
import { requireUserContext } from "./userContext";

/*
 * Shared pieces for the structured document-ingest tools (the 1099
 * forms, 1099-R, 1099-SA). Each tool maps one document to typed fact rows.
 */

/** Shared write context for the per-section ingest helpers. */
export interface IngestCtx {
  scope: Scope;
  userId: string;
  filingId: string;
  year: number;
  sourceNote: string | undefined;
}

/** Write one fact row with the document's citation. */
export async function recordIngestFact(
  ctx: IngestCtx,
  category: string,
  key: string,
  value: unknown,
): Promise<void> {
  await recordFact(ctx.scope, {
    id: crypto.randomUUID(),
    userId: ctx.userId,
    filingId: ctx.filingId,
    taxYear: ctx.year,
    category,
    key,
    value,
    sourceNote: ctx.sourceNote,
  });
}

export const AddressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
});

export const PayerSchema = z.object({
  name: z.string(),
  tin: z.string().describe("Payer's TIN printed on the form"),
  phone: z.string().optional(),
  address: AddressSchema.optional(),
});

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/*
 * The fields every 1099 call repeats. A consolidated statement is several
 * forms in one PDF, ingested with one call per form; the same payer and
 * accountSlug put all of them under one account.
 */
export const statementFields = {
  year: z.number().int(),
  accountSlug: z
    .string()
    .optional()
    .describe(
      "Stable slug for this account in fact keys. Defaults to slugified payer name. Use a single short token like 'apex-individual' or 'fidelity-brokerage'. Pass the same slug in every call for one statement.",
    ),
  payer: PayerSchema,
  accountNumber: z.string(),
  sourceNote: z.string().optional(),
};

interface StatementInput {
  year: number;
  accountSlug?: string;
  payer: { name: string; tin: string };
  sourceNote?: string;
}

/* The write context and account slug for one 1099 call. */
export async function statementContext(
  input: StatementInput,
  toolContext: Parameters<typeof requireUserContext>[0],
  form: string,
): Promise<{ ctx: IngestCtx; slug: string }> {
  const { scope, userId, filingId } = await requireUserContext(toolContext);
  const slug =
    input.accountSlug || slugify(input.payer.name) || `tin-${input.payer.tin.replace(/-/g, "")}`;
  const sourceNote = input.sourceNote ?? `${form} ingested via structured payload`;
  return { ctx: { scope, userId, filingId, year: input.year, sourceNote }, slug };
}
