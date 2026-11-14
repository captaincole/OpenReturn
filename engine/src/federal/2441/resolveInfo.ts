import {
  DEPENDENT_CARE_KEYS,
  ageAtYearEnd,
  businessesOnReturn,
  getDependentCareProviderFacts,
  getDependentCareQualifyingPersonFacts,
  isW2FactKey,
  makeDependentFactKey,
  ownerOf,
  type DependentCareQualifyingPersonFactValue,
  type DependentFactValue,
  type W2FactValue,
} from "../../facts/index.js";
import { filingStatusOf } from "../../filingInfoResolvers.js";
import { sum } from "../../money.js";
import {
  factsInCategory,
  missingInputs,
  num,
  resolveMustFile,
  w2Owner,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { disabilityPensions, disabilityWages } from "../1040/disabilityPensions.js";
import type { DependentCarePersonRow, Form2441FilingInfo } from "./filingInfo.js";

/* Resolvers see no tax year; the 1040 pins its age rules to 2025 the same way. */
const TAX_YEAR = 2025;

/*
 * A qualifying person's row: the dependent fact gives the name, SSN and date of
 * birth when the person is a dependent (irs-2441-inst-2025::sec::qualifying-person-s::b01).
 * Incomplete while a name, an SSN or (for a person 13 or older at year end)
 * the answer to "unable to care for themselves" is missing.
 */
function personRow(
  inputs: ResolverInputs,
  factKey: string,
  person: DependentCareQualifyingPersonFactValue,
): { row: DependentCarePersonRow; complete: boolean } {
  const dependent =
    person.dependentSlug === undefined
      ? undefined
      : (inputs.factByKey.get(makeDependentFactKey(person.dependentSlug)) as
          DependentFactValue | undefined);
  const row: DependentCarePersonRow = {
    factKey,
    firstName: person.firstName ?? dependent?.firstName,
    lastName: person.lastName ?? dependent?.lastName,
    ssn: person.ssn ?? dependent?.ssn,
    ageAtYearEnd: ageAtYearEnd(person.dob ?? dependent?.dob, TAX_YEAR),
    unableToCareForSelf: person.unableToCareForSelf,
    expensesPaid: person.expensesPaid,
  };
  const disabilityAsked = row.ageAtYearEnd === undefined || row.ageAtYearEnd >= 13;
  const complete =
    row.firstName !== undefined &&
    row.lastName !== undefined &&
    row.ssn !== undefined &&
    row.ageAtYearEnd !== undefined &&
    (!disabilityAsked || row.unableToCareForSelf !== undefined);
  return { row, complete };
}

/*
 * MANUAL EDIT: line 2 lists only a qualifying person. One over age 12 must be
 * unable to care for themselves (irs-2441-inst-2025::sec::line-2::b02). A child 13
 * at year end turned 13 in 2025 and qualifies for the part of the year under 13
 * (irs-2441-inst-2025::sec::qualifying-person-s::b01), so only a "no" at 14 or
 * older leaves the person off. An unanswered person stays, and waits.
 */
const OLDEST_AGE_UNDER_13_PART_OF_YEAR = 13;

function qualifies(row: DependentCarePersonRow): boolean {
  return !(
    row.ageAtYearEnd !== undefined &&
    row.ageAtYearEnd > OLDEST_AGE_UNDER_13_PART_OF_YEAR &&
    row.unableToCareForSelf === false
  );
}

/* Each spouse's W-2 box 1 on a joint return (w2Owner); undefined while a W-2 cannot be placed. */
function w2WagesByOwner(inputs: ResolverInputs): {
  taxpayer?: number;
  spouse?: number;
  unplacedKeys: string[];
} {
  const w2s = factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .map((row) => ({ key: row.key, w2: row.value as W2FactValue }));
  const unplacedKeys = w2s
    .filter(({ w2 }) => w2Owner(inputs, w2) === undefined)
    .map(({ key }) => key);
  if (unplacedKeys.length > 0) return { unplacedKeys };
  const wages = (owner: "taxpayer" | "spouse") =>
    sum(...w2s.filter(({ w2 }) => w2Owner(inputs, w2) === owner).map(({ w2 }) => w2.box1));
  return { taxpayer: wages("taxpayer"), spouse: wages("spouse"), unplacedKeys };
}

/* A business on a joint return that is the spouse's (statedBusinessesOnReturn keeps both spouses'). */
function spouseHasBusiness(inputs: ResolverInputs): boolean {
  const { businesses } = businessesOnReturn(inputs.facts, true);
  return businesses.some((business) => ownerOf(business.value) === "spouse");
}

/*
 * Form 2441 files to claim the credit for a qualifying person's care, or when
 * the taxpayer received dependent care benefits (irs-2441-inst-2025::sec::purpose-of-form::b01):
 * a qualifying person fact with expenses, or W-2 box 10.
 */
export function resolve2441Info(inputs: ResolverInputs): Form2441FilingInfo {
  const status = filingStatusOf(inputs);
  const providers = getDependentCareProviderFacts(inputs.facts);
  const persons = getDependentCareQualifyingPersonFacts(inputs.facts)
    .map((fact) => personRow(inputs, fact.factKey, fact.person))
    .filter(({ row }) => qualifies(row));
  const benefitsByW2 = factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .map((row) => (row.value as W2FactValue).box10 ?? 0)
    .filter((box10) => box10 > 0);
  const benefits = sum(...benefitsByW2);
  const claimsCredit = persons.some(({ row }) => row.expensesPaid > 0);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_2441",
    fallbacks: [
      {
        rule: `fallback: qualifying person expenses (${claimsCredit}) or W-2 box 10 dependent care benefits ($${benefits})`,
        value: claimsCredit || benefits > 0,
        triggeredByFactKeys: persons.map(({ row }) => row.factKey),
      },
    ],
  });
  const joint = status === "married_filing_jointly";
  const owners = joint ? w2WagesByOwner(inputs) : { unplacedKeys: [] as string[] };
  // Form 1040 lists each pension's answer key; a missing answer leaves these undefined.
  const pensions = joint ? disabilityPensions(inputs) : [];
  const answer = (key: string) => inputs.factByKey.get(key) as boolean | undefined;
  const benefitAnswers = {
    [DEPENDENT_CARE_KEYS.benefitsGracePeriodCarryover]: num(
      inputs,
      DEPENDENT_CARE_KEYS.benefitsGracePeriodCarryover,
    ),
    [DEPENDENT_CARE_KEYS.benefitsForfeited]: num(inputs, DEPENDENT_CARE_KEYS.benefitsForfeited),
    [DEPENDENT_CARE_KEYS.expensesIncurred]: num(inputs, DEPENDENT_CARE_KEYS.expensesIncurred),
    [DEPENDENT_CARE_KEYS.planExclusionLimit]: num(inputs, DEPENDENT_CARE_KEYS.planExclusionLimit),
  };
  return {
    mustFile: { "form-2441": resolution },
    missingInputs: {
      "form-2441": [
        ...persons.filter(({ complete }) => !complete).map(({ row }) => row.factKey),
        ...owners.unplacedKeys,
        ...missingInputs({
          ...(claimsCredit
            ? {
                [DEPENDENT_CARE_KEYS.priorYearExpensesPaid]: num(
                  inputs,
                  DEPENDENT_CARE_KEYS.priorYearExpensesPaid,
                ),
              }
            : {}),
          ...(status === "married_filing_separately"
            ? {
                [DEPENDENT_CARE_KEYS.marriedSeparatelyTreatedAsUnmarried]: answer(
                  DEPENDENT_CARE_KEYS.marriedSeparatelyTreatedAsUnmarried,
                ),
              }
            : {}),
          ...(joint
            ? {
                [DEPENDENT_CARE_KEYS.studentOrDisabledSpouse]: answer(
                  DEPENDENT_CARE_KEYS.studentOrDisabledSpouse,
                ),
              }
            : {}),
          ...(benefits > 0 ? benefitAnswers : {}),
        }),
      ],
    },
    dependentCareProviders: providers.map((fact) => fact.provider),
    dependentCarePersons: persons.map(({ row }) => row),
    dependentCareBenefits: benefits,
    dependentCareBenefitsByW2: benefitsByW2,
    dependentCareTaxpayerW2Wages: owners.taxpayer,
    dependentCareSpouseW2Wages: owners.spouse,
    dependentCareTaxpayerDisabilityWages: joint ? disabilityWages(pensions, "taxpayer") : undefined,
    dependentCareSpouseDisabilityWages: joint ? disabilityWages(pensions, "spouse") : undefined,
    dependentCareSpouseHasBusiness: joint ? spouseHasBusiness(inputs) : undefined,
    dependentCarePriorYearExpensesPaid: num(inputs, DEPENDENT_CARE_KEYS.priorYearExpensesPaid),
    dependentCareMfsTreatedAsUnmarried: answer(
      DEPENDENT_CARE_KEYS.marriedSeparatelyTreatedAsUnmarried,
    ),
    dependentCareStudentOrDisabledSpouse: answer(DEPENDENT_CARE_KEYS.studentOrDisabledSpouse),
    dependentCareGracePeriodCarryover:
      benefitAnswers[DEPENDENT_CARE_KEYS.benefitsGracePeriodCarryover],
    dependentCareBenefitsForfeited: benefitAnswers[DEPENDENT_CARE_KEYS.benefitsForfeited],
    dependentCareExpensesIncurred: benefitAnswers[DEPENDENT_CARE_KEYS.expensesIncurred],
    dependentCarePlanExclusionLimit: benefitAnswers[DEPENDENT_CARE_KEYS.planExclusionLimit],
  };
}
