/*
 * The California passive credit facts as rows of the federal Worksheets 1 to
 * 4, which FTB 3801-CR uses "using California amounts"
 * (ca-3801cr-inst-2025::sec::specific-line-instructions::b01). Each fact
 * becomes a source of the federal worksheet code (federal/8582-cr/worksheets.ts),
 * so the worksheet choice and Worksheets 5 to 9 are the federal form's own.
 */

import {
  CA_LOW_INCOME_HOUSING_CODE,
  CA_ORPHAN_DRUG_CODE,
  isCaPassiveCreditCode,
  type CaPassiveCreditCode,
  type CaPassiveCreditFact,
  type CaPassiveCreditFactValue,
  type PassiveCreditActivity,
} from "../../../facts/index.js";
import { TAX_YEAR } from "../../../federal/3800/credits.js";
import type { PassiveSource } from "../../../federal/8582-cr/worksheets.js";
import { roundDollars } from "../../../money.js";

/* A worksheet row with its California credit code. */
export type CaPassiveSource = PassiveSource & { code: CaPassiveCreditCode };

/*
 * worksheets.ts sends a credit on the federal low-income housing line (Form
 * 3800 Part III line 4d) to Worksheet 2 or 3 by its 1990 answer; the
 * California low-income housing credit takes the same worksheets
 * (ca-3801cr-inst-2025::sec::line-2a-through-line-2c::b01, ::line-3a-through-line-3c::b01).
 * Any other California credit goes on Worksheet 1 or 4 by its activity
 * (::line-1a-through-line-1c::b01, ::line-4a-through-line-4c::b01).
 */
const FEDERAL_LOW_INCOME_HOUSING_LINE = "4d";
const lineOf = (code: CaPassiveCreditCode) =>
  code === CA_LOW_INCOME_HOUSING_CODE ? FEDERAL_LOW_INCOME_HOUSING_LINE : `ftb-${code}`;

/* A column (b) row: the year it arose is not on the form; worksheets.ts only needs it to be a carryover. */
const PRIOR_YEAR = TAX_YEAR - 1;

const isActivity = (value: unknown): value is PassiveCreditActivity => {
  const activity = value as Partial<PassiveCreditActivity> | undefined;
  return (
    typeof activity?.name === "string" &&
    activity.name.trim() !== "" &&
    typeof activity.rentalRealEstate === "boolean"
  );
};

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/*
 * The source of one fact, or undefined when the fact is not complete: a code
 * of Who Must File, a column, an amount of 0 or more and an activity. The
 * orphan drug credit is repealed: only its carryover (code 185) is claimed
 * (ca-3801cr-inst-2025::sec::c-who-must-file::b01), so it has no column (a).
 */
export function caPassiveSourceOf(fact: CaPassiveCreditFact): CaPassiveSource | undefined {
  const value: Partial<CaPassiveCreditFactValue> = fact.value ?? {};
  const { creditCode, column, amount, activity } = value;
  if (!isCaPassiveCreditCode(creditCode) || !isAmount(amount) || !isActivity(activity)) {
    return undefined;
  }
  const base = {
    line: lineOf(creditCode),
    key: fact.key,
    amount: roundDollars(amount),
    passive: true,
    activity,
    code: creditCode,
  };
  if (column === "current" && creditCode !== CA_ORPHAN_DRUG_CODE) return base;
  if (column !== "prior_year_unallowed") return undefined;
  const election = value.basisIncreaseElection;
  return {
    ...base,
    originYear: PRIOR_YEAR,
    changed: false,
    // Line 21 is whole dollars; worksheets.ts lowers column (b) by the same amount.
    basisIncreaseElection: election && { ...election, amount: roundDollars(election.amount) },
  };
}

/* A row with an amount: the form takes it (worksheets.ts drops a row of 0). */
export const hasCredit = (source: CaPassiveSource) =>
  typeof source.amount === "number" && source.amount > 0;
