import {
  ELDERLY_OR_DISABLED_KEYS,
  ROTH_IRA_CODES,
  SPOUSE_KEYS,
  hasDistributionCode,
  isRetirementDistributionFactKey,
  type RetirementDistributionFactValue,
} from "../../facts/index.js";
import { bornBeforeJan2_1961, filingStatusOf } from "../../filingInfoResolvers.js";
import { roundDollars, sum } from "../../money.js";
import {
  factsInCategory,
  missingInputs,
  resolveMustFile,
  text,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { disabilityPensions, disabilityWages } from "../1040/disabilityPensions.js";
import { rowTaxable } from "../1040/resolveInfo.js";
import { agiFloor } from "../schedule-eic/possible.js";
import type { ScheduleRFilingInfo } from "./filingInfo.js";

type Person = "taxpayer" | "spouse";

const RETIRED_KEY: Record<Person, string> = {
  taxpayer: ELDERLY_OR_DISABLED_KEYS.taxpayerRetiredOnDisability,
  spouse: ELDERLY_OR_DISABLED_KEYS.spouseRetiredOnDisability,
};

/*
 * A qualified individual (irs-1040sr-inst-2025::sec::qualified-individual::b01):
 * 65 or older at the end of 2025, or under 65, retired on permanent and total
 * disability, with taxable disability income. The disability income is the
 * pensions on Form 1040 line 1h: paid before the employer's minimum retirement
 * age, so before the mandatory retirement age too (disability-income::b02).
 * Disability pay reported on a W-2 has no answer and is not counted. U.S.
 * citizenship or residence is not asked. Undefined while an answer is missing.
 */
function qualified(
  over65: boolean | undefined,
  disabilityIncome: number | undefined,
  retired: boolean | undefined,
): boolean | undefined {
  if (over65 === true) return true;
  if (over65 === undefined || disabilityIncome === undefined) return undefined;
  if (disabilityIncome <= 0) return false;
  return retired;
}

/*
 * Table 1 (irs-1040sr-inst-2025::sec::table-1-income-limits::b01): AGI at or
 * above the limit means no credit. Single, HOH and QSS $17,500; MFJ $20,000
 * with one qualified individual, $25,000 with two; MFS (lived apart) $12,500.
 */
function agiLimit(status: string, qualifiedCount: number): number {
  if (status === "married_filing_jointly") return qualifiedCount > 1 ? 25000 : 20000;
  return status === "married_filing_separately" ? 12500 : 17500;
}

/*
 * AGI's least amount: the EIC's bound (schedule-eic/possible.ts), which leaves
 * out the 1099-Rs, plus each 1099-R's taxable amount that is not from an IRA
 * and not rolled over (Form 1040 lines 1h and 5b only add). Undefined when the
 * EIC's bound has none.
 */
function scheduleRAgiFloor(inputs: ResolverInputs, joint: boolean): number | undefined {
  const floor = agiFloor(inputs, joint);
  if (floor === undefined) return undefined;
  const pensions = factsInCategory(inputs, "retirement")
    .filter((row) => isRetirementDistributionFactKey(row.key))
    .map((row) => row.value as RetirementDistributionFactValue)
    .filter(
      (row) => !row.box7IraSepSimple && !hasDistributionCode(row, [...ROTH_IRA_CODES, "G", "H"]),
    );
  return floor + sum(...pensions.map((row) => roundDollars(rowTaxable(row) ?? 0)));
}

/*
 * Schedule R files to claim the credit for a qualified individual
 * (who-can-take-the-credit::b01). Married people must file jointly, unless they
 * file separately and lived apart all year (married-persons::b01). AGI at or
 * over Table 1's limit, by its least amount from facts, rules the credit out;
 * nontaxable income over its limit shows on line 19 (zero or less).
 */
export function resolveScheduleRInfo(inputs: ResolverInputs): ScheduleRFilingInfo {
  const status = filingStatusOf(inputs);
  const joint = status === "married_filing_jointly";
  const pensions = disabilityPensions(inputs);
  const over65 = (person: Person) =>
    bornBeforeJan2_1961(text(inputs, person === "taxpayer" ? "identity.dob" : SPOUSE_KEYS.dob));
  const income = (person: Person) => disabilityWages(pensions, person);
  const retired = (person: Person) =>
    inputs.factByKey.get(RETIRED_KEY[person]) as boolean | undefined;
  // The retirement question is asked only of a person under 65 with disability income.
  const asksRetired = (person: Person) => over65(person) === false && (income(person) ?? 0) > 0;
  const people: Person[] = joint ? ["taxpayer", "spouse"] : ["taxpayer"];
  const qualifies = people.map((person) =>
    qualified(over65(person), income(person), retired(person)),
  );
  const livedApart = inputs.factByKey.get(SPOUSE_KEYS.livedApartAllYear) as boolean | undefined;
  const statusAllows =
    status === undefined ? undefined : status === "married_filing_separately" ? livedApart : true;
  const anyQualified = qualifies.includes(true)
    ? true
    : qualifies.includes(undefined)
      ? undefined
      : false;
  /*
   * No qualified individual, or a separate return with the spouse in the home,
   * decides it. While an answer is missing the schedule files, so its questions
   * reach the pending list; a qualified individual waits for the filing status,
   * and everyone waits for the dates of birth.
   */
  // AGI's least amount from facts at or above Table 1's limit.
  const floor = scheduleRAgiFloor(inputs, joint);
  const overLimit =
    status !== undefined &&
    floor !== undefined &&
    floor >= agiLimit(status, qualifies.filter((value) => value === true).length);
  const cannot = anyQualified === false || statusAllows === false || overLimit;
  const agesKnown = people.every((person) => over65(person) !== undefined);
  const decided = cannot || (agesKnown && (anyQualified === undefined || status !== undefined));
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_r",
    fallbacks: decided
      ? [
          {
            rule: `fallback: a qualified individual (${anyQualified ?? "answer missing"}) on a return that can take the credit (${statusAllows ?? "answer missing"}), AGI at least $${floor ?? "?"}`,
            value: !cannot,
          },
        ]
      : [],
  });
  const disabledBox = people.some((person) => asksRetired(person) && retired(person) === true);
  const physician = inputs.factByKey.get(ELDERLY_OR_DISABLED_KEYS.physicianStatementOnFile) as
    boolean | undefined;
  const nontaxable = inputs.factByKey.get(ELDERLY_OR_DISABLED_KEYS.nontaxablePensions);
  return {
    mustFile: { "schedule-r": resolution },
    missingInputs: {
      "schedule-r": missingInputs({
        ...Object.fromEntries(
          people.filter(asksRetired).map((person) => [RETIRED_KEY[person], retired(person)]),
        ),
        ...(status === "married_filing_separately"
          ? { [SPOUSE_KEYS.livedApartAllYear]: livedApart }
          : {}),
        // Part II: asked when a box for a person retired on disability applies.
        ...(disabledBox ? { [ELDERLY_OR_DISABLED_KEYS.physicianStatementOnFile]: physician } : {}),
        [ELDERLY_OR_DISABLED_KEYS.nontaxablePensions]:
          typeof nontaxable === "number" ? nontaxable : undefined,
      }),
    },
    scheduleRTaxpayerRetiredOnDisability: asksRetired("taxpayer") ? retired("taxpayer") : undefined,
    scheduleRSpouseRetiredOnDisability:
      joint && asksRetired("spouse") ? retired("spouse") : undefined,
    scheduleRTaxpayerDisabilityIncome: income("taxpayer"),
    scheduleRSpouseDisabilityIncome: joint ? income("spouse") : undefined,
    scheduleRPhysicianStatementOnFile: physician,
    scheduleRNontaxablePensions: typeof nontaxable === "number" ? nontaxable : undefined,
  };
}
