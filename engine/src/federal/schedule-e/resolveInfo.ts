import { RENTAL_KEYS, rentalsOnReturn, type RentalFactValue } from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import {
  booleanFact,
  isPassiveActivity,
  needsProfessionalAnswer,
  spousePropertiesOnReturn,
} from "../rentals/passive.js";
import type { PropertyColumn, ScheduleEFilingInfo } from "./filingInfo.js";
import { netIncomeOrLoss, personalUseUnknown } from "./lines.js";

const COLUMNS: PropertyColumn[] = ["a", "b", "c"];

const MUST_FILE_KEY = "decisions.scope.must_file_schedule_e";

/*
 * Lines 1a, 1b and 2 for rental real estate: the address, a type-8 description
 * and the fair-rental days (irs-1040se-inst-2025::sec::line-1a::b01, ::line-1b::b01,
 * ::line-2::b01). A royalty has none of them.
 */
function missingPropertyAnswer(value: RentalFactValue): boolean {
  // Line 19: an "other" expense needs its description (irs-1040se-inst-2025::sec::line-19::b01).
  if ((value.expenses?.other ?? 0) > 0 && !value.expenses?.otherDescription) return true;
  if (value.propertyType === "royalties") return false;
  return (
    value.address === undefined ||
    value.fairRentalDays === undefined ||
    (value.propertyType === "other" && value.otherTypeDescription === undefined)
  );
}

/*
 * A property whose line 1a–2 answers or personal-use days are unstated, or whose
 * line 21 loss waits on the at-risk answer (irs-1040se-inst-2025::sec::line-21::b01):
 * ask for the fact again.
 */
function openPropertyKeys(
  properties: Array<{ key: string; value: RentalFactValue }>,
  professional: boolean | undefined,
): string[] {
  return properties
    .filter(
      ({ value }) =>
        missingPropertyAnswer(value) ||
        personalUseUnknown(value) ||
        (value.allInvestmentAtRisk === undefined && (netIncomeOrLoss(value) ?? 0) < 0) ||
        formerPassiveActivity(value, professional),
    )
    .map((property) => property.key);
}

/*
 * A nonpassive property with a prior-year unallowed loss is a former passive
 * activity (irs-8582-inst-2025::sec::former-passive-activities::b01); its loss is not
 * modeled, so lines 22 and 25 wait (totals.ts columnLoss): ask for it again.
 */
function formerPassiveActivity(value: RentalFactValue, professional: boolean | undefined): boolean {
  return (
    isPassiveActivity(value, professional) === false && (value.priorYearUnallowedLoss ?? 0) > 0
  );
}

/*
 * MANUAL EDIT: line 22 waits on each property's passive status, and lines 22
 * and 43 on the real estate professional answer: ask for them (as Form 8582 does).
 */
function passiveAnswers(
  columns: Array<{ key: string; value: RentalFactValue }>,
  professional: boolean | undefined,
): Record<string, unknown> {
  const hasRental = needsProfessionalAnswer(columns.map(({ value }) => value));
  const open = columns.filter(
    ({ value }) =>
      isPassiveActivity(value, professional) === undefined &&
      (value.propertyType === "royalties" || professional !== undefined),
  );
  return {
    ...(hasRental ? { [RENTAL_KEYS.realEstateProfessional]: professional } : {}),
    ...Object.fromEntries(open.map((property) => [property.key, undefined])),
  };
}

/*
 * irs-1040se-inst-2025::sec::general-instructions::b01: Schedule E reports income
 * or loss from rental real estate and royalties (Part I), and from partnerships,
 * S corporations, estates, trusts and REMICs (Parts II–IV). The engine has facts
 * for Part I only: a rental or royalty property fact files the schedule. A fact
 * whose amounts are not numbers leaves the question open, so Cade asks again.
 * Line A asks every filer about payments that require Form 1099, line B only
 * after a yes (irs-1040se-inst-2025::sec::line-a::b01). A spouse's property is on
 * this return only when filing jointly; an unknown status counts it until known.
 * MANUAL EDIT: on a separate return, the taxpayer's part of a joint property
 * (irs-1040se-inst-2025::sec::income-or-loss-from-rental-real::b01) or half the
 * rents of a community property (irs-pub-504-2025::sec::community-income::b01)
 * belongs here. The fact holds neither share, so a spouse's or joint property
 * files the schedule and waits on its key, as a spouse's Schedule C business does.
 */
export function resolveScheduleEInfo(inputs: ResolverInputs): ScheduleEFilingInfo {
  const status = filingStatusOf(inputs);
  const { properties, spouseKeys, malformedKeys } = rentalsOnReturn(
    inputs.facts,
    spousePropertiesOnReturn(status),
  );
  const paymentsRequire1099 = booleanFact(inputs.factByKey.get(RENTAL_KEYS.paymentsRequire1099));
  const filed1099s = booleanFact(inputs.factByKey.get(RENTAL_KEYS.filedRequired1099s));
  const professional = booleanFact(inputs.factByKey.get(RENTAL_KEYS.realEstateProfessional));
  const files = properties.length + spouseKeys.length > 0;
  const columns = properties.slice(0, COLUMNS.length);
  /*
   * MANUAL EDIT: a fourth property needs another Schedule E, which the engine does not
   * fill (irs-1040se-inst-2025::sec::income-or-loss-from-rental-real::b01): it stays open.
   */
  const overflowKeys = properties.slice(COLUMNS.length).map((property) => property.key);
  return {
    mustFile: {
      "schedule-e": resolveMustFile(inputs.decisionByKey, {
        explicitKey: MUST_FILE_KEY,
        fallbacks:
          malformedKeys.length > 0
            ? []
            : [
                {
                  rule: "fallback: a rental real estate or royalty property fact",
                  value: files,
                  triggeredByFactKeys: [
                    ...properties.map((property) => property.key),
                    ...spouseKeys,
                  ],
                },
              ],
      }),
    },
    missingInputs: {
      "schedule-e": missingInputs({
        ...Object.fromEntries([...malformedKeys, ...spouseKeys].map((key) => [key, undefined])),
        ...Object.fromEntries(
          openPropertyKeys(columns, professional).map((key) => [key, undefined]),
        ),
        ...Object.fromEntries(overflowKeys.map((key) => [key, undefined])),
        ...(files ? { [RENTAL_KEYS.paymentsRequire1099]: paymentsRequire1099 } : {}),
        ...passiveAnswers(columns, professional),
        ...(paymentsRequire1099 === true ? { [RENTAL_KEYS.filedRequired1099s]: filed1099s } : {}),
      }),
    },
    rentalProperties:
      properties.length > 0
        ? columns.map((property, index) => ({
            factKey: property.key,
            column: COLUMNS[index],
            value: property.value,
            passive: isPassiveActivity(property.value, professional),
          }))
        : undefined,
    rentalPropertiesOverflow: properties.length > COLUMNS.length,
    rentalPaymentsRequire1099: paymentsRequire1099,
    rentalFiled1099s: filed1099s,
    realEstateProfessional: professional,
  };
}
