/*
 * The applicable household of FTB 3853 from the facts (ca-3853-inst-2025::sec::part-iii::b02,
 * lines-1-12::b01): the taxpayer first, the spouse on a joint return, each
 * claimed dependent in the order recorded, then each person the taxpayer can
 * claim but does not. Each member's coverage fact, and the answers the form
 * asks while one waits.
 */

import { birthMonthIn, bornBeforeJan2_1961, firstFullMonthAtAge } from "../../../birthDate.js";
import {
  CA_HEALTH_COVERAGE_KEYS,
  SPOUSE_KEYS,
  getCaUnclaimedCoverageFacts,
  getClaimedDependentFacts,
  getDependentFacts,
  isDividendFactKey,
  isInterestFactKey,
  makeCaHealthCoverageDependentKey,
  makeChildInvestmentIncomeFactKey,
  makeDependentFactKey,
  type CaHealthCoverageFactValue,
  type ChildInvestmentIncomeFactValue,
} from "../../../facts/index.js";
import {
  filingStatusOf,
  num,
  sumInvestmentBox,
  sumW2Box,
  text,
  type ResolverInputs,
} from "../../../resolverInputs.js";
import { ssnOf } from "../../../values.js";
import { needsMonthsBefore2025 } from "./codes.js";
import type { Ca3853Household, Ca3853Member } from "./filingInfo.js";
import { ADULT_AGE, filingThresholds, type ThresholdStatus } from "./lines.js";

const TAX_YEAR = 2025;
const YEAR_TURNING_18 = TAX_YEAR - ADULT_AGE;
const MUST_FILE_3803_KEY = "decisions.scope.must_file_3803";

type Person = Pick<Ca3853Member, "firstName" | "middleInitial" | "lastName" | "idNumber" | "dob">;

function member(
  inputs: ResolverInputs,
  base: Pick<Ca3853Member, "factKey" | "kind" | "dependentSlug">,
  person: Person,
  stated?: CaHealthCoverageFactValue,
): Ca3853Member {
  const coverage =
    stated ?? (inputs.factByKey.get(base.factKey) as CaHealthCoverageFactValue | undefined);
  return {
    ...base,
    ...person,
    adultFromMonth: firstFullMonthAtAge(person.dob, ADULT_AGE, TAX_YEAR),
    turned18In2025: birthMonthIn(person.dob, YEAR_TURNING_18) !== undefined,
    coverage,
    codeInputs:
      coverage === undefined
        ? undefined
        : {
            coveredMonths: coverage.coveredMonths,
            exemptions: coverage.exemptions ?? [],
            birthMonth: birthMonthIn(person.dob, TAX_YEAR),
            uncoveredMonthsBefore2025: coverage.uncoveredMonthsBefore2025,
          },
  };
}

function filers(inputs: ResolverInputs): Ca3853Member[] {
  const taxpayer = member(
    inputs,
    { factKey: CA_HEALTH_COVERAGE_KEYS.taxpayer, kind: "taxpayer" },
    {
      firstName: text(inputs, "identity.name.first"),
      middleInitial: text(inputs, "identity.name.middle_initial"),
      lastName: text(inputs, "identity.name.last"),
      idNumber: ssnOf(text(inputs, "identity.ssn")),
      dob: text(inputs, "identity.dob"),
    },
  );
  if (filingStatusOf(inputs) !== "married_filing_jointly") return [taxpayer];
  const spouse = member(
    inputs,
    { factKey: CA_HEALTH_COVERAGE_KEYS.spouse, kind: "spouse" },
    {
      firstName: text(inputs, SPOUSE_KEYS.firstName),
      middleInitial: text(inputs, SPOUSE_KEYS.middleInitial),
      lastName: text(inputs, SPOUSE_KEYS.lastName),
      idNumber: ssnOf(text(inputs, SPOUSE_KEYS.ssn)),
      dob: text(inputs, SPOUSE_KEYS.dob),
    },
  );
  return [taxpayer, spouse];
}

/* Every member, in the order of Parts I and III. */
export function householdMembers(inputs: ResolverInputs): Ca3853Member[] {
  // A child released to the other parent on Form 8332 is not claimed, so not a member here.
  const dependents = getClaimedDependentFacts(inputs.facts, TAX_YEAR).map(
    ({ dependentSlug, dependent }) =>
      member(
        inputs,
        {
          factKey: makeCaHealthCoverageDependentKey(dependentSlug),
          kind: "dependent",
          dependentSlug,
        },
        {
          firstName: dependent.firstName,
          lastName: dependent.lastName,
          idNumber: ssnOf(dependent.ssn ?? dependent.tin),
          dob: dependent.dob,
        },
      ),
  );
  const unclaimed = getCaUnclaimedCoverageFacts(inputs.facts).map(({ key, value }) =>
    member(
      inputs,
      { factKey: key, kind: "unclaimed" },
      {
        firstName: value.person?.firstName,
        middleInitial: value.person?.middleInitial,
        lastName: value.person?.lastName,
        idNumber: ssnOf(value.person?.ssn),
        dob: value.person?.dob,
      },
      value,
    ),
  );
  return [...filers(inputs), ...dependents, ...unclaimed];
}

