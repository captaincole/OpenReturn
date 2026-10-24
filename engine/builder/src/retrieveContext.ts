/*
 * Per-field IRS-instruction retrieval. Phase D feeds the binding
 * classifier the most relevant 2-3 blocks from the IRS reference corpus
 * for each form field. Claude then grounds rule + params choices in the
 * regulatory text instead of guessing from the field label alone.
 *
 * Uses Canon's searchRefDocs over MCP (hybrid retrieval: FTS leg + local
 * embedding vector leg, merged by reciprocal rank fusion), so Canon must
 * be running (npm run dev:canon). Fields run in parallel under a
 * concurrency cap.
 */

import type { FieldInventory } from "@openreturn/engine/catalog";
import { searchCanon } from "./canonSearch";

/*
 * Minimal block shape. The classifier only needs the citation (for the
 * rationale's "ref:" tags) and the text body. The small shape lets the
 * workflow's Zod carrier schema match it exactly.
 */
export interface RetrievedBlock {
  blockId: string;
  docId: string;
  text: string;
  score?: number;
}

export interface RetrievedFieldContext {
  fieldId: string;
  blocks: RetrievedBlock[];
}

export interface RetrieveOpts {
  fields: FieldInventory[];
  formTitle: string;
  /** Top-K blocks retained per field after merging. */
  topK?: number;
  /** How many fields to retrieve for in parallel. */
  concurrency?: number;
}

export async function retrieveContextPerField(
  opts: RetrieveOpts,
  onProgress?: (done: number, total: number) => void,
): Promise<RetrievedFieldContext[]> {
  const topK = opts.topK ?? 3;
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 10, 25));

  const out: RetrievedFieldContext[] = new Array(opts.fields.length);
  let cursor = 0;
  let done = 0;

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= opts.fields.length) return;
      const field = opts.fields[i];
      const query = buildFieldQuery(field, opts.formTitle);
      const hits = await searchCanon({ query, limit: topK });
      out[i] = {
        fieldId: field.fieldId,
        blocks: hits.map((h) => ({
          blockId: h.blockId,
          docId: h.docId,
          text: h.text,
          score: h.score,
        })),
      };
      done += 1;
      onProgress?.(done, opts.fields.length);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, opts.fields.length) }, () => worker()),
  );
  return out;
}

/*
 * The retrieval query combines the form title and the field's label so
 * the embedding lands in the right neighborhood. The line number parsed
 * from the fieldId is included because IRS instructions reference specific
 * lines ("Line 1a", "Line 11"), which helps FTS find the right section.
 */
function buildFieldQuery(field: FieldInventory, formTitle: string): string {
  const linePart = parseLineNumber(field.fieldId);
  const linePhrase = linePart ? `Line ${linePart}` : "";
  return [formTitle, linePhrase, field.label].filter(Boolean).join(" — ");
}

function parseLineNumber(fieldId: string): string | null {
  const match = fieldId.match(/\.line\.([^.]+)$/);
  return match ? match[1] : null;
}
