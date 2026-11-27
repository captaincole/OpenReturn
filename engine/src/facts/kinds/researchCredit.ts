/*
 * Form 6765: the research the taxpayer does in a sole proprietorship
 * (Schedule C), for the credit for increasing research activities. One fact
 * per return: the members of a group of trades or businesses under common
 * control "are treated as a single taxpayer" (irs-6765-inst-2025::sec::member-of-controlled-group-of::b01),
 * so one Form 6765 figures the credit of all of a taxpayer's businesses. The
 * taxpayer states every amount from the business's books; no official form
 * holds them.
 *
 * A research credit passed through on a Schedule K-1 is not this fact: the K-1
 * holds it (box 15 or box 13, code M), and Form 6765 line 29 shows it. A
 * taxpayer whose only research credit is from a K-1 files no Form 6765
 * (irs-6765-inst-2025::sec::general-instructions::b01).
 *
 * Without the reduced credit election (Item A), the domestic research
 * expenditures the business deducts go down by the credit
 * (irs-6765-inst-2025::sec::item-a-section-280c-election::b01):
 * activitiesOnReturn.ts takes it off the business's Schedule C lines.
 */

type FactRow = { key: string; value: unknown; category: string };

/* Line 45 and column 56: contract research paid, by who performed it (irs-6765-inst-2025::sec::line-45::b01, ::b02). */
export interface ContractResearchPaid {
  /* Qualified energy research performed by an eligible small business, a university or a federal laboratory: 100%. */
  energyResearch?: number;
  /* Qualified research by a qualified research consortium: 75%. */
  researchConsortium?: number;
  /* All other qualified research by any other person: 65%. */
  other?: number;
}

/* Section F lines 42 to 45, when Section G is not filled. */
export interface ResearchExpenses {
  /* Line 42: in-house wages for qualified services, without wages used for the work opportunity credit. */
  wages?: number;
  /* Line 43: supplies used in the conduct of qualified research. */
  supplies?: number;
  /* Line 44: rental or lease of computers off the premises, less amounts received for substantially identical property. */
  computerRental?: number;
  /* Line 45 before the percentages. */
  contractResearch?: ContractResearchPaid;
}

/* Column 49(d) (irs-6765-inst-2025::sec::statistical-sampling::b02). */
export type BusinessComponentType = "product" | "process" | "all_others";
/* Column 49(e) (irs-6765-inst-2025::sec::statistical-sampling::b03). */
export type ResearchSoftwareType = "ius" | "dfs" | "non_ius" | "excepted";

export const BUSINESS_COMPONENT_TYPES: ReadonlyArray<BusinessComponentType> = [
  "product",
  "process",
  "all_others",
];
export const RESEARCH_SOFTWARE_TYPES: ReadonlyArray<ResearchSoftwareType> = [
  "ius",
  "dfs",
  "non_ius",
  "excepted",
];

/* One row of Section G (lines 49 to 56). */
export interface ResearchBusinessComponent {
  /* Column 49(c): the name or identifier the books use. */
  name: string;
  /*
   * The "Aggregate Business Components" entry: the components left after the
   * 80%/Top 50, with only columns 50 to 56 (irs-6765-inst-2025::sec::d-non-ius::b01).
   */
  aggregate?: boolean;
  /* Column 49(d); asked for every entry but the aggregate one. */
  type?: BusinessComponentType;
  /* Column 49(e): the software type, when the component is software. */
  software?: ResearchSoftwareType;
  directResearchWages?: number; // 50
  directSupervisionWages?: number; // 51
  directSupportWages?: number; // 52
  supplies?: number; // 54
  computerRental?: number; // 55
  contractResearch?: ContractResearchPaid; // 56, before the percentages
}

/* One year of a start-up company's history for the fixed-base percentage. */
export interface ResearchBaseYear {
  qualifiedResearchExpenses: number;
  grossReceipts: number;
}

