import {
  CAPITAL_LOSS_CARRYOVER_KEYS,
  CA_CAPITAL_LOSS_CARRYOVER_KEY,
  californiaBasisKeyOf,
  isDividendFactKey,
  printsShareCount,
  type TradeFactValue,
} from "../../../facts/index.js";
import { sum } from "../../../money.js";
import {
  filingStatusOf,
  missingInputs,
  num,
  resolveMustFile,
  sumInvestmentBox,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import type { ScheduleD1FilingInfo } from "../schedule-d-1/filingInfo.js";
import { resolveScheduleD1Info } from "../schedule-d-1/resolveInfo.js";
import type { ScheduleDCaFilingInfo } from "./filingInfo.js";
import { scheduleDCaFigures, type CaliforniaSale } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_schedule_d_ca";
const FILES_540_KEY = "decisions.scope.must_file_ca_540";

interface SaleWithBases {
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
function salesWithBases(inputs: ResolverInputs): SaleWithBases[] {
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
 * federal carryover (both short and long term), or a sale whose California basis
 * is not its federal basis. A capital gain alone files nothing. The schedule goes
 * with Form 540.
 */
export function resolveScheduleDCaInfo(inputs: ResolverInputs): ScheduleDCaFilingInfo {
  const files540 = inputs.decisionByKey.get(FILES_540_KEY) === true;
  const federalCarryovers = Object.values(CAPITAL_LOSS_CARRYOVER_KEYS).map((key) =>
    num(inputs, key),
  );
  const federalCarryover = sum(...federalCarryovers);
  const californiaCarryover = num(inputs, CA_CAPITAL_LOSS_CARRYOVER_KEY);
  const sales = salesWithBases(inputs);
  // California's section 1231 gain (Schedule D-1), figured when Form 4797 files on a Form 540 return.
  const section1231 = resolveScheduleD1Info(inputs).californiaSection1231Gain;
  const differentBases = sales.filter(
    (sale) => sale.californiaBasis !== undefined && sale.californiaBasis !== sale.federalBasis,
  );
  const resolution = resolveMustFile(inputs.decisionByKey, {
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
      section1231Fallback(section1231, files540),
    ],
  });
  const files = resolution.value === true;
  /* Line 6 (::line-6-…::b01): asked when the federal return carries a loss over and no California amount is stated. */
  const asked =
    files && federalCarryover > 0
      ? missingInputs({ [CA_CAPITAL_LOSS_CARRYOVER_KEY]: californiaCarryover })
      : [];
  const distributions = sumInvestmentBox(inputs, "box2a", isDividendFactKey);
  return {
    mustFile: { "schedule-d-ca": resolution },
    missingInputs: { "schedule-d-ca": asked },
    scheduleDCaFigures: files
      ? scheduleDCaFigures({
          sales: sales.map((sale) => sale.sale),
          capitalGainDistributions: distributions > 0 ? distributions : undefined,
          californiaCarryover:
            californiaCarryover !== undefined && californiaCarryover > 0
              ? californiaCarryover
              : undefined,
          californiaCarryoverMissing: asked.length > 0,
          filingStatus: filingStatusOf(inputs),
          section1231Gain: section1231?.gap === undefined ? section1231?.gain : undefined,
          section1231Waits: section1231?.waits,
          section1231Gap: section1231?.gap && `Schedule D-1: ${section1231.gap}`,
        })
      : undefined,
  };
}
