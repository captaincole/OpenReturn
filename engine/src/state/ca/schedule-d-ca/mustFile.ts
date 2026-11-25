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
import { californiaAmountsDiffer } from "../3805e/lines.js";
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

/* A capital asset installment sale whose California amounts differ (FTB 3805E, 3805e/lines.ts). */
function installmentSalesThatDiffer(inputs: ResolverInputs): string[] {
  return readInstallmentSaleFacts(inputs.facts)
    .sales.filter(({ value }) => value.use === "capital_asset" && californiaAmountsDiffer(value))
    .map(({ key }) => key);
}

/*
 * ca-540-sched-d-inst-2025::sec::purpose::b01: use the schedule "only if there
 * is a difference between your California and federal capital gains and
 * losses". A fact shows one: a California carryover from 2024 that is not the
 * federal carryover (both short and long term), a sale whose California basis
 * is not its federal basis, or a capital asset installment sale whose
 * California amounts are not its federal ones (its FTB 3805E gain can differ).
 * A capital gain alone files nothing. The schedule goes with Form 540.
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
    ],
  });
}
