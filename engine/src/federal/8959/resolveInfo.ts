import { isW2FactKey, type W2FactValue } from "../../facts/index.js";
import { sum } from "../../money.js";
import {
  factsInCategory,
  filingStatusOf,
  resolveMustFile,
  sumW2Box,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { resolve4137Info } from "../4137/resolveInfo.js";
import { resolveScheduleSEInfo, selfEmploymentIncome } from "../schedule-se/resolveInfo.js";
import type { Form8959FilingInfo } from "./filingInfo.js";
import { ADDITIONAL_MEDICARE_THRESHOLDS, SINGLE_W2_MEDICARE_WAGES_LIMIT } from "./lines.js";

/*
 * irs-8959-inst-2025::sec::who-must-file::b01: Medicare wages on any single W-2 over
 * $200,000, or Medicare wages plus self-employment income (Schedule SE line 6) over
 * the filing-status threshold. Medicare wages include the tips on Form 4137 line 6
 * (::who-must-file::b01), both spouses' on a joint return. RRTA, Form 8919 and a
 * spouse's Schedule SE have no facts. With no filing status or an open Schedule SE
 * the question stays open.
 */
export function resolve8959Info(inputs: ResolverInputs): Form8959FilingInfo {
  const w2MedicareWages = sumW2Box(inputs, "box5");
  const medicareWages = sum(w2MedicareWages, resolve4137Info(inputs).tipsSubjectToMedicareTotal);
  const w2s = factsInCategory(inputs, "wages").filter((row) => isW2FactKey(row.key));
  const overOneW2 = w2s.some(
    (row) => sum((row.value as W2FactValue).box5) > SINGLE_W2_MEDICARE_WAGES_LIMIT,
  );
  const seIncome = selfEmploymentIncome(resolveScheduleSEInfo(inputs));
  const status = filingStatusOf(inputs);
  // With no filing status yet, a total under every threshold (or over all of them) still decides.
  const thresholds = Object.values(ADDITIONAL_MEDICARE_THRESHOLDS);
  const total = medicareWages + (seIncome ?? 0);
  const lowest = status ? ADDITIONAL_MEDICARE_THRESHOLDS[status] : Math.min(...thresholds);
  const highest = status ? ADDITIONAL_MEDICARE_THRESHOLDS[status] : Math.max(...thresholds);
  const threshold = status ? ADDITIONAL_MEDICARE_THRESHOLDS[status] : undefined;
  const overThreshold = total > highest;
  const decided = overOneW2 || overThreshold || (seIncome !== undefined && total <= lowest);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8959",
    fallbacks: !decided
      ? []
      : [
          {
            rule: `fallback: a W-2 box 5 over $200,000 (${overOneW2}), or Medicare wages $${medicareWages} + self-employment income $${seIncome ?? 0} > $${threshold ?? "?"}`,
            value: overOneW2 || overThreshold,
            triggeredByFactKeys: w2s.map((row) => row.key),
          },
        ],
  });
  return {
    mustFile: { "form-8959": resolution },
    w2MedicareWagesTotal: w2MedicareWages as Form8959FilingInfo["w2MedicareWagesTotal"],
    w2MedicareTaxWithheld: sumW2Box(inputs, "box6") as Form8959FilingInfo["w2MedicareTaxWithheld"],
  };
}
