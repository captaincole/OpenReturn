import { businessesOnReturn } from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8829FilingInfo } from "./filingInfo.js";
import { homeOfficeActualOpen } from "./lines.js";

const MUST_FILE_KEY = "decisions.scope.must_file_8829";

/*
 * irs-8829-inst-2025::sec::general-instructions::b01: Form 8829 figures the
 * allowable expenses for business use of the home for Schedule C, one form for
 * each home. A business whose home office is by actual expenses
 * (homeOfficeActual) files it; one by the simplified method does not. The fact
 * waits while it does not say whether the taxpayer owns the home or whether all
 * the business's gross income is from the home (line 8).
 */
export function resolve8829Info(inputs: ResolverInputs): Form8829FilingInfo {
  const status = filingStatusOf(inputs);
  const joint = status === undefined || status === "married_filing_jointly";
  const withOffice = businessesOnReturn(inputs.facts, joint).businesses.filter(
    (business) => business.value.homeOfficeActual !== undefined,
  );
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: MUST_FILE_KEY,
    fallbacks: [
      {
        rule: `fallback: ${withOffice.length} business with a home office by actual expenses`,
        value: withOffice.length > 0,
        triggeredByFactKeys: withOffice.map((business) => business.key),
      },
    ],
  });
  const open = withOffice.filter((business) =>
    homeOfficeActualOpen(business.value.homeOfficeActual!),
  );
  return {
    mustFile: { "form-8829": resolution },
    missingInputs: {
      "form-8829": missingInputs(
        Object.fromEntries(open.map((business) => [business.key, undefined])),
      ),
    },
    form8829Businesses: withOffice.map((business) => business.value),
  };
}
