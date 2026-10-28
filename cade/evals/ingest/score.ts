import type { TaxFactRow } from "@openreturn/engine/facts";
import { compareValues, shareCorrect, type FieldResult } from "../lib/compare";

/*
 * Keys hold slugs from names the model reads, so facts pair by kind (the key without
 * slugs), not exact key. Each expected fact takes the best unused match of its kind.
 */

export interface FactResult {
  key: string;
  matchedKey?: string;
  fields: FieldResult[];
}

export interface DocScore {
  score: number;
  facts: FactResult[];
  extraFacts: string[];
}

/* "account.x.trades.y" → "investment_income:account.trades". A trade id can hold a dot. */
const kindOf = (f: TaxFactRow) =>
  `${f.category}:${f.key
    .replace(/^(account|payer|employer|employee|vendor)\.[^.]+/, "$1")
    .replace(/\.(trades|distributions|hsa_distributions)\..*$/, ".$1")}`;

const FORM_BY_SUFFIX: [RegExp, string][] = [
  [/\.interest$/, "1099-INT"],
  [/\.dividends$/, "1099-DIV"],
  [/\.misc$/, "1099-MISC"],
  [/\.trades\.[^.]+/, "1099-B"],
];
export const formOf = (key: string) =>
  FORM_BY_SUFFIX.find(([re]) => re.test(key))?.[1] ?? "document";

export function formScores(score: DocScore): Map<string, number> {
  const byForm = new Map<string, FactResult[]>();
  for (const f of score.facts) byForm.set(formOf(f.key), [...(byForm.get(formOf(f.key)) ?? []), f]);
  return new Map(
    [...byForm].map(([form, fs]) => [form, shareCorrect(fs.flatMap((f) => f.fields))]),
  );
}

export const missesForm = (score: DocScore) => {
  const forms = new Set(score.facts.map((f) => formOf(f.key)));
  return [...forms].some((form) =>
    score.facts.filter((f) => formOf(f.key) === form).every((f) => !f.matchedKey),
  );
};

/* Identity facts are a W-2 side effect; the W-2 fact's employee block scores the same values. */
const scoredWrites = (written: TaxFactRow[]) => written.filter((f) => f.category !== "identity");

export function scoreDoc(expected: TaxFactRow[], written: TaxFactRow[]): DocScore {
  const unused = scoredWrites(written);
  const facts = expected.map((exp): FactResult => {
    const candidates = unused.filter((w) => kindOf(w) === kindOf(exp));
    const ranked = candidates
      .map((w) => ({ w, fields: compareValues(exp.value, w.value) }))
      .sort((a, b) => shareCorrect(b.fields) - shareCorrect(a.fields));
    const best = ranked[0];
    if (!best) return { key: exp.key, fields: compareValues(exp.value, undefined) };
    unused.splice(unused.indexOf(best.w), 1);
    return { key: exp.key, matchedKey: best.w.key, fields: best.fields };
  });
  return {
    score: shareCorrect(facts.flatMap((f) => f.fields)),
    facts,
    extraFacts: unused.map((f) => f.key),
  };
}
