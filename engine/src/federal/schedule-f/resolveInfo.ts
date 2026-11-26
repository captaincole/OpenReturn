import { farmsOnReturn, type FarmFactValue } from "../../facts/index.js";
import {
  filingStatusOf,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { depreciationWaits } from "./expenses.js";
import type { ScheduleFFilingInfo } from "./filingInfo.js";
import { incomeWaits, inventoryMethodWaits } from "./income.js";
import { farmAtRiskWaits, isLoss, profitBeforeLossRules } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_schedule_f";

/*
 * A spouse's farm is on this return only when filing jointly; an unknown
 * status counts it until the status is known, as for Schedule C.
 */
export function farmsForReturn(inputs: ResolverInputs) {
  const status = filingStatusOf(inputs);
  return farmsOnReturn(inputs.facts, status === undefined || status === "married_filing_jointly");
}

/*
 * An answer the farm's lines need is missing: line C, line E, line F (and G
 * after a Yes), the CCC loan election, the inventory valuation method for the
 * line 49 footnote, whether line 14 needs Form 4562, box 36 for a loss, or
 * Form 6198's amounts at risk with box 36b.
 */
export function farmAnswersMissing(farm: FarmFactValue): boolean {
  const before = profitBeforeLossRules(farm);
  return (
    farm.accountingMethod === undefined ||
    farm.materiallyParticipated === undefined ||
    farm.paymentsRequire1099 === undefined ||
    (farm.paymentsRequire1099 === true && farm.filedRequired1099 === undefined) ||
    incomeWaits(farm) ||
    inventoryMethodWaits(farm) ||
    depreciationWaits(farm) ||
    (farm.materiallyParticipated === true &&
      isLoss(before) &&
      farm.allInvestmentAtRisk === undefined) ||
    farmAtRiskWaits(farm)
  );
}

/*
 * irs-1040sf-inst-2025::sec::general-instructions::b01: "Use Schedule F (Form
 * 1040) to report farm income and expenses", one for each farm (a qualified
 * joint venture files one for each spouse, ::qualified-joint-venture-qjv::b01).
 * A farm fact on the return files it; a fact that cannot be read leaves the
 * question open, so Cade asks again. The explicit decision still wins.
 */
export function resolveScheduleFInfo(inputs: ResolverInputs): ScheduleFFilingInfo {
  const { farms, malformedKeys } = farmsForReturn(inputs);
  const open = malformedKeys.length > 0;
  const fallback = {
    rule: "fallback: a farm fact (Schedule F)",
    value: farms.length > 0,
    triggeredByFactKeys: farms.map((farm) => farm.key),
  };
  return {
    mustFile: {
      "schedule-f": resolveMustFile(inputs.decisionByKey, {
        explicitKey: MUST_FILE_KEY,
        fallbacks: open ? [] : [fallback],
      }),
    },
    missingInputs: {
      "schedule-f": missingInputs(
        Object.fromEntries([
          ...malformedKeys.map((key) => [key, undefined]),
          ...farms
            .filter((farm) => farmAnswersMissing(farm.value))
            .map((farm) => [farm.key, undefined]),
        ]),
      ),
    },
    farms,
  };
}

/* Schedule SE and the forms that add farm income wait while Schedule F's must-file answer is open. */
export function scheduleFOpen(inputs: ResolverInputs): boolean {
  return resolveScheduleFInfo(inputs).mustFile?.["schedule-f"]?.value === undefined;
}