/* A dependent whose interest and dividends the parents report on FTB 3803 (Step 3 question 6). */
export function onFtb3803(inputs: ResolverInputs, dependentSlug: string | undefined): boolean {
  if (dependentSlug === undefined) return false;
  return (
    inputs.decisionByKey.get(MUST_FILE_3803_KEY) === true &&
    inputs.factByKey.has(makeChildInvestmentIncomeFactKey(dependentSlug))
  );
}

/* The key that answers a member's date of birth: Part I prints it for everyone (date-of-birth-dob::b01). */
function dobKey(person: Ca3853Member): string {
  if (person.kind === "taxpayer") return "identity.dob";
  if (person.kind === "spouse") return SPOUSE_KEYS.dob;
  if (person.kind === "dependent") return makeDependentFactKey(person.dependentSlug ?? "");
  return person.factKey;
}

/* A member's coverage fact is incomplete: the 2024 months, the filing requirement or the MAGI wait. */
function coverageIncomplete(inputs: ResolverInputs, person: Ca3853Member): boolean {
  const { coverage, codeInputs } = person;
  if (coverage === undefined || codeInputs === undefined) return true;
  if (needsMonthsBefore2025(codeInputs) && coverage.uncoveredMonthsBefore2025 === undefined) {
    return true;
  }
  const files = person.kind === "dependent" || person.kind === "unclaimed";
  if (!files || onFtb3803(inputs, person.dependentSlug)) return false;
  return (
    coverage.requiredToFile === undefined ||
    (coverage.requiredToFile && coverage.magi === undefined)
  );
}

export function memberMissingKeys(inputs: ResolverInputs, members: Ca3853Member[]): string[] {
  return [
    ...members
      .filter((person) => coverageIncomplete(inputs, person))
      .map((person) => person.factKey),
    ...members.filter((person) => person.dob === undefined).map(dobKey),
  ];
}

/* The filers 65 or older on December 31, 2025; undefined while a date of birth waits. */
function people65OrOlder(inputs: ResolverInputs): number | undefined {
  const taxpayer = bornBeforeJan2_1961(text(inputs, "identity.dob"));
  if (filingStatusOf(inputs) !== "married_filing_jointly") {
    return taxpayer === undefined ? undefined : Number(taxpayer);
  }
  const spouse = bornBeforeJan2_1961(text(inputs, SPOUSE_KEYS.dob));
  return taxpayer === undefined || spouse === undefined
    ? undefined
    : Number(taxpayer) + Number(spouse);
}

const THRESHOLD_STATUSES: ReadonlySet<string> = new Set([
  "single",
  "head_of_household",
  "married_filing_jointly",
  "qualifying_surviving_spouse",
]);

/*
 * Gross income matters to Part II only when the household income holds
 * amounts gross income does not: tax-exempt interest (1099-INT boxes 3 and 8,
 * 1099-DIV box 12, a child's on FTB 3803) or a claimed dependent's own MAGI. Not asked
 * when the California wages alone are over the gross income threshold.
 */
function grossIncomeAsked(
  inputs: ResolverInputs,
  members: Ca3853Member[],
  over65?: number,
): boolean {
  const children = getDependentFacts(inputs.facts).map(({ dependentSlug }) =>
    inputs.factByKey.get(makeChildInvestmentIncomeFactKey(dependentSlug)),
  ) as Array<ChildInvestmentIncomeFactValue | undefined>;
  const extras =
    sumInvestmentBox(inputs, "box8", isInterestFactKey) +
      sumInvestmentBox(inputs, "box3", isInterestFactKey) +
      sumInvestmentBox(inputs, "box12", isDividendFactKey) >
      0 ||
    children.some(
      (child) => (child?.taxExemptInterest ?? 0) > 0 || (child?.usObligationInterest ?? 0) > 0,
    ) ||
    members.some(({ kind, coverage }) => kind === "dependent" && coverage?.requiredToFile === true);
  const status = filingStatusOf(inputs);
  if (!extras || status === undefined || !THRESHOLD_STATUSES.has(status) || over65 === undefined) {
    return false;
  }
  const dependents = getClaimedDependentFacts(inputs.facts, TAX_YEAR).length;
  const thresholds = filingThresholds(status as ThresholdStatus, over65, dependents);
  return thresholds !== undefined && sumW2Box(inputs, "box16") <= thresholds.grossIncome;
}

export function resolveHousehold(inputs: ResolverInputs): Ca3853Household {
  const members = householdMembers(inputs);
  const over65 = people65OrOlder(inputs);
  return {
    members,
    claimableAsDependent: inputs.factByKey.get(CA_HEALTH_COVERAGE_KEYS.claimableAsDependent) as
      boolean | undefined,
    grossIncome: num(inputs, CA_HEALTH_COVERAGE_KEYS.grossIncome),
    grossIncomeAsked: grossIncomeAsked(inputs, members, over65),
    salaryReductionPremiums: num(inputs, CA_HEALTH_COVERAGE_KEYS.salaryReductionPremiums),
    usObligationInterest: sumInvestmentBox(inputs, "box3", isInterestFactKey),
    people65OrOlder: over65,
    dependentsClaimed: getClaimedDependentFacts(inputs.facts, TAX_YEAR).length,
  };
}

/* A test for code A: its threshold adds the salary reduction premiums to the household income. */
export const hasAffordabilityTest = (members: Ca3853Member[]) =>
  members.some(({ coverage }) => (coverage?.affordabilityTests ?? []).length > 0);
