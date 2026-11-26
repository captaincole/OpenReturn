/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { farmOwnerOf, type FarmFactValue } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { accrualCreditGap } from "../4136/receivers.js";
import {
  carAndTruckExpenses,
  conservationDeduction,
  depreciationWaits,
  employeeBenefits,
  laborHired,
  OTHER_EXPENSE_ROWS,
  otherExpenseRow,
  otherExpensesOverflow,
  STATED_LINES,
  totalExpenses,
} from "./expenses.js";
import type { ScheduleFFilingInfo } from "./filingInfo.js";
import {
  accrualSales,
  agriculturalTaxable,
  cccForfeitedTaxable,
  cccLoansReported,
  cooperativeTaxable,
  cropInsuranceTaxable,
  defersCropInsurance,
  grossIncome,
  grossIncomeWaits,
  isAccrual,
  line1c,
  line44,
  line47,
  line49,
  line50,
} from "./income.js";
import {
  depreciationGap,
  farmGap,
  farmIncomeGap,
  isLoss,
  netFarmProfit,
  profitBeforeLossRules,
} from "./lines.js";
import type { ScheduleF } from "./types.js";

type Info = ScheduleFFilingInfo;
type Bindings = Partial<{ [K in keyof ScheduleF]: BindingFn<ScheduleF, Info, K> }>;
type Line<V> = (farm: FarmFactValue) => V | undefined;

const OVERFLOW =
  "The farm has more other expenses than lines 32a to 32f hold, and the engine writes no attached statement.";

/* The farm this copy is for. */
export function farmOf(info: Info): FarmFactValue | undefined {
  return info.farms?.[info.scheduleFCopyIndex ?? 0]?.value;
}

const factKeyOf = (info: Info) => info.farms?.[info.scheduleFCopyIndex ?? 0]?.key;

const yes = (value: boolean | undefined) => value;
const no = (value: boolean | undefined) => (value === undefined ? undefined : !value);

/* A line of this copy's farm. */
function line<V>(read: Line<V>) {
  return (_: unknown, info: Info): V | undefined => {
    const farm = farmOf(info);
    return farm ? read(farm) : undefined;
  };
}

/* A Part I line: only for the cash method (irs-1040sf-inst-2025::sec::line-c::b01). */
const cashLine = <V>(read: Line<V>) =>
  line((farm) => (farm.accountingMethod === "cash" ? read(farm) : undefined));

/* A Part III line: only for the accrual method (::line-c::b01, ::part-iii::b01). */
const accrualLine = <V>(read: Line<V>) =>
  line((farm) => (isAccrual(farm) ? read(farm) : undefined));

const dollars = (amount: number | undefined) => roundDollars(amount);

/* The EIN comb takes nine digits. */
const DIGITS = "0123456789";
const digitsOf = (text: string | undefined) =>
  text === undefined ? undefined : [...text].filter((char) => DIGITS.includes(char)).join("");

// A joint return names only the spouse who owns this farm.
function proprietor(info: Info) {
  const farm = farmOf(info);
  if (!farm) return undefined;
  const spouse = farmOwnerOf(farm) === "spouse";
  const first = spouse ? info.spouseFirstName : info.taxpayerFirstName;
  const last = spouse ? info.spouseLastName : info.taxpayerLastName;
  return first && last ? `${first} ${last}` : undefined;
}

function ssn(info: Info) {
  const farm = farmOf(info);
  if (!farm) return undefined;
  return farmOwnerOf(farm) === "spouse" ? info.spouseSSN : info.taxpayerSSN;
}

// Line G asks only after a Yes on line F; with No both boxes stay unchecked.
function line1099Filed(farm: FarmFactValue, box: "yes" | "no") {
  if (farm.paymentsRequire1099 === undefined) return undefined;
  if (!farm.paymentsRequire1099) return false;
  return box === "yes" ? yes(farm.filedRequired1099) : no(farm.filedRequired1099);
}

/* Line 9 (and line 50): the income lines, or the gap when the answers contradict each other. */
function line9(info: Info, read: (farm: FarmFactValue) => number | undefined) {
  const farm = farmOf(info);
  if (!farm) return undefined;
  const gap = farmIncomeGap(farm);
  if (gap) return unsupported(gap);
  return grossIncomeWaits(farm) ? undefined : read(farm);
}

/* Line 14: the stated depreciation; a gap when it needs Form 4562 for the farm. */
function line14(info: Info) {
  const farm = farmOf(info);
  if (!farm) return undefined;
  const gap = depreciationGap(farm);
  if (gap) return unsupported(gap);
  return depreciationWaits(farm) ? undefined : dollars(farm.expenses?.depreciation);
}

