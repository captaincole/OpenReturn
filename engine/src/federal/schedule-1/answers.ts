/*
 * Schedule 1 answers the taxpayer states (facts/kinds/otherIncome.ts and
 * adjustments.ts), and the W-2 box 12 code H contributions, as filing-info slots.
 */

import {
  ADJUSTMENT_KEYS,
  LAST_PRE_2019_AGREEMENT_DATE,
  OTHER_INCOME_KEYS,
  readOtherIncomeItems,
  readTraditionalIraFact,
  SPOUSE_KEYS,
  type W2FactValue,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import {
  factsInCategory,
  missingInputs,
  num,
  text,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { Schedule1FilingInfo } from "./filingInfo.js";
import { needsPub590AWorksheets } from "./pub590a.js";

/* W-2 box 12 code H: elective deferrals to a section 501(c)(18)(D) plan (line 24f). */
export const SECTION_501C18D_CODE = "H";
/* irs-1040-inst-2025::sec::your-ira-spouse-s-ira::b01: age 50 or older at the end of 2025. */
const BORN_BEFORE_FOR_AGE_50 = 1976;

/*
 * Lines 2a and 19a: an agreement entered into on or before December 31, 2018,
 * unless changed after that date to say alimony is not income
 * (irs-1040-inst-2025::sec::lines-2a-and-2b::b01). Undefined while an answer is missing.
 */
function alimonyCounts(date: string | undefined, excludes: unknown): boolean | undefined {
  if (date === undefined) return undefined;
  if (date > LAST_PRE_2019_AGREEMENT_DATE) return false;
  return typeof excludes === "boolean" ? !excludes : undefined;
}

const yearOf = (dob: string | undefined): number | undefined => {
  if (!dob) return undefined;
  const parts = dob.includes("-") ? dob.split("-") : dob.split("/");
  const year = Number(dob.includes("-") ? parts[0] : parts[2]);
  return Number.isFinite(year) ? year : undefined;
};

function w2s(inputs: ResolverInputs): W2FactValue[] {
  return factsInCategory(inputs, "wages").map((row) => row.value as W2FactValue);
}

/* The taxpayer's IRA Deduction Worksheet answers (one column: the taxpayer's IRA). */
function iraAnswers(inputs: ResolverInputs) {
  const ira = readTraditionalIraFact(inputs.factByKey, "taxpayer");
  const ownW2s = w2s(inputs).filter((w2) => (w2.owner ?? "taxpayer") === "taxpayer");
  const birthYear = yearOf(text(inputs, "identity.dob"));
  return {
    iraContributions: ira?.contributions,
    iraCoveredAtWork: ownW2s.some((w2) => w2.box13?.retirementPlan === true),
    iraAge50OrOlder: birthYear === undefined ? undefined : birthYear < BORN_BEFORE_FOR_AGE_50,
    // Worksheet line 8: box 1 less nonqualified plan income (box 11), plus nontaxable combat pay (box 12 code Q).
    iraWages: sum(
      ...ownW2s.map((w2) => w2.box1 - (w2.box11 ?? 0)),
      ...ownW2s.flatMap((w2) =>
        (w2.box12 ?? []).filter((entry) => entry.code === "Q").map((entry) => entry.amount),
      ),
    ),
    iraAdoptionBenefits: ownW2s.some((w2) => (w2.box12 ?? []).some((entry) => entry.code === "T")),
    livedApartAllYear: inputs.factByKey.get(SPOUSE_KEYS.livedApartAllYear) as boolean | undefined,
  };
}

/*
 * The answers lines 2a and 19a wait on: the agreement's date, and for an
 * agreement made before 2019, whether it was changed to exclude alimony.
 */
function alimonyAgreementAnswers(
  inputs: ResolverInputs,
  amount: number | undefined,
  dateKey: string,
  excludesKey: string,
): Record<string, unknown> {
  if (amount === undefined) return {};
  const date = text(inputs, dateKey);
  const beforeChange = date !== undefined && date <= LAST_PRE_2019_AGREEMENT_DATE;
  return {
    [dateKey]: date,
    ...(beforeChange ? { [excludesKey]: inputs.factByKey.get(excludesKey) } : {}),
  };
}

export function schedule1Answers(inputs: ResolverInputs): Schedule1FilingInfo {
  const receivedDate = text(inputs, OTHER_INCOME_KEYS.alimonyReceivedAgreementDate);
  const paidDate = text(inputs, ADJUSTMENT_KEYS.alimonyPaidAgreementDate);
  const alimonyReceived = num(inputs, OTHER_INCOME_KEYS.alimonyReceived);
  const alimonyPaid = num(inputs, ADJUSTMENT_KEYS.alimonyPaid);
  const box12H = w2s(inputs).flatMap((w2) =>
    (w2.box12 ?? []).filter((entry) => entry.code === SECTION_501C18D_CODE),
  );
  const answers = iraAnswers(inputs);
  return {
    alimonyReceived,
    alimonyReceivedTaxable: alimonyCounts(
      receivedDate,
      inputs.factByKey.get(OTHER_INCOME_KEYS.alimonyReceivedAgreementExcludes),
    ),
    alimonyReceivedAgreementDate: receivedDate,
    juryDutyPay: num(inputs, OTHER_INCOME_KEYS.juryDutyPay),
    prizesAndAwards: num(inputs, OTHER_INCOME_KEYS.prizesAndAwards),
    stockOptions: num(inputs, OTHER_INCOME_KEYS.stockOptions),
    otherIncomeItems: readOtherIncomeItems(inputs.factByKey.get(OTHER_INCOME_KEYS.otherItems)),
    selfEmployedPlanDeduction: num(inputs, ADJUSTMENT_KEYS.selfEmployedPlanDeduction),
    alimonyPaid,
    alimonyPaidDeductible: alimonyCounts(
      paidDate,
      inputs.factByKey.get(ADJUSTMENT_KEYS.alimonyPaidAgreementExcludes),
    ),
    alimonyPaidAgreementDate: paidDate,
    alimonyRecipientSsn: text(inputs, ADJUSTMENT_KEYS.alimonyRecipientSsn),
    juryDutyPayToEmployer: num(inputs, ADJUSTMENT_KEYS.juryDutyPayToEmployer),
    reforestation: num(inputs, ADJUSTMENT_KEYS.reforestation),
    tradeActBenefitRepayment: num(inputs, ADJUSTMENT_KEYS.tradeActBenefitRepayment),
    section501c18dContributions:
      box12H.length > 0 ? sum(...box12H.map((entry) => entry.amount)) : undefined,
    discriminationClaimFees: num(inputs, ADJUSTMENT_KEYS.discriminationClaimFees),
    whistleblowerAwardFees: num(inputs, ADJUSTMENT_KEYS.whistleblowerAwardFees),
    ...answers,
    pub590aWorksheets: needsPub590AWorksheets(inputs),
    missingInputs: {
      "schedule-1": missingInputs({
        ...alimonyAgreementAnswers(
          inputs,
          alimonyReceived,
          OTHER_INCOME_KEYS.alimonyReceivedAgreementDate,
          OTHER_INCOME_KEYS.alimonyReceivedAgreementExcludes,
        ),
        ...alimonyAgreementAnswers(
          inputs,
          alimonyPaid,
          ADJUSTMENT_KEYS.alimonyPaidAgreementDate,
          ADJUSTMENT_KEYS.alimonyPaidAgreementExcludes,
        ),
        ...(alimonyPaid !== undefined
          ? {
              [ADJUSTMENT_KEYS.alimonyRecipientSsn]: text(
                inputs,
                ADJUSTMENT_KEYS.alimonyRecipientSsn,
              ),
            }
          : {}),
        ...((answers.iraContributions ?? 0) > 0 &&
        inputs.decisionByKey.get("decisions.scope.filing_status") === "married_filing_separately"
          ? { [SPOUSE_KEYS.livedApartAllYear]: answers.livedApartAllYear }
          : {}),
        ...((answers.iraContributions ?? 0) > 0
          ? { "identity.dob": text(inputs, "identity.dob") }
          : {}),
      }),
    },
  };
}
