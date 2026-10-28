import type { FieldInventory } from "@openreturn/engine/catalog";
import { searchCanon } from "./canonSearch";

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
  topK?: number;
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

/* "Line 1a" in the query helps FTS: the instructions name their lines that way. */
function buildFieldQuery(field: FieldInventory, formTitle: string): string {
  const linePart = parseLineNumber(field.fieldId);
  const linePhrase = linePart ? `Line ${linePart}` : "";
  return [formTitle, linePhrase, field.label].filter(Boolean).join(" — ");
}

function parseLineNumber(fieldId: string): string | null {
  const match = fieldId.match(/\.line\.([^.]+)$/);
  return match ? match[1] : null;
}
