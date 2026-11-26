import { farmOwnerOf, farmsOnReturn, type FarmFactValue } from "../../facts/index.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";
import { netFarmProfit } from "../schedule-f/lines.js";
import type { QbiBusiness } from "./filingInfo.js";

/*
 * A farm as a QBI trade or business (Schedule F line 34), and the cooperative
 * patron rule a farm's Forms 1099-PATR bring.
 */

export type FarmOnReturn = { key: string; value: FarmFactValue; owner: "taxpayer" | "spouse" };

export function qbiFarms(inputs: ResolverInputs): FarmOnReturn[] {
  return farmsOnReturn(inputs.facts, filingStatusOf(inputs) === "married_filing_jointly").farms.map(
    (farm) => ({ ...farm, owner: farmOwnerOf(farm.value) }),
  );
}

/* Schedule F line 3a holds cooperative distributions: the farmer is a cooperative's patron. */
const isPatron = (farm: FarmFactValue) => (farm.cooperativeDistributions ?? 0) > 0;

/*
 * irs-8995-inst-2025::sec::who-can-take-the-deduction::b01: Form 8995 only if
 * "You aren't a patron in a specified agricultural or horticultural
 * cooperative." A farm's line 3a comes from Forms 1099-PATR, and the farm fact
 * does not say whether the cooperative is a specified one, so any line 3a
 * amount takes the deduction to Form 8995-A, which at or below the threshold
 * gives the Form 8995 result (irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b01).
 */
export function hasCooperativePatronFarm(inputs: ResolverInputs): boolean {
  return qbiFarms(inputs).some((farm) => isPatron(farm.value));
}

/* The patron farms whose qualified payments (Form 1099-PATR box 7) are not stated: Cade asks. */
export function farmsWithoutQualifiedPaymentsAnswer(inputs: ResolverInputs): string[] {
  return qbiFarms(inputs)
    .filter((farm) => isPatron(farm.value) && farm.value.cooperativeQualifiedPayments === undefined)
    .map((farm) => farm.key);
}

/*
 * irs-8995-inst-2025::sec::determining-your-qualified-business::b07: "If you
 * received qualified payments reported to you on Form 1099-PATR from a
 * specified agricultural or horticultural cooperative, you must reduce your QBI
 * by the patron reduction and use Form 8995-A". The reduction is the lesser of
 * 9% of the QBI allocable to qualified payments or 50% of the W-2 wages
 * allocable to them (irs-8995a-inst-2025::sec::line-14::b01), on Schedule D
 * (Form 8995-A); no fact gives that allocation.
 */
export const PATRON_REDUCTION_GAP =
  "The farm received qualified payments from a specified agricultural or horticultural cooperative (Form 1099-PATR box 7), so Form 8995-A line 14 takes the patron reduction from Schedule D (Form 8995-A), which needs the QBI and W-2 wages allocable to those payments; not modeled.";

export interface FarmQbiContext {
  /* The taxpayer's own businesses and farms: one alone is the owner's only business. */
  taxpayerCount: number;
  /* Every Schedule C business and farm on the return. */
  activities: number;
  planDeduction: number | undefined;
  /* The plan deduction names no business while two or more are on the return. */
  planGap: string | undefined;
}

/*
 * A farm's QBI row. Its QBI waits while a patron's qualified payments are not
 * stated, and is a gap when there are some (the patron reduction).
 */
export function farmQbiBusiness(farm: FarmOnReturn, context: FarmQbiContext): QbiBusiness {
  const { key, value, owner } = farm;
  const line34 = netFarmProfit(value, key);
  const qualifiedPayments = isPatron(value) ? value.cooperativeQualifiedPayments : 0;
  const patronGap = (qualifiedPayments ?? 0) > 0 ? PATRON_REDUCTION_GAP : undefined;
  return {
    factKey: key,
    kind: "business",
    owner,
    name: value.activity,
    ein: value.ein,
    // Farming is a section 162 trade or business and not on the SSTB list (irs-8995-inst-2025::sec::determining-your-qualified-trades-or::b01, ::b04).
    specifiedService: false,
    netProfit:
      line34.kind === "amount" && qualifiedPayments !== undefined ? line34.amount : undefined,
    ownersOnlyBusiness: owner === "taxpayer" && context.taxpayerCount === 1,
    retirementPlanDeduction: context.activities === 1 ? context.planDeduction : undefined,
    qbiGap: line34.kind === "gap" ? line34.reason : (patronGap ?? context.planGap),
    w2WagesPaid: value.w2WagesPaid,
    qualifiedPropertyUbia: value.qualifiedPropertyUbia,
  };
}
