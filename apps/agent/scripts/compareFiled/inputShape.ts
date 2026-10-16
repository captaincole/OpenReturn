/*
 * The shape of the return's inputs, as counts only. Fact keys carry
 * payer and account names (`account.<name>.interest`), so the report
 * never prints a key: it prints the document type and how many.
 */

import { isDividendFactKey, isInterestFactKey } from "../../src/engine/facts/index.js";
import type { Scenario } from "../../tests/types.js";

export interface InputShape {
  /** Document type → count, e.g. { "W-2": 1, "1099-INT": 2 }. */
  documents: Record<string, number>;
  /** Form 8949 box → number of sales. */
  salesByBox: Record<string, number>;
  /** Scope decisions with a yes/no or short code value, e.g. filing_status → single. */
  scope: Record<string, string>;
  /** Fact category → count, for facts that are not documents (identity left out). */
  otherFacts: Record<string, number>;
}

const bump = (m: Record<string, number>, k: string) => (m[k] = (m[k] ?? 0) + 1);

function documentType(key: string, category: string): string | undefined {
  if (category === "wages" && key.startsWith("employer.")) return "W-2";
  if (isInterestFactKey(key)) return "1099-INT";
  if (isDividendFactKey(key)) return "1099-DIV";
  if (/\.misc$/.test(key)) return "1099-MISC";
  const code = /\.distributions\.code-(\w+)$/.exec(key);
  if (category === "retirement" && code) return `1099-R (code ${code[1].toUpperCase()})`;
  if (/\.hsa_distributions\./.test(key)) return "1099-SA";
  if (/\.trades\.[^.]+$/.test(key)) return "sale";
  return undefined;
}

function shortCode(value: unknown): string | undefined {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "string" && /^[a-z0-9_-]{1,24}$/i.test(value)) return value;
  return undefined;
}

export function inputShape(s: Scenario): InputShape {
  const shape: InputShape = { documents: {}, salesByBox: {}, scope: {}, otherFacts: {} };
  for (const f of s.facts) {
    if (f.key.endsWith(".reported_basis")) continue;
    const doc = documentType(f.key, f.category);
    if (doc) bump(shape.documents, doc);
    else if (f.category !== "identity") bump(shape.otherFacts, f.category);
  }
  for (const d of s.decisions) {
    if (/^decisions\.trade\..+\.form_8949_box$/.test(d.decisionKey)) {
      /* "partII.boxD" → "D" */
      bump(shape.salesByBox, String(d.decision).replace(/^.*box/i, ""));
      continue;
    }
    const scope = /^decisions\.scope\.(.+)$/.exec(d.decisionKey);
    const value = shortCode(d.decision);
    if (scope && value) shape.scope[scope[1]] = value;
  }
  return shape;
}
