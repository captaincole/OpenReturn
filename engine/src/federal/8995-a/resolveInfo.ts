import { businessesOnReturn, ownerOf } from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { missingInputs, type ResolverInputs } from "../../resolverInputs.js";
import { magiUpperBound } from "../8960/mustFile.js";
import { qbiMustFile, qualifiedReitDividends } from "../8995/whichForm.js";
import { netProfit } from "../schedule-c/lines.js";
import { resolveScheduleSEInfo } from "../schedule-se/resolveInfo.js";
import type { Form8995AFilingInfo, QbiBusiness } from "./filingInfo.js";
import { QBI_LIMITS } from "./lines.js";

/*
 * irs-8995a-inst-2025::sec::who-can-take-the-deduction::b01: Form 8995-A files
 * when Form 8995 does not (whichForm.ts, the rule both QBI forms share). At or
 * below the threshold line 13 takes line 3 unreduced, the Form 8995 result. The
 * QBI slots below are filled whichever form files: Form 8995 reads them too.
 */
export function resolve8995AInfo(inputs: ResolverInputs): Form8995AFilingInfo {
  const { businesses } = qbiBusinesses(inputs);
  return {
    mustFile: { "form-8995-a": qbiMustFile(inputs, "form-8995-a") },
    missingInputs: { "form-8995-a": missingBusinessAnswers(inputs, businesses) },
    qualifiedReitDividends: qualifiedReitDividends(inputs),
    qbiBusinesses: businesses.length > 0 ? businesses : undefined,
    qbiScheduleSEFiled: resolveScheduleSEInfo(inputs).mustFile?.["schedule-se"]?.value,
  };
}

function qbiBusinesses(inputs: ResolverInputs): {
  businesses: QbiBusiness[];
  malformedKeys: string[];
} {
  const { businesses, malformedKeys } = businessesOnReturn(
    inputs.facts,
    filingStatusOf(inputs) === "married_filing_jointly",
  );
  const onReturn = businesses.map((business) => ({ ...business, owner: ownerOf(business.value) }));
  const taxpayerCount = onReturn.filter((business) => business.owner === "taxpayer").length;
  const onReturnValues = businesses.map((business) => business.value);
  return {
    businesses: onReturn.map(({ key, value, owner }) => ({
      factKey: key,
      owner,
      name: value.name ?? value.activity,
      ein: value.ein,
      specifiedService: value.specifiedService,
      netProfit: netProfit(value, onReturnValues),
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
