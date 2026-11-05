import { isDividendFactKey, readBusinessFacts } from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { sum } from "../../money.js";
import {
  factsInCategory,
  missingInputs,
  resolveMustFile,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { magiUpperBound } from "../8960/mustFile.js";
import { netProfit } from "../schedule-c/lines.js";
import { resolveScheduleSEInfo } from "../schedule-se/resolveInfo.js";
import type { Form8995AFilingInfo, QbiBusiness } from "./filingInfo.js";
import { QBI_LIMITS } from "./lines.js";

/*
 * irs-8995a-inst-2025::sec::who-can-take-the-deduction::b01. The resolver cannot
 * read taxable income, and the engine has no Form 8995, so any Schedule C business
 * (QBI) files 8995-A. At or below the threshold line 13 takes line 3 unreduced,
 * the Form 8995 result. No fact says the taxpayer is a cooperative patron.
 */
export function resolve8995AInfo(inputs: ResolverInputs): Form8995AFilingInfo {
  const divs = factsInCategory(inputs, "investment_income").filter((row) =>
    isDividendFactKey(row.key),
  );
  const reit = sum(...divs.map((row) => (row.value as { box5?: unknown }).box5));
  const { businesses, malformedKeys } = qbiBusinesses(inputs);
  const businessKeys = [...businesses.map((business) => business.factKey), ...malformedKeys];
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8995_a",
    fallbacks: [
      { rule: `fallback: section 199A dividends $${reit} > 0`, value: reit > 0 },
      {
        rule: "fallback: a Schedule C business (qualified business income)",
        value: businessKeys.length > 0,
        triggeredByFactKeys: businessKeys,
      },
    ],
  });
  return {
    mustFile: { "form-8995-a": resolution },
    missingInputs: { "form-8995-a": missingBusinessAnswers(inputs, businesses) },
    qualifiedReitDividends: divs.length > 0 ? reit : undefined,
    qbiBusinesses: businesses.length > 0 ? businesses : undefined,
    qbiScheduleSEFiled: resolveScheduleSEInfo(inputs).mustFile?.["schedule-se"]?.value,
  };
}

/* A spouse's business is on this return only when filing jointly. */
function qbiBusinesses(inputs: ResolverInputs): {
  businesses: QbiBusiness[];
  malformedKeys: string[];
} {
  const { businesses, malformedKeys } = readBusinessFacts(inputs.facts);
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const onReturn = businesses
    .map((business) => ({ ...business, owner: business.value.owner ?? "taxpayer" }))
    .filter((business) => joint || business.owner === "taxpayer");
  const taxpayerCount = onReturn.filter((business) => business.owner === "taxpayer").length;
  return {
    businesses: onReturn.map(({ key, value, owner }) => ({
      factKey: key,
      owner,
      name: value.name ?? value.activity,
      ein: value.ein,
      specifiedService: value.specifiedService,
      netProfit: netProfit(value),
      ownersOnlyBusiness: owner === "taxpayer" && taxpayerCount === 1,
      w2WagesPaid: value.w2WagesPaid,
      qualifiedPropertyUbia: value.qualifiedPropertyUbia,
    })),
    malformedKeys,
  };
}

/*
 * Line 1(b) needs the specified-service answer. Lines 4 and 7 (W-2 wages, UBIA)
 * matter only above the threshold (irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b01),
 * so they are asked only when MAGI's upper bound, which taxable income before
 * the QBI deduction cannot exceed, is above it. An unknown filing status uses
 * the lowest threshold.
 */
function missingBusinessAnswers(inputs: ResolverInputs, businesses: QbiBusiness[]): string[] {
  const status = filingStatusOf(inputs);
  const joint = status === undefined || status === "married_filing_jointly";
  const threshold = (status && QBI_LIMITS[status]?.threshold) || QBI_LIMITS.single.threshold;
  const mayBeAbove = magiUpperBound(inputs, joint) > threshold;
  const answered = (business: QbiBusiness) =>
    business.specifiedService !== undefined &&
    (!mayBeAbove ||
      (business.w2WagesPaid !== undefined && business.qualifiedPropertyUbia !== undefined));
  return missingInputs(
    Object.fromEntries(
      businesses.map((business) => [business.factKey, answered(business) ? true : undefined]),
    ),
  );
}
