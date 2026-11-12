import { missingInputs, type ResolverInputs } from "../../resolverInputs.js";
import type { QbiBusiness } from "../qbi/filingInfo.js";
import { qbiBusinesses, rentalsWithoutQbiAnswer } from "../qbi/resolveInfo.js";
import { qbiIncomeMayExceedThreshold, qbiMustFile } from "../qbi/whichForm.js";
import type { Form8995AFilingInfo } from "./filingInfo.js";

/*
 * irs-8995a-inst-2025::sec::who-can-take-the-deduction::b01: Form 8995-A files
 * when Form 8995 does not (qbi/whichForm.ts, the rule both QBI forms share). At
 * or below the threshold line 13 takes line 3 unreduced, the Form 8995 result.
 * The QBI slots come from resolveQbiInfo (federal/qbi).
 */
export function resolve8995AInfo(inputs: ResolverInputs): Form8995AFilingInfo {
  const { businesses } = qbiBusinesses(inputs);
  return {
    mustFile: { "form-8995-a": qbiMustFile(inputs, "form-8995-a") },
    missingInputs: {
      "form-8995-a": [
        ...missingBusinessAnswers(inputs, businesses),
        ...rentalsWithoutQbiAnswer(inputs),
      ],
    },
  };
}

/*
 * Line 1(b) needs the specified-service answer. Lines 4 and 7 (W-2 wages, UBIA)
 * matter only above the threshold (irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b01),
 * so they are asked only when taxable income before the QBI deduction may be
 * above it (qbiIncomeMayExceedThreshold).
 */
function missingBusinessAnswers(inputs: ResolverInputs, businesses: QbiBusiness[]): string[] {
  const mayBeAbove = qbiIncomeMayExceedThreshold(inputs);
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
