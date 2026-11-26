/*
 * The 1099-R amounts a Form 8915-F fact names, read against the 1099-R facts:
 * which line of Part I each belongs to, its taxable share, and the cases the
 * engine does not figure.
 */

import {
  ROTH_IRA_CODES,
  getLumpSumDistributionFacts,
  hasDistributionCode,
  isCorrectiveDistribution,
  isDisabilityPension,
  parseRetirementDistributionFact,
  type DisasterDistributionPart,
  type DisasterRetirementFactValue,
  type IraOwner,
  type RetirementDistributionFact,
  type RetirementDistributionFactValue,
} from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { rowTaxable } from "../1040/rowTaxable.js";
import type { PartILine } from "./lines.js";

/* The form is for tax year 2025: "this year" (the-instructions-for-form-8915-f-rev-january::b01). */
export const FORM_YEAR = 2025;

/* Roth IRA distributions that Form 8606 Part III takes (code Q is qualified and not taxed). */
export const ROTH_CODES_ON_FORM_8606 = ["J", "T"];

const DIRECT_ROLLOVER_CODES = ["G", "H"];

export const ownerOf = (row: { owner?: IraOwner }): IraOwner => row.owner ?? "taxpayer";

/*
 * Line 2, 3 or 4: "Traditional IRAs include traditional SEP IRAs and
 * traditional SIMPLE IRAs"; "Roth IRAs include Roth SEP IRAs and Roth SIMPLE
 * IRAs" (the form; line-1e::b06).
 */
export function partILineOf(row: RetirementDistributionFactValue): PartILine {
  if (hasDistributionCode(row, ROTH_IRA_CODES)) return "roth";
  return row.box7IraSepSimple ? "traditional" : "plan";
}

/* A 1099-R amount the form takes, whole dollars, with its row. */
export interface NamedPiece {
  key: string;
  row: RetirementDistributionFactValue;
  line: PartILine;
  amount: number;
  date: string;
  repaid: number;
}

/* Every 1099-R fact on the return, by key. */
export function distributionsByKey(
  inputs: ResolverInputs,
): Map<string, RetirementDistributionFact> {
  return new Map(
    inputs.facts.flatMap((row) => {
      const fact = parseRetirementDistributionFact(row);
      return fact === null ? [] : [[row.key, fact] as const];
    }),
  );
}

const ROW_NOT_FOUND =
  "A Form 8915-F distribution names a 1099-R that is not on the return, or one of the other spouse.";
const NOT_THIS_YEAR =
  "A Form 8915-F distribution is dated outside 2025; this year's form reports only this year's distributions.";
const NOT_ELIGIBLE =
  "A Form 8915-F distribution is a direct rollover, a corrective distribution or a disability pension: the first two are not qualified disaster distributions (disaster-virginia-severe-winter-storm-and-snowstorm::b02–b03), and the engine does not split a disability pension between Form 1040 lines 1h and 5b.";
const LUMP_SUM =
  "A Form 8915-F distribution is also on Form 4972: a qualified disaster distribution is not eligible for the capital gain election or the 10-year tax option (declaration-type-incident-type::b01).";
const UNDETERMINED =
  "A Form 8915-F distribution's taxable amount is not determined (1099-R box 2b): the cost on lines 9 and 29 needs Pub. 575 (line-9::b01), which the engine does not figure.";
const MORE_THAN_BOX_1 =
  "Form 8915-F names more of a 1099-R than its box 1: a part can be named only once.";

function rowGap(inputs: ResolverInputs, key: string, row: RetirementDistributionFactValue) {
  if (hasDistributionCode(row, DIRECT_ROLLOVER_CODES)) return NOT_ELIGIBLE;
  if (isCorrectiveDistribution(row) || isDisabilityPension(row)) return NOT_ELIGIBLE;
  const onForm4972 = getLumpSumDistributionFacts(inputs.facts).some((fact) =>
    fact.value.distributionKeys.includes(key),
  );
  if (onForm4972) return LUMP_SUM;
  const rothOn8606 = hasDistributionCode(row, ROTH_IRA_CODES);
  return !rothOn8606 && rowTaxable(row) === undefined ? UNDETERMINED : undefined;
}

