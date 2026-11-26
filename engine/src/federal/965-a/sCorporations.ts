import type { Section965DeferredValue, Section965SCorporationValue } from "../../facts/index.js";
import { roundDollars, sum, sumOrBlank } from "../../money.js";
import { TRIGGERED_THIS_YEAR } from "./liabilityLines.js";
import { netLiability } from "./lines.js";

/* One Part III row (irs-965a-inst-2025::sec::lines-1-through-4::b01 to b03). */
export interface PartIIIRow {
  name: string;
  ein: string;
  /* Column (c). */
  withThisSCorporation: number;
  /* Column (d): Part I column (c) of the year; undefined while that line's fact is missing. */
  without?: number;
  /* Column (e) = (c) − (d). */
  net?: number;
  /* Column (f). */
  deferralElection: boolean;
  /* Column (g) = (e) on "Yes". */
  deferred?: number;
}

/* Part III for one inclusion year: its rows and the total of column (g). */
export interface PartIIIYear {
  rows: PartIIIRow[];
  /* "The total of column (g) for a tax year ... should be entered on the corresponding tax year line in Part I, column (e)" (lines-1-through-4::b03). */
  totalDeferred?: number;
}

/*
 * Column (d) "should equal the taxpayer's net tax liability without section
 * 965 amounts for the corresponding tax year reported in Part I, column (c)"
 * (lines-1-through-4::b02), so it is that column. Column (g) is (e) only "If
 * the taxpayer elected to defer" (b03).
 */
export function partIIIYear(
  values: ReadonlyArray<Section965SCorporationValue>,
  without: number | undefined,
): PartIIIYear {
  const rows = values.map((value): PartIIIRow => {
    const withThisSCorporation = roundDollars(value.netTaxWithThisSCorporation);
    const net = without === undefined ? undefined : netLiability(withThisSCorporation, without);
    return {
      name: value.name,
      ein: value.ein,
      withThisSCorporation,
      without,
      net,
      deferralElection: value.deferralElection,
      deferred: value.deferralElection ? net : undefined,
    };
  });
  const totalDeferred =
    without === undefined ? undefined : sumOrBlank(...rows.map((row) => row.deferred));
  return { rows, totalDeferred };
}

/* One Part IV row (irs-965a-inst-2025::sec::part-iv-annual-report-of-deferred::b01 to b06). */
export interface PartIVRow {
  year: number;
  name: string;
  ein: string;
  /* Column (d): last year's column (i). */
  beginning?: number;
  /* Column (g): a transfer out (negative) or in (positive). */
  transfer?: number;
  /* Column (h). */
  counterpartyTin?: string;
  /* Column (i) = (d) + (f) + (g); undefined with a gap. */
  ending?: number;
  /* A 2025 triggering event: columns (f) and (i) are unsupported. */
  gap?: string;
}

/*
 * Column (i): "For each line, combine the amounts reported in columns (d)
 * through (g)" (b06); (e) is reserved. Column (f) holds a triggered amount
 * "as a negative number" (b03): a 2025 triggering event is a gap
 * (TRIGGERED_THIS_YEAR), so (f) is otherwise blank.
 */
export function partIVRow(value: Section965DeferredValue): PartIVRow {
  const beginning = roundDollars(value.beginningDeferred);
  const transfer = roundDollars(value.transferThisYear);
  const triggered = roundDollars(value.triggeredThisYear) ?? 0;
  const row = {
    year: value.electionOrTransferYear,
    name: value.name,
    ein: value.ein,
    beginning,
    transfer,
    counterpartyTin: value.transferCounterpartyTin,
  };
  return triggered > 0
    ? { ...row, gap: TRIGGERED_THIS_YEAR }
    : { ...row, ending: sum(beginning, transfer) };
}

/* Part IV Total, column (i); a string when a row has a gap. */
export function partIVTotal(rows: ReadonlyArray<PartIVRow>): number | string | undefined {
  const gap = rows.find((row) => row.gap !== undefined)?.gap;
  if (gap !== undefined) return gap;
  return rows.length === 0 ? undefined : sum(...rows.map((row) => row.ending));
}
