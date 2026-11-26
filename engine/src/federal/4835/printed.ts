/*
 * Form 4835's fields, each with its value or gap, from Parts I and II
 * (lines.ts) and lines 32 and 34 (result.ts). The header's name and SSN come
 * from the return (bindings.ts).
 */

import type { FarmRentalFactValue } from "../../facts/index.js";
import { EIN, ein } from "../../values.js";
import {
  OTHER_EXPENSE_ROWS,
  type ExpenseLine,
  type Form4835PartI,
  type Form4835PartII,
  type Gap,
} from "./lines.js";
import type { Form4835Result } from "./result.js";
import type { Form4835 } from "./types.js";

type Value = number | boolean | string | Gap | undefined;
export type Form4835Printed = Partial<Record<keyof Form4835, Value>>;

/* Lines 8 to 29 but line 10: the catalog field of each. */
const EXPENSE_FIELD_IDS: Record<ExpenseLine, keyof Form4835> = {
  "8": "0.line.8_car_truck_expenses",
  "9": "0.line.9_chemicals",
  "11": "0.line.11_custom_hire",
  "12": "0.line.12_depreciation_section_179",
  "13": "0.line.13_employee_benefit_programs",
  "14": "0.line.14_feed",
  "15": "0.line.15_fertilizers_lime",
  "16": "0.line.16_freight_trucking",
  "17": "0.line.17_gasoline_fuel_oil",
  "18": "0.line.18_insurance_other_than_health",
  "19a": "0.line.19a_mortgage_interest",
  "19b": "0.line.19b_other_interest",
  "20": "0.line.20_labor_hired",
  "21": "0.line.21_pension_profit_sharing",
  "22a": "0.line.22a_rent_vehicles_machinery_equipment",
  "22b": "0.line.22b_rent_other",
  "23": "0.line.23_repairs_maintenance",
  "24": "0.line.24_seeds_plants",
  "25": "0.line.25_storage_warehousing",
  "26": "0.line.26_supplies",
  "27": "0.line.27_taxes",
  "28": "0.line.28_utilities",
  "29": "0.line.29_veterinary_breeding_medicine",
};

/* The EIN box is a comb of 9 digits; a malformed EIN prints nothing. */
function einDigits(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  try {
    return EIN.digits(ein(raw));
  } catch {
    return undefined;
  }
}

/* Line A: Yes or No, one box (irs-4835-inst-2025::sec::specific-instructions::b01). */
function header(farm: FarmRentalFactValue): Form4835Printed {
  const active = farm.activelyParticipated;
  return {
    "0.header.ein": einDigits(farm.ein),
    "0.header.a_actively_participated_yes": active === true ? true : undefined,
    "0.header.a_actively_participated_no": active === false ? true : undefined,
  };
}

function partIFields(lines: Form4835PartI): Form4835Printed {
  return {
    "0.line.1_income_from_production": lines.line1,
    "0.line.2a_cooperative_distributions": lines.line2a,
    "0.line.2b_cooperative_distributions_taxable": lines.line2b,
    "0.line.3a_agricultural_program_payments": lines.line3a,
    "0.line.3b_agricultural_program_payments_taxable": lines.line3b,
    "0.line.4a_ccc_loans_under_election": lines.line4a,
    "0.line.4b_ccc_loans_forfeited": lines.line4b,
    "0.line.4c_ccc_loans_forfeited_taxable": lines.line4c,
    "0.line.5a_crop_insurance_received": lines.line5a,
    "0.line.5b_crop_insurance_taxable": lines.line5b,
    "0.line.5c_election_to_defer": lines.line5c,
    "0.line.5d_crop_insurance_deferred": lines.line5d,
    "0.line.6_other_income": lines.line6,
    "0.line.7_gross_farm_rental_income": lines.line7,
  };
}

function partIIFields(lines: Form4835PartII | Gap): Form4835Printed {
  const fields: Form4835Printed = {};
  if ("gap" in lines) {
    for (const id of [...Object.values(EXPENSE_FIELD_IDS), "0.line.10_conservation_expenses"]) {
      fields[id as keyof Form4835] = lines;
    }
    for (const row of OTHER_EXPENSE_ROWS) {
      fields[`0.line.30${row}_other_expenses_description`] = lines;
      fields[`0.line.30${row}_other_expenses_amount`] = lines;
    }
    fields["0.line.31_total_expenses"] = lines;
    return fields;
  }
  for (const [line, id] of Object.entries(EXPENSE_FIELD_IDS)) {
    fields[id] = lines.expenses[line as ExpenseLine];
  }
  fields["0.line.10_conservation_expenses"] = lines.line10;
  OTHER_EXPENSE_ROWS.forEach((row, index) => {
    fields[`0.line.30${row}_other_expenses_description`] = lines.otherRows[index]?.description;
    fields[`0.line.30${row}_other_expenses_amount`] = lines.otherRows[index]?.amount;
  });
  fields["0.line.31_total_expenses"] = lines.line31;
  return fields;
}

function resultFields(result: Form4835Result | undefined): Form4835Printed {
  return {
    "0.line.32_net_farm_rental_income_loss": result?.line32,
    "0.line.34a_all_investment_at_risk": result?.line34a,
    "0.line.34b_some_investment_not_at_risk": result?.line34b,
    "0.line.34c_deductible_loss": result?.line34c,
  };
}

export function printedForm(
  farm: FarmRentalFactValue,
  partI: Form4835PartI,
  partII: Form4835PartII | Gap,
  result: Form4835Result | undefined,
): Form4835Printed {
  return {
    ...header(farm),
    ...partIFields(partI),
    ...partIIFields(partII),
    ...resultFields(result),
  };
}
