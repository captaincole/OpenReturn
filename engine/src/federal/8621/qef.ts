/*
 * A QEF's amounts for Part III, in U.S. dollars. The PFIC Annual Information
 * Statement gives the holder's pro rata share of the ordinary earnings and
 * net capital gain, or "sufficient information to enable the shareholder to
 * calculate its pro rata share" (irs-8621-inst-2025::sec::annual-election-requirements-of-the-pfic-or::b01;
 * irs-8621-inst-2025::sec::lines-6a-and-7a::b01). Fund companies print the
 * amounts per unit per day; the share is each amount times the holder's unit
 * days. Cents are kept: Part III rounds each line.
 */

import type { PficQefAmounts } from "../../facts/index.js";
import { sum } from "../../money.js";

export interface QefTotals {
  ordinaryEarnings: number;
  netCapitalGain: number;
  ordinaryEarningsExcluded?: number;
  netCapitalGainExcluded?: number;
  distributions?: number;
  disposedSharesIncome?: number;
}

const NO_UNIT_DAYS =
  "The fund fact gives the PFIC Annual Information Statement's amounts per unit per day but not the unit days held (lines 6a and 7a).";
const NO_AMOUNTS =
  "The fund is a QEF, and the fact states no PFIC Annual Information Statement amounts (lines 6a and 7a).";

/* Line 8b: the total, or the sum of each distribution per unit times the units held that day. */
function distributionsOf(qef: PficQefAmounts): number | undefined {
  if (qef.distributions !== undefined || qef.distributionsPerUnit === undefined)
    return qef.distributions;
  return sum(...qef.distributionsPerUnit.map((each) => each.amountPerUnit * each.units));
}

/* The QEF's totals, or why they cannot be figured. */
export function qefTotals(qef: PficQefAmounts): QefTotals | string {
  const rest = {
    distributions: distributionsOf(qef),
    disposedSharesIncome: qef.disposedSharesIncome,
  };
  const perDay = qef.perUnitPerDay;
  if (perDay !== undefined) {
    const unitDays = qef.unitDays;
    if (unitDays === undefined) return NO_UNIT_DAYS;
    const share = (factor: number | undefined) =>
      factor === undefined ? undefined : factor * unitDays;
    return {
      ...rest,
      ordinaryEarnings: perDay.ordinaryEarnings * unitDays,
      netCapitalGain: perDay.netCapitalGain * unitDays,
      ordinaryEarningsExcluded: share(perDay.ordinaryEarningsExcluded),
      netCapitalGainExcluded: share(perDay.netCapitalGainExcluded),
    };
  }
  if (qef.ordinaryEarnings === undefined || qef.netCapitalGain === undefined) return NO_AMOUNTS;
  return {
    ...rest,
    ordinaryEarnings: qef.ordinaryEarnings,
    netCapitalGain: qef.netCapitalGain,
    ordinaryEarningsExcluded: qef.ordinaryEarningsExcluded,
    netCapitalGainExcluded: qef.netCapitalGainExcluded,
  };
}
