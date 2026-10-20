import type { TaxFactRow } from "@summa/engine/facts";
import { compareValues, shareCorrect, type FieldResult } from "../lib/compare";

/*
 * Score the facts a run wrote against the facts the document should
 * produce. Keys hold slugs the tool derives from names the model reads
 * ("employer.example-corp", "account.x.trades.<id>"), so a fact is paired
 * by its kind (the key without the slugs), not its exact key. Within a
 * kind, each expected fact takes the unused written fact that matches
 * it best. An expected fact with no partner scores every field as wrong.
 */

export interface FactResult {
  key: string;
  matchedKey?: string;
  fields: FieldResult[];
}

export interface DocScore {
  score: number;
  facts: FactResult[];
  /* Written facts no expected fact took: duplicates or the wrong tool. */
  extraFacts: string[];
}

/*
 * "account.x.trades.y" → "investment_income:account.trades". The slug
 * after the first segment and everything after a per-item segment are
 * names (a trade id can hold a dot: "q101.31").
 */
const kindOf = (f: TaxFactRow) =>
  `${f.category}:${f.key
    .replace(/^(account|payer|employer|employee|vendor)\.[^.]+/, "$1")
    .replace(/\.(trades|distributions|hsa_distributions)\..*$/, ".$1")}`;

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
