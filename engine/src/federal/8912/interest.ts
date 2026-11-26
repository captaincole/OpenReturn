/*
 * The credit is also interest income: "The current year credit on line 4 ...
 * is deemed to be a payment of qualified stated interest ... treated as
 * taxable interest income paid on the credit allowance date"
 * (irs-8912-inst-2025::sec::line-20::b01). Schedule B line 1 and Form 1040
 * line 2b take the rows below.
 *
 * DECISION (2026-11-26, by the author): the engine adds as interest only the
 * line 20 credit of each held bond for which no Form 1099-INT reports the
 * credit; it adds nothing for line 1, line 3 or a pass-through Part IV.
 * - Form 8912 instructions: "The current year credit on line 4 (or for estates
 *   and trusts, line 6) is deemed to be a payment of qualified stated interest"
 *   (irs-8912-inst-2025::sec::line-20::b01); line 4 adds lines 1 to 3.
 * - Form 1099-INT instructions: "Interest to holders of tax credit bonds. Report
 *   tax credits in amounts of $10 or more allowed from the following tax credit
 *   bonds" in box 1 (irs-1099int-inst-2025::sec::box-1-interest-income::b03); the
 *   Form 1097-BTC instructions: the credit "must be reported as interest income
 *   on a Form 1099-INT or Form 1099-OID"; and line 3 is "the credit carryforward
 *   (from prior years)" (irs-8912-inst-2025::sec::line-3::b01).
 * Each credit is interest once: a Form 1097-BTC credit is already in a Form
 * 1099-INT's box 1, a pass-through credit in the entity's interest on the K-1,
 * and a carryforward in the year the credit arose.
 */

import type { ResolverInputs } from "../../resolverInputs.js";
import { claimingBonds, partIVForm } from "./bonds.js";
import type { BondCreditInterest } from "./filingInfo.js";
import { CALENDAR_2025 } from "./lines.js";
import { files8912, resolve8912Info } from "./resolveInfo.js";

/*
 * A bond bought between credit allowance dates: "the interest accrued as of the
 * date of the purchase ... isn't included as interest ... Instead, the payment
 * of the deemed interest is treated as a return of capital to the extent of the
 * accrued interest" (irs-8912-inst-2025::sec::line-20::b01, ::b02).
 */
const BOUGHT_BETWEEN_DATES_GAP =
  "The bond was bought in 2025 between credit allowance dates, so part of its deemed interest is a return of capital (irs-8912-inst-2025::sec::line-20::b02), and the engine does not have the interest accrued at the purchase.";

const boughtBetweenDates = (acquired: string | undefined) =>
  acquired !== undefined &&
  acquired > CALENDAR_2025.previous &&
  !CALENDAR_2025.dates.includes(acquired);

/*
 * One row for each held bond whose credit no Form 1099-INT reports; the amount
 * waits while the bond's lines or that answer are missing. None when Form
 * 8912 does not file. A credit of 0 adds no row.
 */
export function bondCreditInterest(inputs: ResolverInputs): BondCreditInterest[] {
  if (!files8912(resolve8912Info(inputs))) return [];
  return claimingBonds(inputs)
    .filter((fact) => fact.value.source === "held" && fact.value.creditOnForm1099Int !== true)
    .map((fact): BondCreditInterest => {
      const payerName = fact.value.issuerNameCityState;
      const credit = partIVForm(fact).lines?.line20;
      const answered = fact.value.creditOnForm1099Int === false;
      if (answered && credit !== 0 && boughtBetweenDates(fact.value.acquiredDate)) {
        return { payerName, amount: undefined, gap: BOUGHT_BETWEEN_DATES_GAP };
      }
      return { payerName, amount: answered ? credit : undefined };
    })
    .filter((row) => row.amount !== 0);
}
