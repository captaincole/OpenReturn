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
const kindOf = (fact: TaxFactRow) =>
  `${fact.category}:${fact.key
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
  for (const fact of score.facts)
    byForm.set(formOf(fact.key), [...(byForm.get(formOf(fact.key)) ?? []), fact]);
  return new Map(
    [...byForm].map(([form, fs]) => [form, shareCorrect(fs.flatMap((fact) => fact.fields))]),
  );
}

export const missesForm = (score: DocScore) => {
  const forms = new Set(score.facts.map((fact) => formOf(fact.key)));
  return [...forms].some((form) =>
    score.facts.filter((fact) => formOf(fact.key) === form).every((fact) => !fact.matchedKey),
  );
};

/* Identity facts are a W-2 side effect; the W-2 fact's employee block scores the same values. */
const scoredWrites = (written: TaxFactRow[]) =>
  written.filter((fact) => fact.category !== "identity");

export function scoreDoc(expected: TaxFactRow[], written: TaxFactRow[]): DocScore {
  const unused = scoredWrites(written);
  const facts = expected.map((exp): FactResult => {
    const candidates = unused.filter((fact) => kindOf(fact) === kindOf(exp));
    const ranked = candidates
      .map((candidate) => ({ w: candidate, fields: compareValues(exp.value, candidate.value) }))
      .sort((left, right) => shareCorrect(right.fields) - shareCorrect(left.fields));
    const best = ranked[0];
    if (!best) return { key: exp.key, fields: compareValues(exp.value, undefined) };
    unused.splice(unused.indexOf(best.w), 1);
    return { key: exp.key, matchedKey: best.w.key, fields: best.fields };
  });
  return {
    score: shareCorrect(facts.flatMap((fact) => fact.fields)),
    facts,
    extraFacts: unused.map((fact) => fact.key),
  };
}
