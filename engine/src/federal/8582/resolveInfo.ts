import {
  isW2FactKey,
  RENTAL_KEYS,
  rentalsOnReturn,
  SPOUSE_KEYS,
  type RentalFactValue,
} from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { sum } from "../../money.js";
import {
  factsInCategory,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import {
  booleanFact,
  isPassiveActivity,
  isRentalActivity,
  isSelfRentalNetIncome,
  needsProfessionalAnswer,
  spousePropertiesOnReturn,
} from "../rentals/passive.js";
import { netIncomeOrLoss } from "../schedule-e/lines.js";
import { placementOf, type ActivitiesInfo } from "./activities.js";
import type { Form8582FilingInfo } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8582";

/* Schedule E Part I has three columns; Form 8582 reads no property past them. */
const SCHEDULE_E_COLUMNS = 3;

/* A missing passive answer that is on the property, not the return's professional answer. */
function passiveAnswerOnProperty(
  value: RentalFactValue,
  realEstateProfessional: boolean | undefined,
): boolean {
  return (
    value.propertyType === "royalties" ||
    isRentalActivity(value) !== true ||
    realEstateProfessional !== undefined
  );
}

/*
 * The properties whose place in Part IV or V waits, or that the engine does not
 * model (irs-8582-inst-2025::sec::part-iv-2::b01 and placementOf): ask for the
 * fact again, so the return is not ready while the form is blank.
 */
function undecidedKeys(
  properties: Array<{ key: string; value: RentalFactValue; passive?: boolean }>,
  info: ActivitiesInfo,
  realEstateProfessional: boolean | undefined,
): string[] {
  const onSchedule = properties.slice(0, SCHEDULE_E_COLUMNS).filter((property) => {
    const placement = placementOf(property, info, netIncomeOrLoss(property.value));
    if (placement === "property") return true;
    return (
      placement === "passive" && passiveAnswerOnProperty(property.value, realEstateProfessional)
    );
  });
  const pastColumns = properties.slice(SCHEDULE_E_COLUMNS);
  return [...onSchedule, ...pastColumns].map((property) => property.key);
}

// MANUAL EDIT: line 6 adds back excluded adoption benefits (irs-8582-inst-2025::sec::line-6::b01).
function adoptionBenefits(inputs: ResolverInputs): number | undefined {
  const amounts = factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .flatMap(
      (row) => (row.value as { box12?: Array<{ code: string; amount: number }> }).box12 ?? [],
    )
    .filter((entry) => entry.code.toUpperCase() === "T")
    .map((entry) => entry.amount);
  return amounts.length > 0 ? sum(...amounts) : undefined;
}

/* Expenses or a prior-year unallowed loss: the activity has passive activity deductions. */
function hasDeductions(property: RentalFactValue): boolean {
  const { otherDescription: _description, ...amounts } = property.expenses ?? {};
  return sum(...Object.values(amounts), property.priorYearUnallowedLoss) > 0;
}

/*
 * irs-8582-inst-2025::sec::who-must-file::b01: Form 8582 is filed by anyone with
 * passive activity deductions, including prior-year unallowed losses. The fallback
 * files it for any passive property with expenses or a prior-year loss. The
 * exception (rental real estate with active participation only, a loss of $25,000
 * or less, MAGI of $100,000 or less, ...) is not modeled: when it applies, the form
 * allows the whole loss (Part II), so filing it changes no amount.
 */
export function resolve8582Info(inputs: ResolverInputs): Form8582FilingInfo {
  const status = filingStatusOf(inputs);
  const { properties, malformedKeys } = rentalsOnReturn(
    inputs.facts,
    spousePropertiesOnReturn(status),
  );
  const realEstateProfessional = booleanFact(
    inputs.factByKey.get(RENTAL_KEYS.realEstateProfessional),
  );
  const passive = properties.map((property) => ({
    ...property,
    passive: isPassiveActivity(property.value, realEstateProfessional),
  }));
  const open = passive.filter((property) => property.passive === undefined);
  // MANUAL EDIT: a self-rental's net income and its deductions stay off Form 8582 (disclosure-requirement::b05).
  const filing = passive.filter(
    (property) =>
      property.passive &&
      hasDeductions(property.value) &&
      isSelfRentalNetIncome(property.value, netIncomeOrLoss(property.value)) !== true,
  );
  const hasRental = needsProfessionalAnswer(properties.map((property) => property.value));
  const livedApart = booleanFact(inputs.factByKey.get(SPOUSE_KEYS.livedApartAllYear));
  const info: ActivitiesInfo = { filingStatus: status, livedApartFromSpouseAllYear: livedApart };
  // MANUAL EDIT: MFS spouses who lived together at any time use Part V, not Part IV (part-iv-2::b01).
  const asksLivedApart =
    status === "married_filing_separately" &&
    passive.some(
      (property) =>
        property.passive &&
        property.value.propertyType !== "royalties" &&
        isRentalActivity(property.value) !== false &&
        property.value.activeParticipation === true,
    );
  return {
    adoptionBenefits: adoptionBenefits(inputs),
    mustFile: {
      "form-8582": resolveMustFile(inputs.decisionByKey, {
        explicitKey: MUST_FILE_KEY,
        fallbacks:
          malformedKeys.length > 0 || (open.length > 0 && filing.length === 0)
            ? []
            : [
                {
                  rule: "fallback: a passive rental or royalty with deductions or a prior-year loss",
                  value: filing.length > 0,
                  triggeredByFactKeys: filing.map((property) => property.key),
                },
              ],
      }),
    },
    missingInputs: {
      "form-8582": missingInputs({
        ...Object.fromEntries(malformedKeys.map((key) => [key, undefined])),
        ...(hasRental ? { [RENTAL_KEYS.realEstateProfessional]: realEstateProfessional } : {}),
        ...Object.fromEntries(
          undecidedKeys(passive, info, realEstateProfessional).map((key) => [key, undefined]),
        ),
        ...(asksLivedApart ? { [SPOUSE_KEYS.livedApartAllYear]: livedApart } : {}),
      }),
    },
  };
}
