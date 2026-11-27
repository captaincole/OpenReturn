import { EIC_KEYS, FORM_8862_KEYS } from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { eicMayApply } from "../schedule-eic/possible.js";
import { eicQualifyingChildren } from "../schedule-eic/qualifyingChild.js";
import { form8862EicPart } from "./eicPart.js";
import type { Form8862FilingInfo } from "./filingInfo.js";

const answer = (inputs: ResolverInputs, key: string) =>
  inputs.factByKey.get(key) as boolean | undefined;

/*
 * DECISION (2026-11-26, by the author): a stated ban means no Form 8862 and no
 * credit. irs-8862-inst-2025::sec::general-instructions::b03: "Do not file
 * Form 8862 for the: 2 years ... 10 years ... the final determination means
 * that you cannot take the credit(s). However, if you disagree with the final
 * determination, and want to appeal ... you should file Form 8862"; ::b05:
 * "you must claim the EIC on your 2025 return with an attached Form 8862 to
 * appeal the ban". The engine follows the first text: an appeal is the
 * filer's choice to contest, the return must then be mailed ("we will reject
 * an e-filed return", ::b04), and no fact records the choice. A stated ban
 * stops the EIC (schedule-eic/credit.ts) and the child tax credits
 * (schedule-8812/resolveInfo.ts), and makes the AOTC a gap (8863/credit.ts).
 */
const deniedNotBarred = (inputs: ResolverInputs, denied: string, barred: string) =>
  answer(inputs, denied) === true && answer(inputs, barred) !== true;

/*
 * Who files (irs-8862-inst-2025::sec::general-instructions::b01): a filer
 * whose EIC (after 1996), or CTC, ACTC, ODC or AOTC (after 2015), was reduced
 * or disallowed for a reason other than a math or clerical error, and who now
 * claims that credit. The engine learns of a denial from the answers
 * EIC_KEYS.deniedInEarlierYear (Cade asks it of every filer the EIC may
 * reach), and FORM_8862_KEYS.ctcDeniedInEarlierYear and aotcDeniedInEarlierYear
 * (recorded when the filer states one). The form files when a denial is
 * stated and the credit may apply; line 2's boxes then decide, after the
 * credits settle, whether it stays on the return (filesOnlyWithAmountOn in
 * bindings.ts): a box is checked only when the return claims that credit.
 * Part II's answers are asked only while the EIC is still possible. Parts III
 * and IV ask nothing: Schedule 8812's dependents and Form 8863's students
 * answer them. The explicit decision still wins.
 */
export function resolve8862Info(inputs: ResolverInputs): Form8862FilingInfo {
  const eic = form8862EicPart(inputs);
  const eicPossible = eicMayApply(inputs, eicQualifyingChildren(inputs).withSsn.length);
  const eicFiles = eic.needed && eicPossible;
  const ctcNeeded = deniedNotBarred(
    inputs,
    FORM_8862_KEYS.ctcDeniedInEarlierYear,
    FORM_8862_KEYS.ctcBarredByIrs,
  );
  const aotcNeeded = deniedNotBarred(
    inputs,
    FORM_8862_KEYS.aotcDeniedInEarlierYear,
    FORM_8862_KEYS.aotcBarredByIrs,
  );
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8862",
    fallbacks: [
      {
        rule: `fallback: an earlier denial is stated for the EIC (${eicFiles}), the child tax credits (${ctcNeeded}) or the AOTC (${aotcNeeded}), with no ban`,
        value: eicFiles || ctcNeeded || aotcNeeded,
        triggeredByFactKeys: [
          ...(eicFiles ? [EIC_KEYS.deniedInEarlierYear] : []),
          ...(ctcNeeded ? [FORM_8862_KEYS.ctcDeniedInEarlierYear] : []),
          ...(aotcNeeded ? [FORM_8862_KEYS.aotcDeniedInEarlierYear] : []),
        ],
      },
    ],
  });
  return {
    mustFile: { "form-8862": mustFile },
    missingInputs: { "form-8862": eicFiles ? eic.waitingKeys : [] },
    form8862: { eic, ctcNeeded, aotcNeeded },
  };
}
