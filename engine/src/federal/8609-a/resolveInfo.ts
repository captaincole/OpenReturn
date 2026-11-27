import {
  getLowIncomeHousingBuildingFacts,
  type LowIncomeHousingBuildingFact,
} from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { COMPLIANCE_PERIOD_YEARS, form8609ACopy, yearOfCompliancePeriod } from "./copies.js";
import type { Form8609AFilingInfo } from "./filingInfo.js";

/* "Must be filed by the building owner for each year of the 15-year compliance period" (general-instructions::b01). */
function inCompliancePeriod(fact: LowIncomeHousingBuildingFact): boolean {
  const year = yearOfCompliancePeriod(fact.value.form8609.firstCreditYear);
  return year >= 1 && year <= COMPLIANCE_PERIOD_YEARS;
}

/*
 * Who files: "Form 8609-A is filed by a building owner to report compliance
 * with the low-income housing provisions and calculate the low-income housing
 * credit ... for each year of the 15-year compliance period. File one Form
 * 8609-A for the allocation(s) for the acquisition of an existing building and
 * a separate Form 8609-A for the allocation(s) for rehabilitation expenditures"
 * (irs-8609a-inst-2025::sec::general-instructions::b01). One copy for each
 * building fact whose 2025 is in its compliance period; the explicit decision
 * still wins. A partner, shareholder or beneficiary files only Form 8586.
 */
export function resolve8609AInfo(inputs: ResolverInputs): Form8609AFilingInfo {
  const buildings = getLowIncomeHousingBuildingFacts(inputs.facts).filter(inCompliancePeriod);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8609_a",
    fallbacks: [
      {
        rule: `fallback: ${buildings.length} low-income housing building(s) in their compliance period`,
        value: buildings.length > 0,
        triggeredByFactKeys: buildings.map((fact) => fact.key),
      },
    ],
  });
  if (mustFile.value !== true) return { mustFile: { "form-8609-a": mustFile } };
  const copies = buildings.map((fact) => form8609ACopy(fact.key, fact.value));
  return {
    mustFile: { "form-8609-a": mustFile },
    missingInputs: { "form-8609-a": copies.flatMap((copy) => copy.waitingOn ?? []) },
    form8609ACopies: copies,
  };
}
