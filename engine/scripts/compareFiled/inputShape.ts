/* PRIVACY: fact keys carry payer and account names, so print counts, never a key. */

import { isDividendFactKey, isInterestFactKey } from "../../src/facts/index.js";
import type { Scenario } from "../../tests/types.js";

export interface InputShape {
  documents: Record<string, number>;
  salesByBox: Record<string, number>;
  scope: Record<string, string>;
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
      bump(shape.salesByBox, String(d.decision).replace(/^.*box/i, ""));
      continue;
    }
    const scope = /^decisions\.scope\.(.+)$/.exec(d.decisionKey);
    const value = shortCode(d.decision);
    if (scope && value) shape.scope[scope[1]] = value;
  }
  return shape;
}
