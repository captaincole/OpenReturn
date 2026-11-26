/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

/*
 * MANUAL EDIT: the resolver figures the whole form from the farm rental fact
 * (resolveInfo.ts: Parts I and II in lines.ts, lines 32 and 34 in result.ts),
 * and printed.ts maps each line to its field. Each binding prints that value:
 * unsupported with a gap, blank with no farm rental.
 */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { formatDollars } from "../../money.js";
import { unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form4835FilingInfo } from "./filingInfo.js";
import { isGap } from "./lines.js";
import type { Form4835 } from "./types.js";

type Field = keyof Form4835;

/* The header's name and SSN come from the return; every other field from printed.ts. */
const FROM_RETURN: ReadonlyArray<Field> = ["0.header.taxpayer_name", "0.header.ssn"];

const PRINTED_FIELDS: ReadonlyArray<Field> = [
  "0.header.ein",
  "0.header.a_actively_participated_yes",
  "0.header.a_actively_participated_no",
  "0.line.1_income_from_production",
  "0.line.2a_cooperative_distributions",
  "0.line.2b_cooperative_distributions_taxable",
  "0.line.3a_agricultural_program_payments",
  "0.line.3b_agricultural_program_payments_taxable",
  "0.line.4a_ccc_loans_under_election",
  "0.line.4b_ccc_loans_forfeited",
  "0.line.4c_ccc_loans_forfeited_taxable",
  "0.line.5a_crop_insurance_received",
  "0.line.5b_crop_insurance_taxable",
  "0.line.5c_election_to_defer",
  "0.line.5d_crop_insurance_deferred",
  "0.line.6_other_income",
  "0.line.7_gross_farm_rental_income",
  "0.line.8_car_truck_expenses",
  "0.line.9_chemicals",
  "0.line.10_conservation_expenses",
  "0.line.11_custom_hire",
  "0.line.12_depreciation_section_179",
  "0.line.13_employee_benefit_programs",
  "0.line.14_feed",
  "0.line.15_fertilizers_lime",
  "0.line.16_freight_trucking",
  "0.line.17_gasoline_fuel_oil",
  "0.line.18_insurance_other_than_health",
  "0.line.19a_mortgage_interest",
  "0.line.19b_other_interest",
  "0.line.20_labor_hired",
  "0.line.21_pension_profit_sharing",
  "0.line.22a_rent_vehicles_machinery_equipment",
  "0.line.22b_rent_other",
  "0.line.23_repairs_maintenance",
  "0.line.24_seeds_plants",
  "0.line.25_storage_warehousing",
  "0.line.26_supplies",
  "0.line.27_taxes",
  "0.line.28_utilities",
  "0.line.29_veterinary_breeding_medicine",
  "0.line.30a_other_expenses_description",
  "0.line.30a_other_expenses_amount",
  "0.line.30b_other_expenses_description",
  "0.line.30b_other_expenses_amount",
  "0.line.30c_other_expenses_description",
  "0.line.30c_other_expenses_amount",
  "0.line.30d_other_expenses_description",
  "0.line.30d_other_expenses_amount",
  "0.line.30e_other_expenses_description",
  "0.line.30e_other_expenses_amount",
  "0.line.30f_other_expenses_description",
  "0.line.30f_other_expenses_amount",
  "0.line.30g_other_expenses_description",
  "0.line.30g_other_expenses_amount",
  "0.line.31_total_expenses",
  "0.line.32_net_farm_rental_income_loss",
  "0.line.34a_all_investment_at_risk",
  "0.line.34b_some_investment_not_at_risk",
  "0.line.34c_deductible_loss",
];

type Binding = BindingFn<Form4835, Form4835FilingInfo, Field>;

/* A printed field: the form's gap, then the field's own gap, else its value. */
function printed(field: Field): Binding {
  return (_, info) => {
    if (info.form4835Gap) return unsupported(info.form4835Gap);
    const value = info.form4835?.[field];
    if (isGap(value)) return unsupported(value.gap);
    return value as Form4835[Field] | undefined;
  };
}

/* A negative amount prints as "(500)", a positive one as usual. */
const inParentheses = (value: number) =>
  value < 0 ? `(${formatDollars(-value)})` : formatDollars(value);

/* The header's name and SSN, while a farm rental is on the form. */
const fromReturn: Record<string, Binding> = {
  "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
  "0.header.ssn": (_, info) => info.taxpayerSSN,
};

export function register(): void {
  defineForm<Form4835, Form4835FilingInfo>("form-4835", {
    bindings: {
      ...Object.fromEntries(FROM_RETURN.map((field) => [field, fromReturn[field]])),
      ...Object.fromEntries(PRINTED_FIELDS.map((field) => [field, printed(field)])),
    },
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
      // The 263A costs print "in parentheses" (irs-4835-inst-2025::sec::part-ii::b01), and so does the loss.
      "0.line.30g_other_expenses_amount": inParentheses,
      "0.line.34c_deductible_loss": inParentheses,
    },
  });
}