/* Line 33: waits with line 9 (line 12's limit reads it) and line 14. */
function line33(info: Info) {
  const farm = farmOf(info);
  if (!farm) return undefined;
  const gap = farmGap(farm);
  if (gap) return unsupported(gap);
  return depreciationWaits(farm) || grossIncomeWaits(farm) ? undefined : totalExpenses(farm);
}

function line34(info: Info) {
  const farm = farmOf(info);
  if (!farm) return undefined;
  const result = netFarmProfit(farm, factKeyOf(info));
  if (result.kind === "gap") return unsupported(result.reason);
  return result.kind === "amount" ? result.amount : undefined;
}

/* Line 36, only for a loss: "You don't need to complete line 36 if line 9 is more than line 33" (::line-36::b01). */
function line36(info: Info, box: "all" | "some") {
  const farm = farmOf(info);
  if (!farm || farm.allInvestmentAtRisk === undefined) return undefined;
  if (!isLoss(profitBeforeLossRules(farm))) return undefined;
  return box === "all" ? farm.allInvestmentAtRisk : !farm.allInvestmentAtRisk;
}

/* Lines 32a to 32f: each row's description and amount; the rows are a gap when they do not fit. */
function otherExpenseBindings(): Bindings {
  const bindings: Record<string, unknown> = {};
  const letters = ["a", "b", "c", "d", "e", "f"].slice(0, OTHER_EXPENSE_ROWS);
  letters.forEach((letter, index) => {
    const row = (farm: FarmFactValue) => otherExpenseRow(farm, index + 1);
    const cell = (pick: "description" | "amount") => (_: unknown, info: Info) => {
      const farm = farmOf(info);
      if (!farm) return undefined;
      if (otherExpensesOverflow(farm)) return unsupported(OVERFLOW);
      return row(farm)?.[pick];
    };
    bindings[`0.line.32${letter}_other_expenses_description`] = cell("description");
    bindings[`0.line.32${letter}_other_expenses_amount`] = cell("amount");
  });
  return bindings as Bindings;
}

/* Lines 11, 13, 14 and 16 to 31 (line 14 has its own rule): the amount the farm fact states. */
function statedBindings(): Bindings {
  const entries = STATED_LINES.filter(([field]) => field !== "0.line.14_depreciation_section_179");
  return Object.fromEntries(
    entries.map(([field, key]) => [field, line((farm) => dollars(farm.expenses?.[key]))]),
  ) as Bindings;
}

function headerBindings(): Bindings {
  return {
    "0.header.name_of_proprietor": (_, info) => proprietor(info),
    "0.header.ssn": (_, info) => ssn(info),
    "0.header.a_principal_crop_activity": line((farm) => farm.activity),
    "0.header.b_code_from_part_iv": line((farm) => farm.code),
    "0.header.c_accounting_method_cash": line((farm) =>
      farm.accountingMethod === undefined ? undefined : farm.accountingMethod === "cash",
    ),
    "0.header.c_accounting_method_accrual": line((farm) =>
      farm.accountingMethod === undefined ? undefined : isAccrual(farm),
    ),
    "0.header.d_ein": line((farm) => digitsOf(farm.ein)),
    "0.header.e_materially_participate_yes": line((farm) => yes(farm.materiallyParticipated)),
    "0.header.e_materially_participate_no": line((farm) => no(farm.materiallyParticipated)),
    "0.header.f_payments_require_1099_yes": line((farm) => yes(farm.paymentsRequire1099)),
    "0.header.f_payments_require_1099_no": line((farm) => no(farm.paymentsRequire1099)),
    "0.header.g_file_required_1099_yes": line((farm) => line1099Filed(farm, "yes")),
    "0.header.g_file_required_1099_no": line((farm) => line1099Filed(farm, "no")),
  };
}

