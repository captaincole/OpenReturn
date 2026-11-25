/*
 * Who files Schedule D (540). FTB 3805E reads it too: a capital asset
 * installment sale is a line 1 row whenever this schedule files.
 */

import {
  CAPITAL_LOSS_CARRYOVER_KEYS,
  CA_CAPITAL_LOSS_CARRYOVER_KEY,
  californiaBasisKeyOf,
  printsShareCount,
  readInstallmentSaleFacts,
  type TradeFactValue,
} from "../../../facts/index.js";
import type { MustFileResolution } from "../../../filingInfo.js";
import { sum } from "../../../money.js";
import { num, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import { differsThisYear } from "../3805e/sale.js";
import type { ScheduleD1FilingInfo } from "../schedule-d-1/filingInfo.js";
import { resolveScheduleD1Info } from "../schedule-d-1/resolveInfo.js";
import type { CaliforniaSale } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_schedule_d_ca";
export const FILES_540_KEY = "decisions.scope.must_file_ca_540";

export interface SaleWithBases {
  californiaBasisKey: string;
  federalBasis: number | undefined;
  californiaBasis: number | undefined;
  sale: CaliforniaSale;
}

/* Column (a), as Form 8949 prints it: "100 sh Z CO" (the form's example: "100 shares of “Z” Co."). */
function describeSale(trade: TradeFactValue): string {
  if (printsShareCount(trade.description) || trade.quantity === undefined) {
    return trade.description;
  }
  return `${trade.quantity} sh ${trade.description}`;
}

/*
 * ca-540-sched-d-inst-2025::sec::line-1::b01, "List each capital asset
 * transaction": every sale on the federal return, with its California basis
 * where a fact states one (::line-1::b02), else the federal basis. The boxed
 * trades and the fact keys are built in one loop (partitionTrades), so index i
 * of each is the same sale.
 */
export function salesWithBases(inputs: ResolverInputs): SaleWithBases[] {
  return inputs.trades.boxed.map((boxed, index) => {
    const californiaBasisKey = californiaBasisKeyOf(inputs.trades.factKeys[index]);
    const californiaBasis = num(inputs, californiaBasisKey);
    return {
      californiaBasisKey,
      federalBasis: boxed.basis,
      californiaBasis,
      sale: {
        description: describeSale(boxed.trade),
        salesPrice: boxed.trade.proceeds,
        basis: californiaBasis ?? boxed.basis,
        adjusted: (boxed.trade.adjustmentAmount ?? 0) !== 0,
      },
    };
  });
}

/* A capital asset installment sale with a form this year whose California amounts differ (3805e/sale.ts). */
function installmentSalesThatDiffer(inputs: ResolverInputs): string[] {
  return readInstallmentSaleFacts(inputs.facts)
    .sales.filter(({ key, value }) => value.use === "capital_asset" && differsThisYear(key, value))
    .map(({ key }) => key);
}

type Section1231 = ScheduleD1FilingInfo["californiaSection1231Gain"];

/*
 * A section 1231 gain that goes to Schedule D is a capital gain on both returns:
 * when California's (Schedule D-1 line 7 or 9) is not the federal one (Form 4797
 * to federal Schedule D line 11), the capital gains differ (::purpose::b01).
 */
function section1231Fallback(section1231: Section1231, files540: boolean) {
  const differs = files540 && section1231?.differs === true;
  return {
    rule: `fallback: Form 540 files (${files540}) and the Schedule D-1 section 1231 gain differs from the federal Form 4797 gain (${differs})`,
    value: differs,
    triggeredByFactKeys: [],
    triggeredByDecisionKeys: [FILES_540_KEY],
  };
}

/*
 * ca-540-sched-d-inst-2025::sec::purpose::b01: use the schedule "only if there
 * is a difference between your California and federal capital gains and
 * losses". A fact shows one: a California carryover from 2024 that is not the
 * federal carryover (both short and long term), a sale whose California basis
 * is not its federal basis, a capital asset installment sale whose California
 * amounts are not its federal ones (its FTB 3805E gain can differ), or a
 * Schedule D-1 section 1231 gain that is not the federal one. A capital gain
 * alone files nothing. The schedule goes with Form 540.
 */
export function scheduleDCaMustFile(inputs: ResolverInputs): MustFileResolution {
  const files540 = inputs.decisionByKey.get(FILES_540_KEY) === true;
  const federalCarryover = sum(
    ...Object.values(CAPITAL_LOSS_CARRYOVER_KEYS).map((key) => num(inputs, key)),
  );
  const californiaCarryover = num(inputs, CA_CAPITAL_LOSS_CARRYOVER_KEY);
  const differentBases = salesWithBases(inputs).filter(
    (sale) => sale.californiaBasis !== undefined && sale.californiaBasis !== sale.federalBasis,
  );
  const installments = installmentSalesThatDiffer(inputs);
  return resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: Form 540 files (${files540}) and the California capital loss carryover ($${californiaCarryover ?? "none"}) is not the federal carryover ($${federalCarryover})`,
        value:
          files540 && californiaCarryover !== undefined && californiaCarryover !== federalCarryover,
        triggeredByFactKeys: [CA_CAPITAL_LOSS_CARRYOVER_KEY],
        triggeredByDecisionKeys: [FILES_540_KEY],
      },
      {
        rule: `fallback: Form 540 files (${files540}) and ${differentBases.length} sale(s) have a California basis that is not the federal basis`,
        value: files540 && differentBases.length > 0,
        triggeredByFactKeys: differentBases.map((sale) => sale.californiaBasisKey),
        triggeredByDecisionKeys: [FILES_540_KEY],
      },
      {
        rule: `fallback: Form 540 files (${files540}) and ${installments.length} capital asset installment sale(s) state California amounts that are not the federal ones`,
        value: files540 && installments.length > 0,
        triggeredByFactKeys: installments,
        triggeredByDecisionKeys: [FILES_540_KEY],
      },
      section1231Fallback(resolveScheduleD1Info(inputs).californiaSection1231Gain, files540),
    ],
  });
}
