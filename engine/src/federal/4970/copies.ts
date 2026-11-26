/*
 * The Forms 4970 a return files: one for each domestic trust, created before
 * March 1, 1984, whose Schedule J (Form 1041) Part IV shows a throwback year
 * (irs-4970-form-2025::sec::who-must-file::b01, purpose-of-form::b01).
 */

import { bornBeforeJan2Of } from "../../birthDate.js";
import {
  getTrustAccumulationDistributionFacts,
  SPOUSE_KEYS,
  type ThrowbackYearRow,
  type TrustAccumulationDistributionFact,
} from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import type { Form4970Copy, Form4970Result } from "./filingInfo.js";
import { MULTIPLE_TRUST_MINIMUM, partI, type ThrowbackInput } from "./lines.js";
import { partII } from "./partII.js";

const TAXPAYER_DOB_KEY = "identity.dob";

const GAP_FORMERLY_FOREIGN =
  "The trust is a domestic trust that used to be a foreign trust: the instructions send the beneficiary to Rev. Rul. 91-6 (irs-4970-form-2025::sec::who-must-file::b01), which the engine does not apply.";
const GAP_AGE_21_YEAR =
  "The beneficiary reached 21 during a throwback year: line 2 takes the UNI accumulated before age 21 (irs-4970-form-2025::sec::line-2::b01), and the instructions do not say how to split that year.";
const GAP_AGE_21_MULTIPLE =
  'A throwback year before age 21 is also a year of the multiple trust rule: line 2 says "if the multiple trust rule applies, see the instructions for line 4" (irs-4970-form-2025::sec::line-2::b01), and the line 4 instructions do not say what line 2 then holds.';

/* "Accumulated before you were born or reached age 21" for a whole year; "split" when 21 falls inside it. */
export function ageTwentyOne(dob: string, year: number): "before" | "after" | "split" | undefined {
  // Born before January 2 of (year − 20): 21 by December 31 of the year (birthDate.ts counts the day before).
  const reachedByYearEnd = bornBeforeJan2Of(dob, year - 20);
  const reachedBeforeYear = bornBeforeJan2Of(dob, year - 21);
  if (reachedByYearEnd === undefined || reachedBeforeYear === undefined) return undefined;
  if (!reachedByYearEnd) return "before";
  return reachedBeforeYear ? "after" : "split";
}

function throwbackInputs(rows: ThrowbackYearRow[], dob: string): ThrowbackInput[] | string {
  const inputs: ThrowbackInput[] = [];
  for (const row of rows) {
    const age = ageTwentyOne(dob, row.year);
    if (age === "split" || age === undefined) return GAP_AGE_21_YEAR;
    const multipleTrustRule = (row.otherTrustsCounted ?? 0) >= MULTIPLE_TRUST_MINIMUM;
    if (age === "before" && multipleTrustRule) return GAP_AGE_21_MULTIPLE;
    inputs.push({
      year: row.year,
      amount: row.amount,
      taxes: row.taxes,
      taxExemptInterest: row.taxExemptInterest ?? 0,
      beforeAge21: age === "before",
      multipleTrustRule,
    });
  }
  return inputs;
}

function resultOf(inputs: ResolverInputs, fact: TrustAccumulationDistributionFact): Form4970Result {
  const answers = fact.value;
  if (answers.formerlyForeign === true) return { kind: "gap", reason: GAP_FORMERLY_FOREIGN };
  const dobKey = answers.beneficiary === "spouse" ? SPOUSE_KEYS.dob : TAXPAYER_DOB_KEY;
  const dob = inputs.factByKey.get(dobKey);
  if (typeof dob !== "string") return { kind: "waits", missing: [dobKey] };
  const rows = throwbackInputs(answers.throwbackYears, dob);
  if (typeof rows === "string") return { kind: "gap", reason: rows };
  return partII(inputs, partI(rows), answers.estateOrGenerationSkippingTax);
}

/* A trust fact that files a Form 4970: domestic, created before March 1, 1984, with a throwback year. */
export function filesForm4970(fact: TrustAccumulationDistributionFact): boolean {
  const { value } = fact;
  if (value.trustType !== "domestic" || value.throwbackYears.length === 0) return false;
  return value.createdBeforeMarch1984 || value.formerlyForeign === true;
}

/* Every Form 4970 the facts file, in the order recorded. */
export function form4970Copies(inputs: ResolverInputs): Form4970Copy[] {
  return getTrustAccumulationDistributionFacts(inputs.facts)
    .filter(filesForm4970)
    .map((fact) => ({ factKey: fact.key, answers: fact.value, result: resultOf(inputs, fact) }));
}

/* A foreign trust's distribution: its partial tax goes on Form 3520 (who-must-file::b01). */
export function hasForeignTrustDistribution(inputs: ResolverInputs): boolean {
  return getTrustAccumulationDistributionFacts(inputs.facts).some(
    (fact) => fact.value.trustType === "foreign" && fact.value.throwbackYears.length > 0,
  );
}
