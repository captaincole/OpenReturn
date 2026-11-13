import {
  HEAD_OF_HOUSEHOLD_KEYS,
  isCaHohMaritalStatus,
  type LivedWithSpousePeriod,
} from "../../../facts/index.js";
import { filingStatusOf } from "../../../filingInfoResolvers.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../../resolverInputs.js";
import type { Form3532FilingInfo } from "./filingInfo.js";
import {
  asksLines3aAnd3b,
  daysLivedWithTaxpayer,
  findQualifyingPerson,
  fullTimeStudentUnder24,
  type QualifyingPerson,
} from "./qualifyingPerson.js";

/*
 * ca-3532-inst-2025::sec::general-information::b02: "California requires taxpayers
 * who use head of household (HOH) filing status to file form FTB 3532 ... Attach
 * the completed form FTB 3532 to your Form 540 ... if you claim HOH filing status."
 * The engine's California filing status is the federal one (Form 540's "different
 * from federal" box is not modeled), so the form files with the 540 when the
 * filing status is head of household.
 */
export function resolve3532Info(inputs: ResolverInputs): Form3532FilingInfo {
  const files540 = inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true;
  const headOfHousehold = filingStatusOf(inputs) === "head_of_household";
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3532",
    fallbacks: [
      {
        rule: `fallback: Form 540 files (${files540}) with head of household status (${headOfHousehold})`,
        value: files540 && headOfHousehold,
        triggeredByDecisionKeys: [
          "decisions.scope.must_file_ca_540",
          "decisions.scope.filing_status",
        ],
      },
    ],
  });
  const status = inputs.factByKey.get(HEAD_OF_HOUSEHOLD_KEYS.caMaritalStatus);
  const hohMaritalStatus = isCaHohMaritalStatus(status) ? status : undefined;
  const periods = inputs.factByKey.get(HEAD_OF_HOUSEHOLD_KEYS.livedWithSpousePeriods);
  const livedWithSpousePeriods = Array.isArray(periods)
    ? (periods as LivedWithSpousePeriod[])
    : undefined;
  const qualifying = findQualifyingPerson(inputs);
  const info: Form3532FilingInfo = {
    hohMaritalStatus,
    livedWithSpousePeriods,
    hohQualifyingPerson: qualifying.person,
    hohQualifyingPersonGap: qualifying.gap,
  };
  return {
    mustFile: { "form-3532": resolution },
    missingInputs: {
      "form-3532": resolution.value === true ? missingAnswers(info, qualifying.waits) : [],
    },
    ...info,
  };
}

/*
 * The answers the form waits for: line 1, the line 1f periods, which dependent is
 * the qualifying person, and that person's answers for lines 3a–5. A person's
 * missing answer lists the dependent fact, which Cade records again in full.
 */
function missingAnswers(info: Form3532FilingInfo, personWaits: boolean): string[] {
  const person = info.hohQualifyingPerson;
  return [
    ...missingInputs({
      [HEAD_OF_HOUSEHOLD_KEYS.caMaritalStatus]: info.hohMaritalStatus,
      ...(info.hohMaritalStatus === "married_lived_together"
        ? { [HEAD_OF_HOUSEHOLD_KEYS.livedWithSpousePeriods]: info.livedWithSpousePeriods }
        : {}),
      ...(personWaits ? { [HEAD_OF_HOUSEHOLD_KEYS.qualifyingPerson]: undefined } : {}),
    }),
    ...(person && personAnswersMissing(person, info) ? [person.factKey] : []),
  ];
}

function personAnswersMissing(person: QualifyingPerson, info: Form3532FilingInfo): boolean {
  const { dependent } = person;
  const asks3a3b = asksLines3aAnd3b(dependent);
  return (
    asks3a3b === undefined ||
    (asks3a3b &&
      (fullTimeStudentUnder24(dependent) === undefined ||
        dependent.permanentlyDisabled === undefined)) ||
    dependent.grossIncome === undefined ||
    (info.hohMaritalStatus !== undefined &&
      daysLivedWithTaxpayer(dependent, info.hohMaritalStatus) === undefined)
  );
}
