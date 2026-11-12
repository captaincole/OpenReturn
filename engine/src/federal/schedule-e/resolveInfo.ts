import { RENTAL_KEYS, rentalsOnReturn } from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { isPassiveActivity } from "../8582/resolveInfo.js";
import type { PropertyColumn, ScheduleEFilingInfo } from "./filingInfo.js";

const COLUMNS: PropertyColumn[] = ["a", "b", "c"];

const booleanFact = (value: unknown) => (typeof value === "boolean" ? value : undefined);

const MUST_FILE_KEY = "decisions.scope.must_file_schedule_e";

/*
 * irs-1040se-inst-2025::sec::general-instructions::b01: Schedule E reports income
 * or loss from rental real estate and royalties (Part I), and from partnerships,
 * S corporations, estates, trusts and REMICs (Parts II–IV). The engine has facts
 * for Part I only: a rental or royalty property fact files the schedule. A fact
 * whose amounts are not numbers leaves the question open, so Cade asks again.
 * Line A asks every filer about payments that require Form 1099, line B only
 * after a yes (irs-1040se-inst-2025::sec::line-a::b01). A spouse's property is on
 * this return only when filing jointly; an unknown status counts it until known.
 */
export function resolveScheduleEInfo(inputs: ResolverInputs): ScheduleEFilingInfo {
  const status = filingStatusOf(inputs);
  const { properties, malformedKeys } = rentalsOnReturn(
    inputs.facts,
    status === undefined || status === "married_filing_jointly",
  );
  const paymentsRequire1099 = booleanFact(inputs.factByKey.get(RENTAL_KEYS.paymentsRequire1099));
  const filed1099s = booleanFact(inputs.factByKey.get(RENTAL_KEYS.filedRequired1099s));
  const professional = booleanFact(inputs.factByKey.get(RENTAL_KEYS.realEstateProfessional));
  const files = properties.length > 0;
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
                  triggeredByFactKeys: properties.map((property) => property.key),
                },
              ],
      }),
    },
    missingInputs: {
      "schedule-e": missingInputs({
        ...Object.fromEntries(malformedKeys.map((key) => [key, undefined])),
        ...(files ? { [RENTAL_KEYS.paymentsRequire1099]: paymentsRequire1099 } : {}),
        ...(paymentsRequire1099 === true ? { [RENTAL_KEYS.filedRequired1099s]: filed1099s } : {}),
      }),
    },
    rentalProperties: files
      ? properties.slice(0, COLUMNS.length).map((property, index) => ({
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
