import {
  DEPENDENT_CARE_KEYS,
  ageAtYearEnd,
  getDependentCareProviderFacts,
  getDependentCareQualifyingPersonFacts,
  isW2FactKey,
  makeDependentFactKey,
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
  text,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { ssnOf } from "../schedule-se/resolveInfo.js";
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

/* Each spouse's W-2 box 1 on a joint return: the fact's owner, else the employee SSN. */
function w2WagesByOwner(inputs: ResolverInputs): {
  taxpayer?: number;
  spouse?: number;
  unplacedKeys: string[];
} {
  const taxpayerSsn = ssnOf(text(inputs, "identity.ssn"));
  const w2s = factsInCategory(inputs, "wages")
    .filter((row) => isW2FactKey(row.key))
    .map((row) => ({ key: row.key, w2: row.value as W2FactValue }));
  const place = (w2: W2FactValue): "taxpayer" | "spouse" | undefined => {
    if (w2.owner !== undefined) return w2.owner;
    const ssn = ssnOf(w2.employee?.ssn);
    if (ssn === undefined || taxpayerSsn === undefined) return undefined;
    return ssn === taxpayerSsn ? "taxpayer" : "spouse";
  };
  const unplacedKeys = w2s.filter(({ w2 }) => place(w2) === undefined).map(({ key }) => key);
  if (unplacedKeys.length > 0) return { unplacedKeys };
  const wages = (owner: "taxpayer" | "spouse") =>
    sum(...w2s.filter(({ w2 }) => place(w2) === owner).map(({ w2 }) => w2.box1));
  return { taxpayer: wages("taxpayer"), spouse: wages("spouse"), unplacedKeys };
}

/*
 * Form 2441 files to claim the credit for a qualifying person's care, or when
 * the taxpayer received dependent care benefits (irs-2441-inst-2025::sec::purpose-of-form::b01):
 * a qualifying person fact with expenses, or W-2 box 10.
 */
export function resolve2441Info(inputs: ResolverInputs): Form2441FilingInfo {
  const status = filingStatusOf(inputs);
  const providers = getDependentCareProviderFacts(inputs.facts);
  const persons = getDependentCareQualifyingPersonFacts(inputs.facts).map((fact) =>
    personRow(inputs, fact.factKey, fact.person),
  );
  const benefits = sum(
    ...factsInCategory(inputs, "wages")
      .filter((row) => isW2FactKey(row.key))
      .map((row) => (row.value as W2FactValue).box10),
  );
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
    dependentCareTaxpayerW2Wages: owners.taxpayer,
    dependentCareSpouseW2Wages: owners.spouse,
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
