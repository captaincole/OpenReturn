/*
 * The one vocabulary of K-1 items (README.md, layer 3). The three box tables
 * map every box and code to one of these types; every form after them reads
 * items by type, never by box. A type that groups many codes with different
 * destinations (credits, AMT items, other income) carries the code's meaning
 * in the item's detail, which the box table also sets.
 */

/*
 * What an item's amount does on the return:
 * - income: a signed amount that enters income (a loss is negative);
 * - subset: part of another item's amount (qualified dividends are part of
 *   ordinary dividends), so it adds nothing by itself;
 * - deduction: a positive amount the owner may deduct, subject to the limits;
 * - credit: a credit or a credit recapture;
 * - payment: tax paid for the owner (backup withholding, estimated tax);
 * - basis: an amount that moves the owner's basis but not income;
 * - information: what another form needs, not an amount of income.
 * The not_modeled type has role unknown: the table does not know its box or code.
 */
export type ItemRole =
  "income" | "subset" | "deduction" | "credit" | "payment" | "basis" | "information" | "unknown";

interface TypeInfo {
  label: string;
  role: ItemRole;
  /*
   * Portfolio income or deduction, which the passive rules skip
   * (irs-1120sk1-inst-2025::sec::portfolio-income::b01,
   * irs-1065k1-inst-2025::sec::portfolio-income::b01).
   */
  portfolio: boolean;
}

const income = (label: string, portfolio = false): TypeInfo => ({
  label,
  role: "income",
  portfolio,
});
const subset = (label: string, portfolio = false): TypeInfo => ({
  label,
  role: "subset",
  portfolio,
});
const deduction = (label: string, portfolio = false): TypeInfo => ({
  label,
  role: "deduction",
  portfolio,
});
const kind = (label: string, role: ItemRole): TypeInfo => ({ label, role, portfolio: false });

export const ITEM_TYPES = {
  ordinary_business_income: income("ordinary business income (loss)"),
  net_rental_real_estate_income: income("net rental real estate income (loss)"),
  other_net_rental_income: income("other net rental income (loss)"),
  guaranteed_payment_services: income("guaranteed payments for services"),
  guaranteed_payment_capital: income("guaranteed payments for capital"),
  guaranteed_payments_total: subset("total guaranteed payments"),
  interest: income("interest income", true),
  ordinary_dividends: income("ordinary dividends", true),
  qualified_dividends: subset("qualified dividends", true),
  royalties: income("royalties", true),
  net_short_term_capital_gain: income("net short-term capital gain (loss)", true),
  net_long_term_capital_gain: income("net long-term capital gain (loss)", true),
  collectibles_gain: subset("collectibles (28%) gain (loss)", true),
  unrecaptured_section_1250_gain: subset("unrecaptured section 1250 gain"),
  net_section_1231_gain: income("net section 1231 gain (loss)"),
  other_portfolio_income: income("other portfolio income (loss)", true),
  other_income: income("other income (loss)"),
  section_179_deduction: deduction("section 179 deduction"),
  charitable_contribution: deduction("charitable contribution"),
  investment_interest_expense: deduction("investment interest expense", true),
  portfolio_deduction: deduction("deduction related to portfolio income", true),
  other_deduction: deduction("other deduction"),
  directly_apportioned_deduction: deduction("directly apportioned deduction"),
  estate_tax_deduction: deduction("estate tax deduction"),
  termination_deduction: deduction("excess deduction on termination"),
  capital_loss_carryover: deduction("capital loss carryover"),
  net_operating_loss_carryover: deduction("net operating loss carryover"),
  self_employment_earnings: kind("net earnings (loss) from self-employment", "information"),
  gross_farming_fishing_income: kind("gross farming or fishing income", "information"),
  gross_nonfarm_income: kind("gross nonfarm income", "information"),
  credit: kind("credit", "credit"),
  credit_recapture: kind("credit recapture", "credit"),
  backup_withholding: kind("backup withholding", "payment"),
  estimated_tax_payment: kind("estimated tax payment", "payment"),
  tax_exempt_interest: kind("tax-exempt interest income", "basis"),
  other_tax_exempt_income: kind("other tax-exempt income", "basis"),
  nondeductible_expenses: kind("nondeductible expenses", "basis"),
  distribution: kind("distribution", "basis"),
  loan_repayment: kind("repayment of loans from shareholders", "basis"),
  foreign_tax_paid: kind("foreign taxes paid or accrued", "basis"),
  amt_item: kind("alternative minimum tax item", "information"),
  investment_income: kind("investment income", "information"),
  investment_expenses: kind("investment expenses", "information"),
  net_investment_income: kind("net investment income information", "information"),
  section_199a_information: kind("section 199A information", "information"),
  gross_receipts_448c: kind("gross receipts for section 448(c)", "information"),
  other_information: kind("other information", "information"),
  not_modeled: kind("a box or code the engine does not know", "unknown"),
} as const satisfies Record<string, TypeInfo>;

/* The closed list of item types. */
export type ItemType = keyof typeof ITEM_TYPES;

export function roleOf(type: ItemType): ItemRole {
  return ITEM_TYPES[type].role;
}

export function isPortfolio(type: ItemType): boolean {
  return ITEM_TYPES[type].portfolio;
}

export function labelOf(type: ItemType): string {
  return ITEM_TYPES[type].label;
}

/* A loss or a deduction: an item the four loss limits can hold back. */
export function isLossOrDeduction(type: ItemType, amount: number | undefined): boolean {
  const role = roleOf(type);
  if (role === "deduction") return (amount ?? 0) !== 0;
  if (role === "income" || role === "unknown") return (amount ?? 0) < 0;
  return false;
}