/* The named parts of the 1099-Rs, or why the form cannot be figured. */
export function namedPieces(
  inputs: ResolverInputs,
  rows: ReadonlyMap<string, RetirementDistributionFact>,
  owner: IraOwner,
  parts: ReadonlyArray<DisasterDistributionPart & { repaid?: number }>,
): NamedPiece[] | string {
  const pieces: NamedPiece[] = [];
  for (const part of parts) {
    const fact = rows.get(part.distributionKey);
    if (!fact || ownerOf(fact.distribution) !== owner) return ROW_NOT_FOUND;
    if (!part.date.startsWith(`${FORM_YEAR}-`)) return NOT_THIS_YEAR;
    const gap = rowGap(inputs, part.distributionKey, fact.distribution);
    if (gap) return gap;
    const row = fact.distribution;
    pieces.push({
      key: part.distributionKey,
      row,
      line: partILineOf(row),
      amount: roundDollars(part.amount ?? row.box1),
      date: part.date,
      repaid: roundDollars(part.repaid ?? 0),
    });
  }
  return pieces;
}

/* Each 1099-R is named for at most its box 1, across Parts I and IV. */
export function overNamedGap(pieces: readonly NamedPiece[]): string | undefined {
  const named = new Map<string, number>();
  for (const piece of pieces) named.set(piece.key, (named.get(piece.key) ?? 0) + piece.amount);
  return pieces.some((piece) => (named.get(piece.key) ?? 0) > roundDollars(piece.row.box1))
    ? MORE_THAN_BOX_1
    : undefined;
}

/*
 * The taxable share of an amount of a 1099-R. A plan distribution shares out
 * its cost: "If there is an amount in box 2a of Form 1099-R, the difference
 * between box 1 and box 2a is usually your cost", and a 1099-R with both kinds
 * of distribution must have "the cost attributable to each distribution"
 * figured apart (line-9::b01, line-29::b01). The engine shares it in proportion
 * to box 1 (QUESTIONS.md). An IRA amount is taxable in full on line 20, up to
 * the row's taxable amount. A Roth IRA amount Form 8606 takes is 0 here.
 */
export function taxableShare(row: RetirementDistributionFactValue, amount: number): number {
  if (hasDistributionCode(row, ROTH_IRA_CODES)) return 0;
  const taxable = rowTaxable(row) ?? row.box1;
  if (row.box7IraSepSimple) return Math.min(amount, taxable);
  return row.box1 > 0 ? (amount * taxable) / row.box1 : 0;
}

/* The cost share of an amount of a plan distribution (lines 9 and 29), cents kept. */
export function costShare(row: RetirementDistributionFactValue, amount: number): number {
  if (row.box7IraSepSimple || hasDistributionCode(row, ROTH_IRA_CODES)) return 0;
  return amount - taxableShare(row, amount);
}

/* Column (a): box 1 of every 1099-R of the person, by line (line-1e::b06). */
export function columnA(
  rows: ReadonlyMap<string, RetirementDistributionFact>,
  owner: IraOwner,
): Record<PartILine, number> {
  const own = [...rows.values()]
    .map((fact) => fact.distribution)
    .filter((row) => ownerOf(row) === owner);
  const total = (line: PartILine) =>
    roundDollars(sum(...own.filter((row) => partILineOf(row) === line).map((row) => row.box1)));
  return { plan: total("plan"), traditional: total("traditional"), roth: total("roth") };
}

/* The Roth IRA pieces that Form 8606 Part III takes. */
export const isRothOnForm8606 = (piece: NamedPiece) =>
  hasDistributionCode(piece.row, ROTH_CODES_ON_FORM_8606);

/* Every named part of a fact, Part I first. */
export function namedParts(value: DisasterRetirementFactValue) {
  return {
    partI: value.qualifiedDisasterDistributions ?? [],
    partIV: value.homePurchaseDistributions ?? [],
  };
}
