import { RENTAL_KEYS, rentalsOnReturn, type RentalFactValue } from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { sum } from "../../money.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8582FilingInfo } from "./filingInfo.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8582";

/*
 * Whether a property is a passive activity, or undefined while an answer is missing.
 * A rental is passive unless the owner is a real estate professional who materially
 * participated in it (irs-8582-inst-2025::sec::activities-that-are-not-passive::b01, items 1–2);
 * a royalty is passive only when it comes from a trade or business the owner did
 * not materially participate in (royaltyActivity). The other exceptions (an
 * average rental of 7 days or less, a home with personal use) have no facts yet.
 */
export function isPassiveActivity(
  property: RentalFactValue,
  realEstateProfessional: boolean | undefined,
): boolean | undefined {
  if (property.propertyType === "royalties") {
    return property.royaltyActivity === undefined
      ? undefined
      : property.royaltyActivity === "passive";
  }
  if (realEstateProfessional === undefined) return undefined;
  if (!realEstateProfessional) return true;
  return property.materiallyParticipated === undefined
    ? undefined
    : !property.materiallyParticipated;
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
    status === undefined || status === "married_filing_jointly",
  );
  const professional = inputs.factByKey.get(RENTAL_KEYS.realEstateProfessional);
  const realEstateProfessional = typeof professional === "boolean" ? professional : undefined;
  const passive = properties.map((property) => ({
    ...property,
    passive: isPassiveActivity(property.value, realEstateProfessional),
  }));
  const open = passive.filter((property) => property.passive === undefined);
  const filing = passive.filter((property) => property.passive && hasDeductions(property.value));
  const hasRental = properties.some((property) => property.value.propertyType !== "royalties");
  return {
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
        // A royalty's kind, or a professional's material participation: ask for the fact again.
        ...Object.fromEntries(
          open
            .filter(
              (property) =>
                property.value.propertyType === "royalties" || realEstateProfessional !== undefined,
            )
            .map((property) => [property.key, undefined]),
        ),
      }),
    },
  };
}