/* Line 6, the fixed-base percentage (irs-6765-inst-2025::sec::line-6::b02, ::b03). */
export type FixedBaseInputs =
  | {
      /* A company that had gross receipts and QREs in 3 or more tax years from 1984 to 1988. */
      kind: "existing";
      qualifiedResearchExpenses1984To1988: number;
      grossReceipts1984To1988: number;
    }
  | {
      kind: "start_up";
      /* This year's place among the tax years beginning after 1993 with QREs: 1 for the first. */
      yearWithQres: number;
      /*
       * The years the rule of this place names, any order: the 4th and 5th for
       * the 6th year; the 5th and 6th for the 7th; the 5th to 7th for the 8th;
       * the 5th to 8th for the 9th; the 5th to 9th for the 10th; 5 of the 5th
       * to 10th from the 11th on. None through the 5th year (3%).
       */
      baseYears?: ResearchBaseYear[];
    };

/* Section D: the qualified small business payroll tax election. */
export interface ResearchPayrollTaxElection {
  /* Line 34 as elected, before the $500,000 cap. */
  amount: number;
  /* Line 33b: payroll tax is reported for a different EIN. */
  differentEin?: boolean;
  /* The 2025 gross receipts of all the taxpayer's trades or businesses (the qualified small business test). */
  grossReceipts: number;
  /* The first tax year with gross receipts in any trade or business. */
  firstYearWithGrossReceipts: number;
  /* The number of preceding tax years with a payroll tax election. */
  priorElections: number;
}

export type ResearchCreditMethod = "regular" | "alternative_simplified";

export interface ResearchCreditFactValue {
  /* The Schedule C business ("business.<id>") that does the research and deducts its expenses. */
  businessKey: string;
  /* Item A: the reduced credit under section 280C. */
  reducedCreditElection: boolean;
  /* Item B: a member of a controlled group or a business under common control with another taxpayer. */
  controlledGroup: boolean;
  /* Section A (regular) or Section B (the ASC); asked when there are QREs or energy consortia payments. */
  method?: ResearchCreditMethod;
  /* Line 1 or 14: amounts paid to energy research consortia. */
  energyConsortiaPayments?: number;
  /* Section F, when Section G is not filled. A fact has this or businessComponents, not both. */
  expenses?: ResearchExpenses;
  /* Section G; Section F then takes its totals. */
  businessComponents?: ResearchBusinessComponent[];
  /* Line 37: every business component that generates the QREs, not only the ones in Section G. */
  businessComponentCount: number;
  /* Section A: line 6. */
  fixedBase?: FixedBaseInputs;
  /*
   * Gross receipts, less returns and allowances, of the preceding tax years,
   * oldest first, at most 4 (annualized for a short year): line 7 averages
   * them, and the eligible small business test the last 3.
   */
  grossReceiptsPriorYears: number[];
  /* Section B, line 21: the QREs of each of the 3 preceding tax years. */
  priorThreeYearsQres?: number[];
  /* Line 27: the part of Form 8932 line 2 for wages also in this credit. */
  differentialWageCreditPortion?: number;
  /* Line 39. */
  acquiredOrDisposed: boolean;
  /* Line 40. */
  newExpenseCategories: boolean;
  /* Form 3800's research credit limitation: the taxable income attributable to the business. */
  attributableTaxableIncome?: number;
  payrollTaxElection?: ResearchPayrollTaxElection;
}

export interface ResearchCreditFact {
  key: string;
  value: ResearchCreditFactValue;
}

export const RESEARCH_CREDIT_KEY = "research_credit";
const RESEARCH_CATEGORY = "self_employment";
const ASC_PRIOR_YEARS = 3;
const MAX_PRIOR_YEARS = 4;

const isAmount = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);
const isNumber = (value: unknown): boolean => typeof value === "number" && isAmount(value);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isOptionalBoolean = (value: unknown) => value === undefined || typeof value === "boolean";
const isAmountList = (value: unknown, min: number, max: number) =>
  Array.isArray(value) && value.length >= min && value.length <= max && value.every(isNumber);
const isOneOf = <T>(value: unknown, options: ReadonlyArray<T>) =>
  value === undefined || options.includes(value as T);

const isContract = (value: unknown) =>
  value === undefined ||
  (isRecord(value) &&
    isAmount(value.energyResearch) &&
    isAmount(value.researchConsortium) &&
    isAmount(value.other));

const isExpenses = (value: unknown) =>
  isRecord(value) &&
  isAmount(value.wages) &&
  isAmount(value.supplies) &&
  isAmount(value.computerRental) &&
  isContract(value.contractResearch);

