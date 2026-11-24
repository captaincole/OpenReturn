/*
 * One fund's Form 8621: the parts it takes, and what it sends to the rest of
 * the return. Part III for a QEF, Part IV for marked stock, Part V for a
 * section 1291 fund (and the first year of a mark-to-market election), Part VI
 * for outstanding section 1294 elections.
 */

import type { PficFundFact, PficFundFactValue } from "../../facts/index.js";
import { atLeast, sum } from "../../money.js";
import { currencyGap, saleInDollars, yearEndValueUsd } from "./currency.js";
import { holdingStartOf } from "./line15.js";
import {
  markToMarketOrdinary,
  partIIILines,
  partIVDisposition,
  partIVYearEnd,
  type PartIIILines,
  type PartIVDisposition,
  type PartIVYearEnd,
} from "./lines.js";
import { markToMarketFirstYear, partVOf, takesPartV, type PartV } from "./partV.js";
import { PART_VI_COLUMNS, partVIColumn, type PartVIColumn } from "./partVI.js";
import { fundResults, type FundResults } from "./results.js";

export interface Form8621Fund {
  key: string;
  fact: PficFundFactValue;
  /* Why this fund's form cannot be figured: then its lines are unsupported. */
  gap?: string;
  partIII?: PartIIILines;
  partIV?: { yearEnd?: PartIVYearEnd; sale?: PartIVDisposition };
  partV?: PartV;
  partVI?: PartVIColumn[];
  results: FundResults;
}

const NO_YEAR_END_BASIS =
  "The fund fact does not state the adjusted basis at the end of the year (line 10b).";
const MORE_THAN_SIX =
  "More than six outstanding section 1294 elections: Part VI has six columns, and the engine prints no continuation.";

function partIVOf(fund: PficFundFactValue): Form8621Fund["partIV"] | string {
  const held = fund.sharesAtYearEnd > 0;
  const basis = fund.markToMarket?.adjustedBasisAtYearEnd;
  if (held && basis === undefined) return NO_YEAR_END_BASIS;
  return {
    yearEnd:
      held && basis !== undefined
        ? partIVYearEnd(yearEndValueUsd(fund), {
            adjustedBasis: basis,
            unreversedInclusions: fund.markToMarket?.unreversedInclusions,
          })
        : undefined,
    sale: fund.disposition ? partIVDisposition(saleInDollars(fund.disposition)) : undefined,
  };
}

function partVIOf(fund: PficFundFactValue): PartVIColumn[] | string | undefined {
  const elections = fund.prior1294Elections ?? [];
  if (elections.length === 0) return undefined;
  if (elections.length > PART_VI_COLUMNS) return MORE_THAN_SIX;
  const columns = elections.map(partVIColumn);
  const gap = columns.find((column): column is string => typeof column === "string");
  return gap ?? (columns as PartVIColumn[]);
}

/* The parts of one fund, or the first reason one cannot be figured. */
function partsOf(fund: PficFundFactValue, holdingStart: Date) {
  if (fund.qualifyingInsuranceElection === true) return {};
  const partVI = partVIOf(fund);
  if (typeof partVI === "string") return partVI;
  const partIII =
    fund.regime === "qef" && fund.qef
      ? partIIILines(fund.qef, fund.elections?.extendTime === true)
      : undefined;
  if (fund.regime === "qef" && !fund.qef)
    return "The fund is a QEF, and the fact states no PFIC Annual Information Statement amounts (lines 6a and 7a).";
  const marked = fund.regime === "mark_to_market" && !markToMarketFirstYear(fund, holdingStart);
  const partIV = marked ? partIVOf(fund) : undefined;
  if (typeof partIV === "string") return partIV;
  const partV = takesPartV(fund, holdingStart) ? partVOf(fund, holdingStart) : undefined;
  if (typeof partV === "string") return partV;
  return { partIII, partIV, partV, partVI };
}

/* A fund that cannot be figured: its lines and every line that takes its amounts carry the reason. */
const withGap = (base: { key: string; fact: PficFundFactValue }, gap: string): Form8621Fund => ({
  ...base,
  gap,
  results: { ...fundResults({}, false), gap },
});

function figureFund(fact: PficFundFact): Form8621Fund {
  const base = { key: fact.key, fact: fact.value };
  const holdingStart = holdingStartOf(fact.value.acquiredDate);
  if (holdingStart === undefined)
    return withGap(base, `The acquisition date (${fact.value.acquiredDate}) is not a date.`);
  const noRate = currencyGap(fact.value);
  if (noRate !== undefined) return withGap(base, noRate);
  const parts = partsOf(fact.value, holdingStart);
  if (typeof parts === "string") return withGap(base, parts);
  return {
    ...base,
    ...parts,
    results: fundResults(parts, fact.value.qef?.section1411gElection === true),
  };
}

/*
 * A fund's form depends on its fact alone, and many resolvers read it in each
 * pass: each fact value is figured once.
 */
const figuredByFact = new WeakMap<PficFundFactValue, Form8621Fund>();

/* One fund's form from its fact. */
export function form8621Fund(fact: PficFundFact): Form8621Fund {
  const known = figuredByFact.get(fact.value);
  if (known !== undefined && known.key === fact.key) return known;
  const figured = figureFund(fact);
  figuredByFact.set(fact.value, figured);
  return figured;
}

/*
 * Part I line 5 amounts (irs-8621-inst-2025::sec::line-5::b01): (a) the excess
 * distributions and the gain treated as one; (b) the section 1293 inclusion;
 * (c) the section 1296 inclusion or deduction.
 */
export function section1291Amount(partV: PartV | undefined): number | undefined {
  if (partV === undefined) return undefined;
  return sum(partV.line15.line15e2, partV.deemedDividend, atLeast(0, partV.line15.line15f));
}

export function section1293Amount(partIII: PartIIILines | undefined): number | undefined {
  return partIII === undefined ? undefined : partIII.line6c + partIII.line7c;
}

export function section1296Amount(partIV: Form8621Fund["partIV"]): number | undefined {
  return partIV === undefined ? undefined : markToMarketOrdinary(partIV.yearEnd, partIV.sale);
}
