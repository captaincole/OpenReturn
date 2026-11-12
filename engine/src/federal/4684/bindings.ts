/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { CasualtyEventFactValue, CasualtyPropertyValue } from "../../facts/index.js";
import { atLeast, numberOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import type { Form4684FilingInfo } from "./filingInfo.js";
import {
  ADDITIONAL_SHEETS_GAP,
  additionalSheetsGap,
  line10,
  line11,
  line12,
  line17,
  mostAffectedZip,
  needsAdditionalSheets,
  propertyLines,
  sectionATotals,
  type PropertyLines,
  type SectionATotals,
} from "./lines.js";
import type { Form4684 } from "./types.js";

type FemaPrefix = "DR" | "EM";

const SECTION_B =
  "Section B (business and income-producing property) is not modeled: the casualty fact covers personal-use property only.";
const SECTION_C =
  "Section C (Ponzi-type investment scheme theft losses, Rev. Proc. 2009-20) is not modeled: no fact kind records them.";
const SECTION_D =
  "Section D (the election to deduct a disaster loss in the preceding year) is not modeled: no decision records the election.";

/* The event this copy reports: one Form 4684 through line 12 per casualty or theft. */
function eventOf(info: Form4684FilingInfo): CasualtyEventFactValue | undefined {
  return info.casualtyEvents?.[info.form4684CopyIndex ?? 0]?.event;
}

function events(info: Form4684FilingInfo): CasualtyEventFactValue[] {
  return (info.casualtyEvents ?? []).map((fact) => fact.event);
}

/* "Use only one Form 4684 for lines 13 through 18": copy 0 carries them, the others stay blank. */
function totals(info: Form4684FilingInfo): SectionATotals | undefined {
  if ((info.form4684CopyIndex ?? 0) !== 0) return undefined;
  return sectionATotals(events(info));
}

/* Lines 10–12 of this copy: unsupported when its event has more than four properties. */
function eventLine(
  info: Form4684FilingInfo,
  line: (events: CasualtyEventFactValue[], index: number) => number | undefined,
): number | Unsupported | undefined {
  const event = eventOf(info);
  if (event && needsAdditionalSheets(event)) return unsupported(ADDITIONAL_SHEETS_GAP);
  return line(events(info), info.form4684CopyIndex ?? 0);
}

/* Lines 13–18 on copy 0: unsupported when any event has more than four properties. */
function totalsLine<T>(
  info: Form4684FilingInfo,
  line: () => T | undefined,
): T | Unsupported | undefined {
  if ((info.form4684CopyIndex ?? 0) !== 0) return undefined;
  const gap = additionalSheetsGap(events(info));
  return gap ? unsupported(gap) : line();
}

function property<T>(index: number, pick: (property: CasualtyPropertyValue) => T | undefined) {
  return (_: unknown, info: Form4684FilingInfo): T | undefined => {
    const found = eventOf(info)?.properties[index];
    return found && pick(found);
  };
}

function column(index: number, pick: (lines: PropertyLines) => number | undefined) {
  return property(index, (found) => pick(propertyLines(found)));
}

function cityState(found: CasualtyPropertyValue): string | undefined {
  const parts = [found.city, found.state].filter((part) => part !== undefined && part !== "");
  return parts.length > 0 ? parts.join(", ") : undefined;
}

/* "DR-4865" goes in the box after the form's "DR-": the four digits only. */
function femaNumber(info: Form4684FilingInfo, prefix: FemaPrefix): string | undefined {
  const event = eventOf(info);
  if (!event?.federallyDeclaredDisaster) return undefined;
  const number = event.femaDeclarationNumber?.trim().toUpperCase();
  if (!number?.startsWith(prefix)) return undefined;
  const rest = number.slice(prefix.length).trim();
  const digits = rest.startsWith("-") ? rest.slice(1).trim() : rest;
  return digits === "" ? undefined : digits;
}

/* With the box checked and a FEMA number, Property A's line takes the most affected property's ZIP. */
function propertyAZip(_: unknown, info: Form4684FilingInfo): string | undefined {
  const event = eventOf(info);
  if (!event) return undefined;
  const declared = femaNumber(info, "DR") !== undefined || femaNumber(info, "EM") !== undefined;
  return declared ? mostAffectedZip(event) : event.properties[0]?.zip;
}

export function register(): void {
  defineForm<Form4684, Form4684FilingInfo>("form-4684", {
    bindings: {
      "0.header.name": (_, info) =>
        info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      "0.header.federally_declared_disaster": (_, info) => eventOf(info)?.federallyDeclaredDisaster,
      "0.header.fema_declaration_number_dr": (_, info) => femaNumber(info, "DR"),
      "0.header.fema_declaration_number_em": (_, info) => femaNumber(info, "EM"),

      "0.line.1_property_a_type": property(0, (found) => found.type),
      "0.line.1_property_a_city_state": property(0, cityState),
      "0.line.1_property_a_zip": propertyAZip,
      "0.line.1_property_a_date_acquired": property(0, (found) => found.dateAcquired),
      "0.line.1_property_b_type": property(1, (found) => found.type),
      "0.line.1_property_b_city_state": property(1, cityState),
      "0.line.1_property_b_zip": property(1, (found) => found.zip),
      "0.line.1_property_b_date_acquired": property(1, (found) => found.dateAcquired),
      "0.line.1_property_c_type": property(2, (found) => found.type),
      "0.line.1_property_c_city_state": property(2, cityState),
      "0.line.1_property_c_zip": property(2, (found) => found.zip),
      "0.line.1_property_c_date_acquired": property(2, (found) => found.dateAcquired),
      "0.line.1_property_d_type": property(3, (found) => found.type),
      "0.line.1_property_d_city_state": property(3, cityState),
      "0.line.1_property_d_zip": property(3, (found) => found.zip),
      "0.line.1_property_d_date_acquired": property(3, (found) => found.dateAcquired),

      "0.line.2_cost_basis_col_a": column(0, (lines) => lines.line2),
      "0.line.2_cost_basis_col_b": column(1, (lines) => lines.line2),
      "0.line.2_cost_basis_col_c": column(2, (lines) => lines.line2),
      "0.line.2_cost_basis_col_d": column(3, (lines) => lines.line2),
      "0.line.3_reimbursement_col_a": column(0, (lines) => lines.line3),
      "0.line.3_reimbursement_col_b": column(1, (lines) => lines.line3),
      "0.line.3_reimbursement_col_c": column(2, (lines) => lines.line3),
      "0.line.3_reimbursement_col_d": column(3, (lines) => lines.line3),
      "0.line.4_gain_col_a": column(0, (lines) => lines.line4),
      "0.line.4_gain_col_b": column(1, (lines) => lines.line4),
      "0.line.4_gain_col_c": column(2, (lines) => lines.line4),
      "0.line.4_gain_col_d": column(3, (lines) => lines.line4),
      "0.line.5_fmv_before_col_a": column(0, (lines) => lines.line5),
      "0.line.5_fmv_before_col_b": column(1, (lines) => lines.line5),
      "0.line.5_fmv_before_col_c": column(2, (lines) => lines.line5),
      "0.line.5_fmv_before_col_d": column(3, (lines) => lines.line5),
      "0.line.6_fmv_after_col_a": column(0, (lines) => lines.line6),
      "0.line.6_fmv_after_col_b": column(1, (lines) => lines.line6),
      "0.line.6_fmv_after_col_c": column(2, (lines) => lines.line6),
      "0.line.6_fmv_after_col_d": column(3, (lines) => lines.line6),
      "0.line.7_fmv_decrease_col_a": column(0, (lines) => lines.line7),
      "0.line.7_fmv_decrease_col_b": column(1, (lines) => lines.line7),
      "0.line.7_fmv_decrease_col_c": column(2, (lines) => lines.line7),
      "0.line.7_fmv_decrease_col_d": column(3, (lines) => lines.line7),
      "0.line.8_smaller_of_2_or_7_col_a": column(0, (lines) => lines.line8),
      "0.line.8_smaller_of_2_or_7_col_b": column(1, (lines) => lines.line8),
      "0.line.8_smaller_of_2_or_7_col_c": column(2, (lines) => lines.line8),
      "0.line.8_smaller_of_2_or_7_col_d": column(3, (lines) => lines.line8),
      "0.line.9_loss_col_a": column(0, (lines) => lines.line9),
      "0.line.9_loss_col_b": column(1, (lines) => lines.line9),
      "0.line.9_loss_col_c": column(2, (lines) => lines.line9),
      "0.line.9_loss_col_d": column(3, (lines) => lines.line9),

      "0.line.10_casualty_theft_loss": (_, info) =>
        eventLine(info, (all, index) => all[index] && line10(all[index])),
      "0.line.11_100_or_500_floor": (_, info) => eventLine(info, line11),
      "0.line.12_loss_after_floor": (_, info) => eventLine(info, line12),

      "0.line.13_total_gains": (_, info) => totalsLine(info, () => totals(info)?.line13),
      "0.line.14_total_losses": (_, info) => totalsLine(info, () => totals(info)?.line14),
      // A net gain also goes to Schedule D lines 4 and 11, which the engine's Schedule D does not read yet.
      "0.line.15_net_gain_or_qualified_disaster_loss": (_, info) =>
        totalsLine(info, () => totals(info)?.line15),
      "0.line.16_losses_less_gains": (_, info) => totalsLine(info, () => totals(info)?.line16),
      "0.line.17_ten_percent_agi": (form, info) =>
        totalsLine(info, () => {
          if (form["0.line.16_losses_less_gains"] === undefined) return undefined;
          return line17(numberOrBlank(form["form-1040.line.11b"]));
        }),
      "0.line.18_deductible_loss": (form, info) =>
        totalsLine(info, () => {
          const loss = form["0.line.16_losses_less_gains"];
          const floor = form["0.line.17_ten_percent_agi"];
          if (typeof loss !== "number" || typeof floor !== "number") return undefined;
          return atLeast(0, loss - floor);
        }),
    },

    formatters: {
      // The identifying number renders with dashes; this form has no comb widget.
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    unsupported: {
      "1.header.taxpayer_name": SECTION_B,
      "1.header.identifying_number": SECTION_B,
      "1.line.19_property_a_description": SECTION_B,
      "1.line.19_property_b_description": SECTION_B,
      "1.line.19_property_c_description": SECTION_B,
      "1.line.19_property_d_description": SECTION_B,
      "1.line.20_cost_or_adjusted_basis_col_a": SECTION_B,
      "1.line.20_cost_or_adjusted_basis_col_b": SECTION_B,
      "1.line.20_cost_or_adjusted_basis_col_c": SECTION_B,
      "1.line.20_cost_or_adjusted_basis_col_d": SECTION_B,
      "1.line.21_insurance_or_other_reimbursement_col_a": SECTION_B,
      "1.line.21_insurance_or_other_reimbursement_col_b": SECTION_B,
      "1.line.21_insurance_or_other_reimbursement_col_c": SECTION_B,
      "1.line.21_insurance_or_other_reimbursement_col_d": SECTION_B,
      "1.line.22_gain_from_casualty_or_theft_col_a": SECTION_B,
      "1.line.22_gain_from_casualty_or_theft_col_b": SECTION_B,
      "1.line.22_gain_from_casualty_or_theft_col_c": SECTION_B,
      "1.line.22_gain_from_casualty_or_theft_col_d": SECTION_B,
      "1.line.23_fair_market_value_before_col_a": SECTION_B,
      "1.line.23_fair_market_value_before_col_b": SECTION_B,
      "1.line.23_fair_market_value_before_col_c": SECTION_B,
      "1.line.23_fair_market_value_before_col_d": SECTION_B,
      "1.line.24_fair_market_value_after_col_a": SECTION_B,
      "1.line.24_fair_market_value_after_col_b": SECTION_B,
      "1.line.24_fair_market_value_after_col_c": SECTION_B,
      "1.line.24_fair_market_value_after_col_d": SECTION_B,
      "1.line.25_decrease_in_fair_market_value_col_a": SECTION_B,
      "1.line.25_decrease_in_fair_market_value_col_b": SECTION_B,
      "1.line.25_decrease_in_fair_market_value_col_c": SECTION_B,
      "1.line.25_decrease_in_fair_market_value_col_d": SECTION_B,
      "1.line.26_smaller_of_line_20_or_25_col_a": SECTION_B,
      "1.line.26_smaller_of_line_20_or_25_col_b": SECTION_B,
      "1.line.26_smaller_of_line_20_or_25_col_c": SECTION_B,
      "1.line.26_smaller_of_line_20_or_25_col_d": SECTION_B,
      "1.line.27_loss_less_reimbursement_col_a": SECTION_B,
      "1.line.27_loss_less_reimbursement_col_b": SECTION_B,
      "1.line.27_loss_less_reimbursement_col_c": SECTION_B,
      "1.line.27_loss_less_reimbursement_col_d": SECTION_B,
      "1.line.28_casualty_or_theft_loss": SECTION_B,
      "1.line.29_row1_col_a_casualty_or_theft": SECTION_B,
      "1.line.29_row1_col_b_i_business_loss": SECTION_B,
      "1.line.29_row1_col_b_ii_income_producing_loss": SECTION_B,
      "1.line.29_row1_col_c_gain": SECTION_B,
      "1.line.29_row2_col_a_casualty_or_theft": SECTION_B,
      "1.line.29_row2_col_b_i_business_loss": SECTION_B,
      "1.line.29_row2_col_b_ii_income_producing_loss": SECTION_B,
      "1.line.29_row2_col_c_gain": SECTION_B,
      "1.line.30_totals_col_b_i_business_loss": SECTION_B,
      "1.line.30_totals_col_b_ii_income_producing_loss": SECTION_B,
      "1.line.30_totals_col_c_gain": SECTION_B,
      "1.line.31_net_short_term_gain_or_loss": SECTION_B,
      "1.line.32_short_term_income_producing_loss": SECTION_B,
      "1.line.33_gains_from_form_4797": SECTION_B,
      "1.line.34_row1_col_a_casualty_or_theft": SECTION_B,
      "1.line.34_row1_col_b_i_business_loss": SECTION_B,
      "1.line.34_row1_col_b_ii_income_producing_loss": SECTION_B,
      "1.line.34_row1_col_c_gain": SECTION_B,
      "1.line.34_row2_col_a_casualty_or_theft": SECTION_B,
      "1.line.34_row2_col_b_i_business_loss": SECTION_B,
      "1.line.34_row2_col_b_ii_income_producing_loss": SECTION_B,
      "1.line.34_row2_col_c_gain": SECTION_B,
      "1.line.35_total_losses_col_b_i_business": SECTION_B,
      "1.line.35_total_losses_col_b_ii_income_producing": SECTION_B,
      "1.line.36_total_gains": SECTION_B,
      "1.line.37_total_losses_line_35": SECTION_B,
      "1.line.38a_net_long_term_business_gain_or_loss": SECTION_B,
      "1.line.38b_long_term_income_producing_loss": SECTION_B,
      "1.line.39_net_long_term_gain": SECTION_B,
      "2.header.taxpayer_name": SECTION_C,
      "2.header.identifying_number": SECTION_C,
      "2.line.40_initial_investment": SECTION_C,
      "2.line.41_subsequent_investments": SECTION_C,
      "2.line.42_income_reported_prior_years": SECTION_C,
      "2.line.43_total_invested_and_reported": SECTION_C,
      "2.line.44_withdrawals_all_years": SECTION_C,
      "2.line.45_total_qualified_investment": SECTION_C,
      "2.line.46_recovery_factor_whole": SECTION_C,
      "2.line.46_recovery_factor_decimal": SECTION_C,
      "2.line.47_line46_times_line45": SECTION_C,
      "2.line.48_actual_recovery": SECTION_C,
      "2.line.49_potential_insurance_sipc_recovery": SECTION_C,
      "2.line.50_total_recovery": SECTION_C,
      "2.line.51_deductible_theft_loss": SECTION_C,
      "2.part2.fraud_individual_or_entity_name": SECTION_C,
      "2.part2.fraud_individual_or_entity_tin": SECTION_C,
      "2.part2.fraud_individual_or_entity_address": SECTION_C,
      "2.part2.prior_returns_years_and_dates_filed": SECTION_C,
      "3.header.taxpayer_name": SECTION_D,
      "3.header.identifying_number": SECTION_D,
      "3.line.52_disaster_name_description": SECTION_D,
      "3.line.52_disaster_name_description_cont": SECTION_D,
      "3.line.53_disaster_loss_dates": SECTION_D,
      "3.line.53_disaster_loss_dates_cont": SECTION_D,
      "3.line.54_damaged_property_address": SECTION_D,
      "3.line.54_damaged_property_address_cont": SECTION_D,
      "3.line.55_revoked_disaster_and_address": SECTION_D,
      "3.line.55_revoked_disaster_and_address_cont": SECTION_D,
      "3.line.56_prior_election_filed_date": SECTION_D,
      "3.line.57_repayment_arrangements": SECTION_D,
      "3.line.57_repayment_arrangements_cont": SECTION_D,
    },
  });
}
