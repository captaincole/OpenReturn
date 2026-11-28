/*
 * Form 8874's credit as Form 3800 sources: "All others, report this amount on
 * Form 3800, Part III, line 1i" (irs-8874-form-2025::sec::face-page-1::b01).
 *
 * Line 3 is line 1 (the investments held directly) plus line 2 (the K-1s). The
 * K-1 credits already are Form 3800 sources of their own (3800/sources.ts),
 * with the entity's EIN in column (c) and their own passive answer, so this
 * adds line 1 only, one source for each investment, as Form 8586 does for its
 * buildings (8586/form3800.ts). Part III line 1i then totals line 3.
 *
 * Passive: each investment fact states it, as a Form 3468 property does
 * (3468/credit.ts). A passive credit's activity for Form 8582-CR is the
 * investment in the CDE, not rental real estate, so it goes on Worksheet 4
 * (facts/kinds/generalBusinessCredit.ts, PassiveCreditActivity).
 */

import type { NewMarketsInvestmentFactValue } from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { isGap } from "../3800/cells.js";
import type { CreditSource } from "../3800/filingInfo.js";
import type { Line1Row } from "./lines.js";
import { newMarketsFactsOf, resolve8874Info } from "./resolveInfo.js";

/* Part III line 1i, Form 8874 (3800/rows.ts). */
export const FORM_3800_LINE = "1i";

type InvestmentRow = Line1Row & { key: string };

const sourceOf = (
  row: InvestmentRow,
  value: NewMarketsInvestmentFactValue | undefined,
): CreditSource => {
  const passive = value?.passive === true;
  const name = `New markets investment in ${value?.notice.box1CdeName ?? row.nameAndAddress}`;
  return {
    credit: {
      line: FORM_3800_LINE,
      key: row.key,
      amount: row.credit,
      passive,
      activity: passive ? { name, rentalRealEstate: false } : undefined,
    },
  };
};

/*
 * Line 1 as Form 3800 sources while Form 8874 files, and the answers they wait
 * on: an investment whose passive answer is missing. A gap on line 1 (a
 * recapture event, a row past the sixth) is one source that carries it, so
 * line 1i and every total that adds it stay unsupported.
 */
export function newMarketsCreditSourcesOf(inputs: ResolverInputs): {
  sources: CreditSource[];
  missing: string[];
} {
  const lines = resolve8874Info(inputs).newMarketsCredit;
  if (lines === undefined || lines.investments.length === 0) return { sources: [], missing: [] };
  const attached = lines.rows.find((row) => row.key === undefined);
  if (attached !== undefined) {
    return {
      sources: [sourceOf({ ...attached, key: lines.investments[0].key }, undefined)],
      missing: [],
    };
  }
  const values = new Map(newMarketsFactsOf(inputs).map((fact) => [fact.key, fact.value]));
  const gaps = lines.investments.filter((row) => isGap(row.credit));
  if (gaps.length > 0) return { sources: gaps.map((row) => sourceOf(row, undefined)), missing: [] };
  const withCredit = lines.investments.filter(
    (row) => typeof row.credit === "number" && row.credit > 0,
  );
  const unknown = withCredit.filter((row) => typeof values.get(row.key)?.passive !== "boolean");
  if (unknown.length > 0) return { sources: [], missing: unknown.map((row) => row.key) };
  return {
    sources: withCredit.map((row) => sourceOf(row, values.get(row.key))),
    missing: [],
  };
}
