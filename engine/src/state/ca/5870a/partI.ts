/*
 * Part I of one FTB 5870A, from the trust's Schedule J (541) Part IV and the
 * five earlier years' California returns
 * (ca-5870a-inst-2025::sec::part-i-tax-on-accumulation-distribution::b01 to ::b06).
 */

import { SPOUSE_KEYS, type ThrowbackYearRow } from "../../../facts/index.js";
import { ageTwentyOne } from "../../../federal/4970/copies.js";
import type { ResolverInputs } from "../../../resolverInputs.js";
import type { Column, Form5870AResult } from "./filingInfo.js";
import {
  computationYearIndexes,
  MULTIPLE_TRUST_MINIMUM,
  NO_YEAR_TOTALS,
  partISectionA,
  partITotals,
  PRECEDING_YEARS,
  taxableIncomeAmount,
  type PartISectionA,
  type ThrowbackInput,
} from "./lines.js";
import {
  answeredYear,
  caYears,
  columnOf,
  GAP_NONRESIDENT_YEAR,
  isMissingList,
  type CaYear,
} from "./years.js";

const TAXPAYER_DOB_KEY = "identity.dob";

const GAP_AGE_21_YEAR =
  "The beneficiary reached 21 during a throwback year: the federal rule leaves out the income accumulated before age 21 (irs-4970-form-2025::sec::line-2::b01), and the instructions do not say how to split that year.";
const GAP_AGE_21_MULTIPLE =
  'A throwback year before age 21 is also a year of the multiple trust rule: the federal line 2 says "if the multiple trust rule applies, see the instructions for line 4" (irs-4970-form-2025::sec::line-2::b01), and the line 4 text does not say what is left out then.';

/*
 * DECISION (2026-11-25, by the author): Part I has no line for the income a
 * trust accumulated before the beneficiary was born or reached 21. Text A, the
 * FTB 5870A instructions: "Except as explained above, use the instructions for
 * federal Form 4970 to compute the partial tax"
 * (ca-5870a-inst-2025::sec::california-does-not-follow-the-federal-rules-for::b01),
 * and Form 4970 line 2 takes that income out (irs-4970-form-2025::sec::line-2::b01);
 * Schedule J (541) Part I says the same ("See the instructions for federal Form
 * 4970 ... for certain income minors may exclude", the 2025 form). Text B, the
 * California form: line 1 is the amount "from Schedule J (541), line 30, column
 * (a)", the total of every throwback year (ca-5870a-face-2025::sec::face-part-i::b01).
 * The engine follows Text A: a throwback year before age 21 leaves every line,
 * as the counted years of Form 4970 do (decision A20), because the form's own
 * instructions bring in the federal rule and line 1 holds only amounts
 * "considered distributed in earlier taxable years".
 */
function throwbackInputs(
  rows: readonly ThrowbackYearRow[],
  dob: string,
): ThrowbackInput[] | string {
  const inputs: ThrowbackInput[] = [];
  for (const row of rows) {
    const age = ageTwentyOne(dob, row.year);
    if (age === "split" || age === undefined) return GAP_AGE_21_YEAR;
    const multipleTrustRule = (row.otherTrustsCounted ?? 0) >= MULTIPLE_TRUST_MINIMUM;
    if (age === "before" && multipleTrustRule) return GAP_AGE_21_MULTIPLE;
    if (age === "before") continue;
    inputs.push({
      year: row.year,
      amount: row.amount,
      taxes: row.taxes,
      taxExemptInterest: row.taxExemptInterest ?? 0,
      multipleTrustRule,
    });
  }
  return inputs;
}

/* A kept year's column: the 540NR route is a gap; a resident year needs its answers. */
function keptColumn(fact: CaYear, share: number): Column | string {
  if (fact.residency !== "resident") return { year: fact.year, gap: GAP_NONRESIDENT_YEAR };
  const answered = answeredYear(fact);
  return answered === undefined ? fact.key : columnOf(answered, share);
}

/* The beneficiary's date of birth, or its key while it is missing. */
function birthDate(
  inputs: ResolverInputs,
  beneficiary: "taxpayer" | "spouse",
): { dob: string } | { missing: string } {
  const key = beneficiary === "spouse" ? SPOUSE_KEYS.dob : TAXPAYER_DOB_KEY;
  const dob = inputs.factByKey.get(key);
  return typeof dob === "string" ? { dob } : { missing: key };
}

/* Part I, or what it waits for. trustKey is listed while Schedule J (541) has no year. */
export function partIResult(
  inputs: ResolverInputs,
  rows: readonly ThrowbackYearRow[] | undefined,
  trustKey: string,
  beneficiary: "taxpayer" | "spouse",
): Form5870AResult {
  if (rows === undefined || rows.length === 0) return { kind: "waits", missing: [trustKey] };
  const born = birthDate(inputs, beneficiary);
  if ("missing" in born) return { kind: "waits", missing: [born.missing] };
  const counted = throwbackInputs(rows, born.dob);
  if (typeof counted === "string") return { kind: "gap", reason: counted };
  const sectionA = partISectionA(counted);
  if (counted.length === 0) {
    const partI = { sectionA, line11: [], columns: [], totals: NO_YEAR_TOTALS };
    return { kind: "figured", lines: { partI } };
  }
  return recomputedPartI(inputs, sectionA);
}

/* Lines 11 to 26, from the five earlier years' returns. */
function recomputedPartI(inputs: ResolverInputs, sectionA: PartISectionA): Form5870AResult {
  const years = caYears(inputs, PRECEDING_YEARS);
  if (isMissingList(years)) return { kind: "waits", missing: years };
  const noIncome = years.filter((fact) => fact.taxableIncome === undefined);
  if (noIncome.length > 0) return { kind: "waits", missing: noIncome.map((fact) => fact.key) };
  const line11 = years.map((fact) => taxableIncomeAmount(fact.taxableIncome ?? 0));
  const kept = computationYearIndexes(line11).map((index) =>
    keptColumn(years[index], sectionA.line10),
  );
  const unanswered = kept.filter((entry): entry is string => typeof entry === "string");
  if (unanswered.length > 0) return { kind: "waits", missing: unanswered };
  const columns = kept as Column[];
  const lines = columns.map((entry) => entry.lines);
  const totals = lines.every((entry) => entry !== undefined)
    ? partITotals(lines as NonNullable<Column["lines"]>[], sectionA)
    : undefined;
  const taxGap = totals === undefined ? columns.find((entry) => entry.gap)?.gap : undefined;
  return { kind: "figured", lines: { partI: { sectionA, line11, columns, totals } }, taxGap };
}