function partIBindings(): Bindings {
  return {
    "0.line.1a_sales_purchased_livestock": cashLine((farm) => dollars(farm.purchasedItemSales)),
    "0.line.1b_cost_purchased_livestock": cashLine((farm) => dollars(farm.purchasedItemBasis)),
    "0.line.1c_subtract_1b_from_1a": cashLine(line1c),
    "0.line.2_sales_products_raised": cashLine((farm) => dollars(farm.productSales)),
    "0.line.3a_cooperative_distributions": cashLine((farm) =>
      dollars(farm.cooperativeDistributions),
    ),
    "0.line.3b_cooperative_distributions_taxable": cashLine(cooperativeTaxable),
    "0.line.4a_agricultural_program_payments": cashLine((farm) =>
      dollars(farm.agriculturalProgramPayments),
    ),
    "0.line.4b_agricultural_program_taxable": cashLine(agriculturalTaxable),
    "0.line.5a_ccc_loans_under_election": cashLine(cccLoansReported),
    "0.line.5b_ccc_loans_forfeited": cashLine((farm) => dollars(farm.cccLoansForfeited)),
    "0.line.5c_ccc_loans_forfeited_taxable": cashLine(cccForfeitedTaxable),
    "0.line.6a_crop_insurance_received": cashLine((farm) => dollars(farm.cropInsurance)),
    "0.line.6b_crop_insurance_taxable": cashLine(cropInsuranceTaxable),
    "0.line.6c_election_to_defer": cashLine(defersCropInsurance),
    "0.line.6d_amount_deferred_from_2024": cashLine((farm) => dollars(farm.cropInsuranceFrom2024)),
    "0.line.7_custom_hire_income": cashLine((farm) => dollars(farm.customHireIncome)),
    "0.line.8_other_income": cashLine((farm) => dollars(farm.otherIncome)),
    // Line 9: the cash lines added, or Part III line 50 (the form).
    "0.line.9_gross_income": (_, info) => line9(info, grossIncome),
  };
}

function partIIBindings(): Bindings {
  return {
    "0.line.10_car_truck_expenses": line(carAndTruckExpenses),
    "0.line.12_conservation_expenses": line((farm) =>
      grossIncomeWaits(farm) || farmIncomeGap(farm) ? undefined : conservationDeduction(farm),
    ),
    "0.line.14_depreciation_section_179": (_, info) => line14(info),
    "0.line.15_employee_benefit_programs": line(employeeBenefits),
    "0.line.22_labor_hired": line(laborHired),
    ...statedBindings(),
    ...otherExpenseBindings(),
    "0.line.33_total_expenses": (_, info) => line33(info),
    "0.line.34_net_farm_profit_loss": (_, info) => line34(info),
    "0.line.36a_all_investment_at_risk": (_, info) => line36(info, "all"),
    "0.line.36b_some_investment_not_at_risk": (_, info) => line36(info, "some"),
  };
}

function partIIIBindings(): Bindings {
  return {
    "1.line.37_sales_livestock_produce_accrual": accrualLine(accrualSales),
    "1.line.38a_cooperative_distributions_accrual": accrualLine((farm) =>
      dollars(farm.cooperativeDistributions),
    ),
    "1.line.38b_cooperative_distributions_taxable_accrual": accrualLine(cooperativeTaxable),
    "1.line.39a_agricultural_program_payments_accrual": accrualLine((farm) =>
      dollars(farm.agriculturalProgramPayments),
    ),
    "1.line.39b_agricultural_program_payments_taxable_accrual": accrualLine(agriculturalTaxable),
    "1.line.40a_ccc_loans_under_election_accrual": accrualLine(cccLoansReported),
    "1.line.40b_ccc_loans_forfeited_accrual": accrualLine((farm) =>
      dollars(farm.cccLoansForfeited),
    ),
    "1.line.40c_ccc_loans_forfeited_taxable_accrual": accrualLine(cccForfeitedTaxable),
    "1.line.41_crop_insurance_proceeds_accrual": accrualLine((farm) => dollars(farm.cropInsurance)),
    "1.line.42_custom_hire_income_accrual": accrualLine((farm) => dollars(farm.customHireIncome)),
    // MANUAL EDIT: the farm's own Form 4136 credit is this year's income on the accrual method (federal/4136/receivers.ts).
    "1.line.43_other_income_accrual": (_, info) =>
      accrualCreditGap(info, factKeyOf(info)) ??
      accrualLine((farm) => dollars(farm.otherIncome))(_, info),
    "1.line.44_total_income_accrual": accrualLine(line44),
    "1.line.45_inventory_beginning_of_year": accrualLine((farm) =>
      dollars(farm.inventory?.beginning),
    ),
    "1.line.46_cost_products_purchased": accrualLine((farm) =>
      farm.inventory === undefined ? undefined : dollars(farm.inventory.purchases),
    ),
    "1.line.47_add_lines_45_46": accrualLine(line47),
    "1.line.48_inventory_end_of_year": accrualLine((farm) => dollars(farm.inventory?.ending)),
    "1.line.49_cost_products_sold": accrualLine(line49),
    "1.line.50_gross_income_accrual": (_, info) =>
      farmOf(info) && isAccrual(farmOf(info)!) ? line9(info, line50) : undefined,
  };
}

export function register(): void {
  defineForm<ScheduleF, ScheduleFFilingInfo>("schedule-f", {
    bindings: {
      ...headerBindings(),
      ...partIBindings(),
      ...partIIBindings(),
      ...partIIIBindings(),
    },
    formatters: {
      // The SSN renders with dashes; this form has no comb widget for it.
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
