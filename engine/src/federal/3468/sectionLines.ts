/*
 * The line groups Parts V and VI repeat in each section: the base percentage
 * line and its product, the domestic content and energy community bonuses
 * (lines 9 and 10 of Part I), and the low-income communities bonus (line 11).
 * Each helper writes its lines by the letters the section uses.
 */

import type { InvestmentCreditFacility } from "../../facts/index.js";
import { sum } from "../../money.js";
import type { CellValue } from "./cells.js";
import { textOf } from "./cells.js";
import {
  bonusRate,
  lowIncomeLines,
  lowIncomeRate,
  percentText,
  ratioText,
  times,
  WAITING,
  type Waiting,
} from "./lines.js";

export type Lines = Record<string, CellValue>;

/* A section's lines and its total line, or the wait for an answer. */
export type SectionResult = { lines: Lines; total: number } | Waiting;

/* "Enter …%" then "Multiply line …a by line …b": the rate line and its product. */
export function rateAndProduct(
  basis: number,
  rate: number,
  rateLine: string,
  productLine: string,
): { lines: Lines; amount: number } {
  const amount = times(basis, rate);
  return { lines: { [rateLine]: percentText(rate), [productLine]: amount }, amount };
}

/*
 * The domestic content (9a 10%, 9b 2%) and energy community (10a, 10b)
 * bonuses: "Otherwise, go to line …" leaves both lines blank
 * (irs-3468-inst-2025::sec::line-1d-3::b01, ::line-1f-3::b01).
 */
export function bonusLines(
  basis: number,
  facility: InvestmentCreditFacility,
  letters: [dcRate: string, dc: string, ecRate: string, ec: string],
): { lines: Lines; amount: number } {
  const [dcRateLine, dcLine, ecRateLine, ecLine] = letters;
  const lines: Lines = {};
  let amount = 0;
  const domestic = bonusRate(facility.domesticContent);
  if (domestic !== undefined) {
    lines[dcRateLine] = percentText(domestic);
    lines[dcLine] = times(basis, domestic);
    amount += times(basis, domestic);
  }
  const community = bonusRate(facility.energyCommunity);
  if (community !== undefined) {
    lines[ecRateLine] = percentText(community);
    lines[ecLine] = times(basis, community);
    amount += times(basis, community);
  }
  return { lines, amount };
}

/* Lines 9 and 10 answered: the bonus lines can be read. */
export const answersBonuses = (facility: InvestmentCreditFacility): boolean =>
  facility.domesticContent !== undefined && facility.energyCommunity !== undefined;

/*
 * The low-income bonus lines by their letters: rate, allocation, equal, ratio,
 * rate times ratio, basis times that, bonus. A rate of 0% prints "0" and the
 * bonus line -0- ("enter 0% here, go to line …n and enter -0-", face-part-v::b02).
 */
export function lowIncomeBlock(
  basis: number,
  facility: InvestmentCreditFacility,
  capacity: { kw: number | undefined; acKw: number | undefined },
  allocatedKw: number | undefined,
  letters: [string, string, string, string, string, string, string],
): { lines: Lines; amount: number } | Waiting {
  if (facility.lowIncome === undefined) return WAITING;
  const rate = lowIncomeRate(facility.lowIncome, capacity.acKw);
  const block = lowIncomeLines(basis, rate, capacity.kw, allocatedKw);
  if (block === WAITING) return WAITING;
  const [rateLine, allocatedLine, equalLine, ratioLine, ratioRateLine, ratioAmountLine, bonusLine] =
    letters;
  const ratioRate = block.ratioRate === undefined ? undefined : `${percentText(block.ratioRate)}%`;
  const lines: Lines = {
    [rateLine]: percentText(block.rate),
    [allocatedLine]: textOf(block.allocatedKw),
    [equalLine]: block.equal,
    [ratioLine]: ratioText(block.ratio),
    [ratioRateLine]: ratioRate,
    [ratioAmountLine]: block.ratioAmount,
    [bonusLine]: block.bonus,
  };
  return { lines, amount: block.bonus };
}

/* The section's lines joined, and the total line as the sum of its parts. */
export function joined(
  parts: ReadonlyArray<{ lines: Lines; amount: number }>,
  totalLine: string,
): { lines: Lines; total: number } {
  const total = sum(...parts.map((part) => part.amount));
  const lines = Object.assign({}, ...parts.map((part) => part.lines), { [totalLine]: total });
  return { lines, total };
}
