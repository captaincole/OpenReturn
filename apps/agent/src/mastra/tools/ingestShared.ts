import { z } from "zod";
import type { Scope } from "../db/appDb";
import { recordFact } from "../db/taxFacts";

/*
 * Shared pieces for the structured document-ingest tools (consolidated
 * 1099, 1099-R, 1099-SA). Each tool maps one document to typed fact rows.
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
