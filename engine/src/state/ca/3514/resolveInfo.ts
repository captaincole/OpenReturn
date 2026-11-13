import {
  CA_EITC_KEYS,
  EIC_KEYS,
  SPOUSE_KEYS,
  businessesOnReturn,
  isDividendFactKey,
  isInterestFactKey,
} from "../../../facts/index.js";
import { agiFloor } from "../../../federal/schedule-eic/possible.js";
import { filingStatusOf } from "../../../filingInfoResolvers.js";
import { roundDollars, sum } from "../../../money.js";
import {
  missingInputs,
  resolveMustFile,
  sumInvestmentBox,
  text,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import { caEitcChildren, isYoungChild } from "./children.js";
import {
  caEitcWages,
  combatPay,
  largestBusiness,
  nonqualifiedPlanBox11,
  wagesOutsideCalifornia,
} from "./facts.js";
import type { CaEitcAnswers, Form3514FilingInfo } from "./filingInfo.js";
import {
  CA_EITC_INCOME_LIMIT,
  CA_EITC_INVESTMENT_INCOME_LIMIT,
  atLeast18,
  fosterYouthAge,
} from "./limits.js";

const answer = (inputs: ResolverInputs, key: string) =>
  inputs.factByKey.get(key) as boolean | undefined;

function caEitcAnswers(inputs: ResolverInputs): CaEitcAnswers {
  return {
    nonresidentAlien: answer(inputs, EIC_KEYS.nonresidentAlien),
    qualifyingChildOfAnother: answer(inputs, EIC_KEYS.qualifyingChildOfAnother),
    claimableAsDependent: answer(inputs, EIC_KEYS.claimableAsDependent),
    irsDisallowedEarlierYear: answer(inputs, EIC_KEYS.deniedInEarlierYear),
    ftbDisallowedEarlierYear: answer(inputs, CA_EITC_KEYS.ftbDisallowedEarlierYear),
    livedApartLastSixMonths:
      answer(inputs, SPOUSE_KEYS.livedApartAllYear) === true
        ? true
        : answer(inputs, SPOUSE_KEYS.livedApartLastSixMonths),
    legallySeparatedApartAtYearEnd: answer(inputs, SPOUSE_KEYS.legallySeparatedApartAtYearEnd),
    fosterYouthTaxpayer: answer(inputs, CA_EITC_KEYS.fosterYouthTaxpayer),
    fosterYouthSpouse: answer(inputs, CA_EITC_KEYS.fosterYouthSpouse),
    cdssConsentTaxpayer: answer(inputs, CA_EITC_KEYS.cdssConsentTaxpayer),
    cdssConsentSpouse: answer(inputs, CA_EITC_KEYS.cdssConsentSpouse),
  };
}

/* Form 1040 lines 2a, 2b and 3b from the documents (Worksheet 1 lines 1 and 3), each rounded. */
function investmentIncomeFromDocuments(inputs: ResolverInputs): number {
  return sum(
    roundDollars(sumInvestmentBox(inputs, "box8", isInterestFactKey)),
    roundDollars(
      sum(
        sumInvestmentBox(inputs, "box1", isInterestFactKey),
        sumInvestmentBox(inputs, "box3", isInterestFactKey),
      ),
    ),
    roundDollars(sumInvestmentBox(inputs, "box1a", isDividendFactKey)),
  );
}

/*
 * Whether the EITC is still possible from facts alone. Resolvers cannot read
 * form lines, so each test uses the facts' bound and errs toward filing:
 * - earned income: California W-2 wages, a business, nontaxable combat pay or
 *   a disability pension (line 13); with none, the EITC is 0 (worksheet line 1)
 *   and only the YCTC for a young child can apply (Step 8);
 * - Step 1, question a: federal AGI at least the federal EIC's lower bound
 *   (agiFloor), and California wages, at or over $32,901 with no business;
 * - Step 2: interest and dividends over $4,814;
 * - Step 4, question b, without a qualifying child: no filer is 18.
 */
function caEitcMayApply(inputs: ResolverInputs, joint: boolean, children: number): boolean {
  const wages = caEitcWages(inputs) ?? 0;
  const { businesses } = businessesOnReturn(inputs.facts, joint);
  if (wages <= 0 && businesses.length === 0 && combatPay(inputs) === undefined) return false;
  const agi = agiFloor(inputs, joint);
  if (agi !== undefined && agi >= CA_EITC_INCOME_LIMIT) return false;
  if (businesses.length === 0 && wages >= CA_EITC_INCOME_LIMIT) return false;
  if (investmentIncomeFromDocuments(inputs) > CA_EITC_INVESTMENT_INCOME_LIMIT) return false;
  if (children > 0) return true;
  const dobs = [text(inputs, "identity.dob"), ...(joint ? [text(inputs, SPOUSE_KEYS.dob)] : [])];
  return dobs.some((dob) => atLeast18(dob) !== false);
}

/*
 * A filing status or an answer that rules the credit out whatever the lines
 * are: Step 1 d (married filing separately with no qualifying child, or a head
 * of household who lived with the spouse in the last 6 months of 2025 and has
 * no qualifying child), Step 1 f, Step 4 e and f, and the questionnaire's f.
 */
function ruledOut(inputs: ResolverInputs, answers: CaEitcAnswers, children: number): boolean {
  const status = filingStatusOf(inputs);
  if (status === "married_filing_jointly") return false;
  if (children === 0 && status === "married_filing_separately") return true;
  if (children === 0 && status === "head_of_household" && answers.livedApartLastSixMonths) {
    return true;
  }
  return (
    answers.nonresidentAlien === true ||
    answers.qualifyingChildOfAnother === true ||
    (children === 0 && answers.claimableAsDependent === true)
  );
}

/*
 * The answers FTB 3514 waits on, asked once the form files: lines 1a and 1b,
 * Step 1 f, Step 4 e and f (or the questionnaire's f with a child), Step 1 d's
 * separation for a married filer with a child, and Step 10's foster care test
 * and line 33's consent for each filer of age 18 to 25.
 */
function caEitcQuestions(
  inputs: ResolverInputs,
  answers: CaEitcAnswers,
  children: number,
): Record<string, unknown> {
  const status = filingStatusOf(inputs);
  const joint = status === "married_filing_jointly";
  const separate = status === "married_filing_separately" && children > 0;
  const fosterTaxpayer = fosterYouthAge(text(inputs, "identity.dob")) === true;
  const fosterSpouse = joint && fosterYouthAge(text(inputs, SPOUSE_KEYS.dob)) === true;
  return {
    [EIC_KEYS.deniedInEarlierYear]: answers.irsDisallowedEarlierYear,
    [CA_EITC_KEYS.ftbDisallowedEarlierYear]: answers.ftbDisallowedEarlierYear,
    [EIC_KEYS.nonresidentAlien]: answers.nonresidentAlien,
    ...(joint ? {} : { [EIC_KEYS.qualifyingChildOfAnother]: answers.qualifyingChildOfAnother }),
    ...(joint || children > 0
      ? {}
      : { [EIC_KEYS.claimableAsDependent]: answers.claimableAsDependent }),
    ...(separate ? { [SPOUSE_KEYS.livedApartLastSixMonths]: answers.livedApartLastSixMonths } : {}),
    ...(separate && answers.livedApartLastSixMonths === false
      ? { [SPOUSE_KEYS.legallySeparatedApartAtYearEnd]: answers.legallySeparatedApartAtYearEnd }
      : {}),
    ...(fosterTaxpayer ? { [CA_EITC_KEYS.fosterYouthTaxpayer]: answers.fosterYouthTaxpayer } : {}),
    ...(fosterTaxpayer && answers.fosterYouthTaxpayer === true
      ? { [CA_EITC_KEYS.cdssConsentTaxpayer]: answers.cdssConsentTaxpayer }
      : {}),
    ...(fosterSpouse ? { [CA_EITC_KEYS.fosterYouthSpouse]: answers.fosterYouthSpouse } : {}),
    ...(fosterSpouse && answers.fosterYouthSpouse === true
      ? { [CA_EITC_KEYS.cdssConsentSpouse]: answers.cdssConsentSpouse }
      : {}),
  };
}

/*
 * ca-3514-inst-2025::sec::california-earned-income-tax-credit::b01: a filer
 * "must file a California income tax return to claim the credit and attach a
 * completed form FTB 3514". The explicit key is
 * decisions.scope.must_file_3514. The fallback files the form when Form
 * 540 files for a full-year resident (Steps 7, 9 and 11 for Form 540NR are not
 * modeled) and either the EITC is still possible from facts (caEitcMayApply)
 * with no answer ruling it out, or a qualifying child younger than six may
 * bring the YCTC with no earned income (Step 8). The lines then decide the
 * credits; the form can file with none, as Schedule EIC can.
 */
export function resolve3514Info(inputs: ResolverInputs): Form3514FilingInfo {
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const { listed, open } = caEitcChildren(inputs);
  const answers = caEitcAnswers(inputs);
  const files540 = inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true;
  const residency = inputs.decisionByKey.get("decisions.scope.ca_residency");
  // A missing residency answer files the form and asks it; another residency is Form 540NR's.
  const fullYear = residency === undefined || residency === "full_year";
  const eitc = caEitcMayApply(inputs, joint, listed.length);
  const youngChild = listed.some(isYoungChild);
  const possible = (eitc || youngChild) && !ruledOut(inputs, answers, listed.length);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3514",
    fallbacks: [
      {
        rule: `fallback: Form 540 files for a full-year resident, or one whose residency is not yet known (${files540 && fullYear}), the EITC may apply (${eitc}) or a child under six may bring the YCTC (${youngChild}), and no answer rules the credit out`,
        value: files540 && fullYear && possible,
        triggeredByFactKeys: listed.map((child) => child.sourceFact.key),
        triggeredByDecisionKeys: [
          "decisions.scope.must_file_ca_540",
          "decisions.scope.ca_residency",
        ],
      },
    ],
  });
  const files = resolution.value === true;
  const openKeys = Object.fromEntries(open.map((child) => [child.sourceFact.key, undefined]));
  return {
    mustFile: { "form-3514": resolution },
    missingInputs: {
      "form-3514": files
        ? missingInputs({
            "decisions.scope.ca_residency": residency,
            ...openKeys,
            ...caEitcQuestions(inputs, answers, listed.length),
          })
        : [],
    },
    caEitcAnswers: answers,
    caEitcChildren: listed,
    caEitcChildrenOpen: open.length > 0,
    caFullYearResident: residency === undefined ? undefined : residency === "full_year",
    caEitcWages: caEitcWages(inputs),
    caNonqualifiedPlanBox11: nonqualifiedPlanBox11(inputs),
    caCombatPay: combatPay(inputs),
    caWagesOutsideCalifornia: wagesOutsideCalifornia(inputs),
    caEitcBusiness: largestBusiness(inputs, joint),
    caEitcHasBusiness: businessesOnReturn(inputs.facts, joint).businesses.length > 0,
  };
}