const COMPONENT_AMOUNTS = [
  "directResearchWages",
  "directSupervisionWages",
  "directSupportWages",
  "supplies",
  "computerRental",
] as const;

const isComponent = (value: unknown) =>
  isRecord(value) &&
  typeof value.name === "string" &&
  isOptionalBoolean(value.aggregate) &&
  isOneOf(value.type, BUSINESS_COMPONENT_TYPES) &&
  isOneOf(value.software, RESEARCH_SOFTWARE_TYPES) &&
  COMPONENT_AMOUNTS.every((name) => isAmount(value[name])) &&
  isContract(value.contractResearch);

const isBaseYear = (value: unknown) =>
  isRecord(value) && isNumber(value.qualifiedResearchExpenses) && isNumber(value.grossReceipts);

function isFixedBase(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  if (value.kind === "existing") {
    return (
      isNumber(value.qualifiedResearchExpenses1984To1988) && isNumber(value.grossReceipts1984To1988)
    );
  }
  return (
    value.kind === "start_up" &&
    Number.isInteger(value.yearWithQres) &&
    (value.yearWithQres as number) >= 1 &&
    (value.baseYears === undefined ||
      (Array.isArray(value.baseYears) && value.baseYears.every(isBaseYear)))
  );
}

const isPayrollElection = (value: unknown) =>
  value === undefined ||
  (isRecord(value) &&
    isNumber(value.amount) &&
    isOptionalBoolean(value.differentEin) &&
    isNumber(value.grossReceipts) &&
    Number.isInteger(value.firstYearWithGrossReceipts) &&
    Number.isInteger(value.priorElections) &&
    (value.priorElections as number) >= 0);

/* Exactly one of the two places for the QREs: Section F's totals or Section G's rows. */
const hasOneQreSource = (value: Record<string, unknown>) =>
  value.businessComponents === undefined
    ? value.expenses === undefined || isExpenses(value.expenses)
    : value.expenses === undefined &&
      Array.isArray(value.businessComponents) &&
      value.businessComponents.length > 0 &&
      value.businessComponents.every(isComponent);

const methodFits = (value: Record<string, unknown>) =>
  value.method === undefined ||
  (value.method === "regular" && isFixedBase(value.fixedBase) && value.fixedBase !== undefined) ||
  (value.method === "alternative_simplified" &&
    isAmountList(value.priorThreeYearsQres, ASC_PRIOR_YEARS, ASC_PRIOR_YEARS));

function isResearchCredit(value: unknown): value is ResearchCreditFactValue {
  if (!isRecord(value)) return false;
  return (
    typeof value.businessKey === "string" &&
    typeof value.reducedCreditElection === "boolean" &&
    typeof value.controlledGroup === "boolean" &&
    isOneOf(value.method, ["regular", "alternative_simplified"]) &&
    methodFits(value) &&
    isAmount(value.energyConsortiaPayments) &&
    hasOneQreSource(value) &&
    Number.isInteger(value.businessComponentCount) &&
    (value.businessComponentCount as number) >= 0 &&
    isAmountList(value.grossReceiptsPriorYears, 1, MAX_PRIOR_YEARS) &&
    isAmount(value.differentialWageCreditPortion) &&
    typeof value.acquiredOrDisposed === "boolean" &&
    typeof value.newExpenseCategories === "boolean" &&
    (value.attributableTaxableIncome === undefined ||
      (typeof value.attributableTaxableIncome === "number" &&
        Number.isFinite(value.attributableTaxableIncome))) &&
    isPayrollElection(value.payrollTaxElection)
  );
}

/* The research credit fact; malformed when it is there and its fields do not check. */
export function readResearchCreditFact(facts: ReadonlyArray<FactRow>): {
  fact?: ResearchCreditFact;
  malformed: boolean;
} {
  const row = facts.find(
    (each) => each.category === RESEARCH_CATEGORY && each.key === RESEARCH_CREDIT_KEY,
  );
  if (row === undefined) return { malformed: false };
  if (!isResearchCredit(row.value)) return { malformed: true };
  return { fact: { key: row.key, value: row.value }, malformed: false };
}
