import {
  CA_DEPENDENT_CARE_KEYS,
  DEPENDENT_CARE_KEYS,
  getDependentCareProviderFacts,
  makeDependentFactKey,
  type CaHouseholdFundsEntry,
  type CaPriorYearDependentCareFactValue,
  type DependentCareProviderFact,
  type DependentCareQualifyingPersonFactValue,
  type DependentFactValue,
} from "../../../facts/index.js";
import { qualifyingPersonRows } from "../../../federal/2441/resolveInfo.js";
import { agiFloor } from "../../../federal/schedule-eic/possible.js";
import {
  filingStatusOf,
  missingInputs,
  num,
  resolveMustFile,
  text,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import { phone, ssnOf } from "../../../values.js";
import type { CaCarePersonRow, CaCareProviderRow, Form3506FilingInfo } from "./filingInfo.js";
import { FEDERAL_AGI_LIMIT } from "./lines.js";

type Address = { line1: string; city: string; state: string; zip: string };

const CALIFORNIA = "CA";
/* Column (d): "50% or less physical custody ... you do not qualify" (ca-3506-inst-2025::sec::column-d::b01). */
const CUSTODY_PERCENT_LIMIT = 50;
/* Line 1e: a tax-exempt organization enters "Tax-exempt" (ca-3506-inst-2025::sec::line-1e::b01). */
const TAX_EXEMPT = "Tax-exempt";

/* Line 1c: the ten digits, or undefined (asked again) when the stated number has fewer or more. */
function phoneOf(raw: string | undefined) {
  if (raw === undefined) return undefined;
  try {
    return phone(raw);
  } catch {
    return undefined;
  }
}

const oneLine = (address: Address) =>
  `${address.line1}, ${address.city}, ${address.state} ${address.zip}`;

function homeAddress(inputs: ResolverInputs): Address | undefined {
  const parts = ["street", "city", "state", "zip"].map((part) =>
    text(inputs, `identity.address.${part}`),
  );
  if (parts.includes(undefined)) return undefined;
  const [line1, city, state, zip] = parts as string[];
  return { line1, city, state, zip };
}

/*
 * Line 1f: where the care was given. A stated place first; else a household
 * employee works in the taxpayer's home, and anyone else gives care at their
 * own address (QUESTIONS.md). Undefined while the home address is missing.
 */
function placeOfCare(fact: DependentCareProviderFact, home: Address | undefined) {
  const { provider } = fact;
  return provider.careAddress ?? (provider.householdEmployee ? home : provider.address);
}

/* Line 1d: stated, or known from the provider's kind. */
function providerTypeOf(fact: DependentCareProviderFact): CaCareProviderRow["providerType"] {
  const { provider } = fact;
  if (provider.providerType !== undefined) return provider.providerType;
  if (provider.householdEmployee) return "person";
  return provider.taxExempt === true ? "organization" : undefined;
}

/* Line 1: the providers whose care was in California, or whose place of care is not known. */
function providerRows(inputs: ResolverInputs) {
  const home = homeAddress(inputs);
  const providers = getDependentCareProviderFacts(inputs.facts).map((fact) => ({
    fact,
    place: placeOfCare(fact, home),
  }));
  const rows: CaCareProviderRow[] = providers
    .filter(({ place }) => place === undefined || place.state === CALIFORNIA)
    .map(({ fact, place }) => ({
      factKey: fact.factKey,
      name: fact.provider.name,
      address: oneLine(fact.provider.address),
      phone: phoneOf(fact.provider.phone),
      providerType: providerTypeOf(fact),
      tin: fact.provider.taxExempt === true ? TAX_EXEMPT : ssnOf(fact.provider.tin),
      taxExempt: fact.provider.taxExempt === true,
      careAddress: place === undefined ? undefined : oneLine(place),
      amountPaid: fact.provider.amountPaid,
      employerProvided: fact.provider.employerProvided === true,
    }));
  const allInCalifornia = providers.every(({ place }) => place?.state === CALIFORNIA);
  return { rows, total: providers.length, allInCalifornia };
}

/*
 * Line 2 column (e): the stated California part; all of it when every
 * provider gave care in California; undefined (asked) when only some did.
 */
function californiaExpenses(
  person: DependentCareQualifyingPersonFactValue,
  providers: ReturnType<typeof providerRows>,
): number | undefined {
  if (person.californiaExpensesPaid !== undefined) return person.californiaExpensesPaid;
  if (providers.total === 0) return 0;
  return providers.allInCalifornia ? person.expensesPaid : undefined;
}

/*
 * Line 2: Form 2441's qualifying persons, when some care was given in
 * California, less a person in the taxpayer's custody 50% of the year or less.
 */
function personRows(inputs: ResolverInputs, providers: ReturnType<typeof providerRows>) {
  if (providers.rows.length === 0) return [];
  return qualifyingPersonRows(inputs).flatMap(({ row, complete }) => {
    const person = inputs.factByKey.get(row.factKey) as DependentCareQualifyingPersonFactValue;
    const custody = person.physicalCustodyPercent;
    if (custody !== undefined && custody <= CUSTODY_PERCENT_LIMIT) return [];
    const dependent =
      person.dependentSlug === undefined
        ? undefined
        : (inputs.factByKey.get(makeDependentFactKey(person.dependentSlug)) as
            DependentFactValue | undefined);
    const caRow: CaCarePersonRow = {
      factKey: row.factKey,
      firstName: row.firstName,
      lastName: row.lastName,
      ssn: ssnOf(row.ssn),
      dob: person.dob ?? dependent?.dob,
      disabled: person.unableToCareForSelf === true,
      custodyPercent: custody,
      californiaExpenses: californiaExpenses(person, providers),
    };
    return [{ row: caRow, complete, expensesPaid: row.expensesPaid }];
  });
}

/*
 * Who files (ca-3506-inst-2025::sec::a-purpose::b01, ::c-qualifications::b01-b02):
 * Form 540 files, a qualifying person had care in California, a married
 * filer who files separately meets Section E, and federal AGI can be
 * $100,000 or less (agiFloor, a lower bound; unknown errs toward filing).
 */
function claimsCaliforniaCredit(
  inputs: ResolverInputs,
  persons: ReturnType<typeof personRows>,
): boolean {
  const status = filingStatusOf(inputs);
  const expenses = persons.some(
    ({ row, expensesPaid }) => (row.californiaExpenses ?? expensesPaid) > 0,
  );
  const separateBlocked =
    status === "married_filing_separately" &&
    inputs.factByKey.get(DEPENDENT_CARE_KEYS.marriedSeparatelyTreatedAsUnmarried) === false;
  const agi = agiFloor(inputs, status === "married_filing_jointly");
  return expenses && !separateBlocked && !(agi !== undefined && agi > FEDERAL_AGI_LIMIT);
}

/* Worksheet line 2: the California answer; 0 with no 2024 expenses paid in 2025 at all. */
function priorYearExpensesPaid(inputs: ResolverInputs): number | undefined {
  const stated = num(inputs, CA_DEPENDENT_CARE_KEYS.priorYearExpensesPaid);
  if (stated !== undefined) return stated;
  return num(inputs, DEPENDENT_CARE_KEYS.priorYearExpensesPaid) === 0 ? 0 : undefined;
}

/* The worksheet answers; a joint return needs the spouse's 2024 earned income too (line 7). */
function worksheetAnswers(inputs: ResolverInputs): CaPriorYearDependentCareFactValue | undefined {
  const answers = inputs.factByKey.get(CA_DEPENDENT_CARE_KEYS.priorYearWorksheet) as
    CaPriorYearDependentCareFactValue | undefined;
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  return joint && answers?.spouseEarnedIncome === undefined ? undefined : answers;
}

function missingKeys(
  inputs: ResolverInputs,
  providers: ReturnType<typeof providerRows>,
  persons: ReturnType<typeof personRows>,
): string[] {
  const federalPrior = num(inputs, DEPENDENT_CARE_KEYS.priorYearExpensesPaid);
  const prior = priorYearExpensesPaid(inputs);
  const incompleteProviders = providers.rows.filter(
    (row) =>
      row.careAddress === undefined || row.phone === undefined || row.providerType === undefined,
  );
  const incompletePersons = persons.filter(
    ({ row, complete }) => !complete || row.californiaExpenses === undefined,
  );
  return [
    ...incompleteProviders.map((row) => row.factKey),
    ...incompletePersons.map(({ row }) => row.factKey),
    ...missingInputs({
      [CA_DEPENDENT_CARE_KEYS.householdFunds]: inputs.factByKey.get(
        CA_DEPENDENT_CARE_KEYS.householdFunds,
      ),
      ...(federalPrior !== undefined && federalPrior > 0
        ? { [CA_DEPENDENT_CARE_KEYS.priorYearExpensesPaid]: prior }
        : {}),
      ...(prior !== undefined && prior > 0
        ? { [CA_DEPENDENT_CARE_KEYS.priorYearWorksheet]: worksheetAnswers(inputs) }
        : {}),
    }),
  ];
}

export function resolve3506Info(inputs: ResolverInputs): Form3506FilingInfo {
  const providers = providerRows(inputs);
  const persons = personRows(inputs, providers);
  const files540 = inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true;
  const claims = claimsCaliforniaCredit(inputs, persons);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_3506",
    fallbacks: [
      {
        rule: `fallback: Form 540 files (${files540}) and the California credit may apply (${claims}): care in California, a married filer filing separately meets Section E, federal AGI of $100,000 or less`,
        value: files540 && claims,
        triggeredByFactKeys: [...providers.rows, ...persons.map(({ row }) => row)].map(
          (row) => row.factKey,
        ),
        triggeredByDecisionKeys: ["decisions.scope.must_file_ca_540"],
      },
    ],
  });
  return {
    mustFile: { "form-3506": resolution },
    missingInputs: {
      "form-3506": resolution.value === true ? missingKeys(inputs, providers, persons) : [],
    },
    caCareProviders: providers.rows,
    caCarePersons: persons.map(({ row }) => row),
    caPriorYearExpensesPaid: priorYearExpensesPaid(inputs),
    caPriorYearWorksheet: inputs.factByKey.get(CA_DEPENDENT_CARE_KEYS.priorYearWorksheet) as
      CaPriorYearDependentCareFactValue | undefined,
    caHouseholdFunds: inputs.factByKey.get(CA_DEPENDENT_CARE_KEYS.householdFunds) as
      CaHouseholdFundsEntry[] | undefined,
  };
}
