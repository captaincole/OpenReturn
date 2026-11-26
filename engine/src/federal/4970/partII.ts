/*
 * Line 13 and Part II of one Form 4970, from the five earlier years' facts
 * (irs-4970-form-2025::sec::line-13::b01 to line-28::b01).
 */

import {
  makeEarlierYearReturnFactKey,
  type EarlierYearReturnFactValue,
} from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import type { FilingStatus } from "../../values.js";
import { earlierYearIncomeTax } from "./earlierYearTax.js";
import type { Form4970Result } from "./filingInfo.js";
import {
  column,
  computationYearIndexes,
  line13Amount,
  LINE_13_YEARS,
  partIITotals,
  type Column,
  type PartI,
} from "./lines.js";

const GAP_OTHER_METHOD =
  "A computation year's tax used the Schedule D Tax Worksheet, Form 8615, Form 2555 or Schedule J (Form 1040): line 17 must redo that method with that year's rules (irs-4970-form-2025::sec::line-17::b01), and the engine has only the Tax Rate Schedules and the capital gain rates of 2020 to 2024.";
const GAP_TRANSFER_TAXES =
  "Estate tax or generation-skipping transfer tax applies to the distribution: line 28 is reduced proportionately as section 667(b)(6) computes it (irs-4970-form-2025::sec::line-28::b01), and the instructions do not give the computation.";

type EarlierYear = EarlierYearReturnFactValue & { key: string };

/* A computation year with the answers lines 17 and 18 need. */
interface AnsweredYear {
  year: number;
  fact: EarlierYear;
  status: FilingStatus;
  taxBeforeCredits: number;
  line14: number;
}

/* The five earlier years' facts (line 13's order), or the keys of the missing ones. */
function earlierYears(inputs: ResolverInputs): EarlierYear[] | string[] {
  const keys = LINE_13_YEARS.map(makeEarlierYearReturnFactKey);
  const missing = keys.filter((key) => !inputs.factByKey.has(key));
  if (missing.length > 0) return missing;
  return keys.map((key) => ({ key, ...(inputs.factByKey.get(key) as EarlierYearReturnFactValue) }));
}

function answered(year: number, fact: EarlierYear, line14: number): AnsweredYear | undefined {
  const { filingStatus, taxBeforeCredits } = fact;
  if (filingStatus === undefined || taxBeforeCredits === undefined) return undefined;
  return { year, fact, status: filingStatus, taxBeforeCredits, line14 };
}

function columnOf(entry: AnsweredYear, line15: number): Column {
  const { year, fact, status } = entry;
  return column({
    year,
    line14: entry.line14,
    line15,
    taxOnLine16: (line16) =>
      fact.otherTaxMethod === undefined
        ? earlierYearIncomeTax(year, status, line16, fact.preferentialIncome)
        : undefined,
    taxBeforeCredits: entry.taxBeforeCredits,
    creditIncrease: fact.creditIncrease,
    minimumTaxChange: fact.minimumTaxChange,
  });
}

/*
 * The form after Part I. With no year on line 8 the whole distribution is
 * excluded on line 2: lines 9 to 28 stay blank and the partial tax is 0
 * (QUESTIONS.md question 2).
 */
export function partII(
  inputs: ResolverInputs,
  lines: PartI,
  transferTaxes: boolean,
): Form4970Result {
  const { line11, line12 } = lines;
  if (line11 === undefined || line12 === undefined)
    return { kind: "figured", lines: { partI: lines, tax: 0 } };
  const facts = earlierYears(inputs);
  if (facts.some((entry) => typeof entry === "string"))
    return { kind: "waits", missing: facts as string[] };
  const years = facts as EarlierYear[];
  const line13 = years.map((fact) => line13Amount(fact.taxableIncome));
  const kept = computationYearIndexes(line13).map((index) => ({
    fact: years[index],
    entry: answered(LINE_13_YEARS[index], years[index], line13[index]),
  }));
  const unanswered = kept.filter((year) => year.entry === undefined);
  if (unanswered.length > 0)
    return { kind: "waits", missing: unanswered.map((year) => year.fact.key) };
  const columns = kept.flatMap((year) => (year.entry ? [columnOf(year.entry, line12)] : []));
  const totals = partIITotals(columns, line11, lines.line4, transferTaxes);
  return {
    kind: "figured",
    lines: { partI: lines, line13, columns, totals, tax: totals?.line28 },
    partIIGap: totals === undefined ? GAP_OTHER_METHOD : undefined,
    line28Gap: transferTaxes && totals !== undefined ? GAP_TRANSFER_TAXES : undefined,
  };
}
