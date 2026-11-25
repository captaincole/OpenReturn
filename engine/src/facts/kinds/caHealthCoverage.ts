/*
 * FTB 3853: California health coverage, by person and by month. One fact for
 * each member of the applicable household (ca-3853-inst-2025::sec::part-iii::b02):
 * the taxpayer, the spouse on a joint return, each claimed dependent, and each
 * person the taxpayer can claim but does not (lines-1-12::b01). The fact holds
 * what the person states: the months with coverage, the exemptions and the
 * Exemption Certificate Numbers the Marketplace granted. The engine figures
 * the codes the instructions settle by arithmetic: the birth months (code I),
 * coverage considered unaffordable from a stated offer (code A) and the short
 * coverage gap (code C).
 *
 * `health_coverage.full_year_mec` (Form 540 line 92) stays the first answer:
 * false files the form.
 */

type FactRow = { key: string; value: unknown; category: string };

/* The exemption codes of the Types of Coverage Exemptions chart (coverage-exemption-granted-by::b01–b04). */
export const CA_COVERAGE_EXEMPTION_CODES = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
] as const;
export type CaCoverageExemptionCode = (typeof CA_COVERAGE_EXEMPTION_CODES)[number];

/* A month of 2025: 1 is January, 12 is December. */
export type CoverageMonth = number;

export interface CaStatedExemption {
  code: CaCoverageExemptionCode;
  /*
   * The months the exemption covers, for at least one day each
   * (part-iii-2::b01). Code B covers the whole year by rule
   * (example-2-2::b02), whatever months are stated.
   */
  months: CoverageMonth[];
}

/*
 * An offer to test for code A (lines-1-12-2::b03; the Affordability Worksheet,
 * example-2-5::b06–b08). List them in the worksheet's order of situations: for
 * each month the first test that covers it is used.
 */
export type CaAffordabilityTest =
  | {
      /*
       * Situations 1 and 2: employer coverage. `contribution` is what the
       * person would pay for the lowest cost coverage for the months listed
       * (the Annualized Required Contribution Worksheet, line 1), after the
       * employer arrangements (annualized-required-contribution-worksheet::b01–b05).
       */
      kind: "employer";
      months: CoverageMonth[];
      contribution: number;
    }
  | {
      /*
       * Situation 3: no employer coverage. The Marketplace Coverage
       * Affordability Worksheet's line 1 (the lowest cost bronze plan) and
       * line 10 (the second lowest cost silver plan), monthly, from
       * coveredca.com/3853 (members-of::b04–b06).
       */
      kind: "marketplace";
      months: CoverageMonth[];
      bronzeMonthlyPremium: number;
      slcspMonthlyPremium: number;
    };

/* Part I for a person the taxpayer can claim but does not: not on the return, so stated here. */
export interface CaUnclaimedPerson {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  /* An SSN, ITIN or ATIN; absent prints "No ID" (social-security-number-ssn::b01). */
  ssn?: string;
  dob?: string; // MM/DD/YYYY
}

export interface CaHealthCoverageFactValue {
  /*
   * The months with minimum essential coverage for at least one day
   * (part-iii::b08): code Z. Empty for no coverage at all.
   */
  coveredMonths: CoverageMonth[];
  /* Exemptions the person claims or the Marketplace granted, with their months. */
  exemptions?: CaStatedExemption[];
  /*
   * Part I ECN 1 to 3: each Exemption Certificate Number the Marketplace
   * granted, or "pending" (exemption-certificate-number-ecn::b01). Absent or
   * empty prints "No ECN".
   */
  ecns?: string[];
  affordabilityTests?: CaAffordabilityTest[];
  /*
   * The continuous months with no coverage that end in December 2024 (0 when
   * covered in December 2024). The short coverage gap counts them for a gap
   * that starts in January 2025 (example-2-4::b01). Asked only then.
   */
  uncoveredMonthsBefore2025?: number;
  /*
   * A dependent or a person not claimed: true when the person must file a
   * 2025 return (ca-3853-inst-2025::sec::part-iii::b05). Then `magi` is the
   * person's Form 540 line 17 plus California tax-exempt interest, and it
   * counts in the applicable household income. Not asked for a child on FTB 3803.
   */
  requiredToFile?: boolean;
  magi?: number;
  /* Form 1040 line 6a less 6b of a dependent who must file (Marketplace worksheet line 3). Absent: none. */
  nontaxableSocialSecurity?: number;
  /* Only on an `unclaimed` key. */
  person?: CaUnclaimedPerson;
}

const COVERAGE_CATEGORY = "health_coverage";
const KEY_START = "ca_health_coverage.";

export type CaCoverageMemberKind = "taxpayer" | "spouse" | "dependent" | "unclaimed";

export const CA_HEALTH_COVERAGE_KEYS = {
  taxpayer: `${KEY_START}taxpayer`,
  spouse: `${KEY_START}spouse`,
  /* Step 1, question 1: someone can claim the taxpayer as a dependent (step-1-all-filers::b01). */
  claimableAsDependent: `${KEY_START}claimable_as_dependent`,
  /*
   * The household's gross income for the Part II test
   * (line-1-applicable-household-income-or-gross::b01): all income not exempt
   * from tax (steps-to-determine-filing-requirement::b01). Asked only when the
   * household income holds amounts that gross income does not.
   */
  grossIncome: `${KEY_START}gross_income`,
  /*
   * Premiums for employer coverage paid through a salary reduction
   * arrangement and excluded from wages: they raise the household income for
   * the code A test (lines-1-12-2::b05, example-2-5::b07). Asked only with an
   * offer to test; 0 when none.
   */
  salaryReductionPremiums: `${KEY_START}salary_reduction_premiums`,
} as const;

export function makeCaHealthCoverageDependentKey(dependentSlug: string): string {
  return `${KEY_START}dependent.${dependentSlug}`;
}

export function makeCaHealthCoverageUnclaimedKey(personSlug: string): string {
  return `${KEY_START}unclaimed.${personSlug}`;
}

/* The person's slug on a dependent or unclaimed key; undefined for any other key. */
function slugAfter(key: string, kind: "dependent" | "unclaimed"): string | undefined {
  const start = `${KEY_START}${kind}.`;
  if (!key.startsWith(start)) return undefined;
  const slug = key.slice(start.length);
  return slug === "" || slug.includes(".") ? undefined : slug;
}

export function isCaHealthCoverageUnclaimedKey(key: string): boolean {
  return slugAfter(key, "unclaimed") !== undefined;
}

export interface CaUnclaimedCoverageFact {
  key: string;
  slug: string;
  value: CaHealthCoverageFactValue;
}

/* Every person the taxpayer can claim but does not, in the order recorded. */
export function getCaUnclaimedCoverageFacts(
  facts: ReadonlyArray<FactRow>,
): CaUnclaimedCoverageFact[] {
  return facts.flatMap((row) => {
    const slug = slugAfter(row.key, "unclaimed");
    return row.category === COVERAGE_CATEGORY && slug !== undefined
      ? [{ key: row.key, slug, value: row.value as CaHealthCoverageFactValue }]
      : [];
  });
}
