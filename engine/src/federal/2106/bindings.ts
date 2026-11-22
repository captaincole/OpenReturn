/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { SectionDLines } from "./depreciation.js";
import type { Form2106Copy, Form2106FilingInfo } from "./filingInfo.js";
import type { Form2106PartI } from "./lines.js";
import type { Form2106 } from "./types.js";
import type { SectionCLines, VehicleLines } from "./vehicle.js";

type Value = number | string | boolean;
type Binding<T extends Value> = (
  form: unknown,
  info: Form2106FilingInfo,
) => T | Unsupported | undefined;

/* A line of the printed copy: unsupported with a gap, blank with no copy. */
function fromCopy<T extends Value>(
  pick: (copy: Form2106Copy, info: Form2106FilingInfo) => T | undefined,
): Binding<T> {
  return (_, info) => {
    if (info.form2106Gap) return unsupported(info.form2106Gap);
    return info.form2106 === undefined ? undefined : pick(info.form2106, info);
  };
}

const partI = (pick: (lines: Form2106PartI) => number | undefined) =>
  fromCopy((copy) => pick(copy.partI));

/* A Part II column: vehicle 1 is column (a), vehicle 2 is column (b). */
const vehicle = <T extends Value>(index: number, pick: (lines: VehicleLines) => T | undefined) =>
  fromCopy((copy) => {
    const lines = copy.vehicles[index];
    return lines === undefined ? undefined : pick(lines);
  });

const sectionC = (index: number, pick: (lines: SectionCLines) => number | undefined) =>
  vehicle(index, (lines) => (lines.sectionC ? pick(lines.sectionC) : undefined));

const sectionD = <T extends Value>(index: number, pick: (lines: SectionDLines) => T | undefined) =>
  vehicle(index, (lines) => (lines.sectionD ? pick(lines.sectionD) : undefined));

/* Lines 18–21: one Yes/No pair, answered when Part II has a vehicle. */
function yesNo(pick: (copy: Form2106Copy) => boolean | undefined, box: boolean): Binding<true> {
  return fromCopy((copy): true | undefined =>
    copy.vehicles.length > 0 && pick(copy) === box ? true : undefined,
  );
}

/* "Your name": the person whose expenses the form holds, from the return's identity. */
function ownerName(copy: Form2106Copy, info: Form2106FilingInfo): string | undefined {
  const spouse = copy.owner === "spouse";
  const first = spouse ? info.spouseFirstName : info.taxpayerFirstName;
  const last = spouse ? info.spouseLastName : info.taxpayerLastName;
  return first && last ? `${first} ${last}` : undefined;
}

/* One part of the owner's SSN: the header has three boxes. */
const ownerSsnPart = (start: number, end: number) =>
  fromCopy((copy, info) =>
    (copy.owner === "spouse" ? info.spouseSSN : info.taxpayerSSN)?.slice(start, end),
  );

/* Part II for one column (a or b): Sections A, C and D. */
function vehicleColumn(index: number, column: "a" | "b") {
  const id = (line: string) => `1.line.${line}_col_${column}`;
  return {
    [id("11_date_placed_in_service_month")]: vehicle(index, (lines) => lines.placedInService.month),
    [id("11_date_placed_in_service_day")]: vehicle(index, (lines) => lines.placedInService.day),
    [id("11_date_placed_in_service_year")]: vehicle(index, (lines) => lines.placedInService.year),
    [id("12_total_miles_driven")]: vehicle(index, (lines) => lines.line12),
    [id("13_business_miles")]: vehicle(index, (lines) => lines.line13),
    [id("14_percent_business_use")]: vehicle(index, (lines) => lines.line14),
    [id("15_daily_commuting_distance")]: vehicle(index, (lines) => lines.line15),
    [id("16_commuting_miles")]: vehicle(index, (lines) => lines.line16),
    [id("17_other_miles")]: vehicle(index, (lines) => lines.line17),
    [id("23_gasoline_oil_repairs_insurance")]: sectionC(index, (lines) => lines.line23),
    [id("24a_vehicle_rentals")]: sectionC(index, (lines) => lines.line24a),
    [id("24b_inclusion_amount")]: sectionC(index, (lines) => lines.line24b),
    [id("24c_net_vehicle_rentals")]: sectionC(index, (lines) => lines.line24c),
    [id("25_employer_provided_vehicle_value")]: sectionC(index, (lines) => lines.line25),
    [id("26_total_actual_expenses")]: sectionC(index, (lines) => lines.line26),
    [id("27_business_share_expenses")]: sectionC(index, (lines) => lines.line27),
    [id("28_depreciation")]: sectionC(index, (lines) => lines.line28),
    [id("29_total_vehicle_expenses")]: sectionC(index, (lines) => lines.line29),
    [id("30_cost_or_other_basis")]: sectionD(index, (lines) => lines.line30),
    // MANUAL EDIT: line 31 prints only an amount claimed this year (line-31::b01).
    [id("31_section_179_special_allowance")]: sectionD(index, (lines) =>
      lines.line31 > 0 ? lines.line31 : undefined,
    ),
    [id("32_business_basis")]: sectionD(index, (lines) => lines.line32),
    [id("33_depreciation_method_percentage")]: sectionD(index, (lines) => lines.line33),
    [id("34_depreciation_before_limit")]: sectionD(index, (lines) => lines.line34),
    [id("35_total_depreciation_section_179")]: sectionD(index, (lines) => lines.line35),
    [id("36_applicable_limit")]: sectionD(index, (lines) => lines.line36),
    [id("37_business_share_limit")]: sectionD(index, (lines) => lines.line37),
    [id("38_allowed_depreciation")]: sectionD(index, (lines) => lines.line38),
  };
}

export function register(): void {
  defineForm<Form2106, Form2106FilingInfo>("form-2106", {
    bindings: {
      "0.header.taxpayer_name": fromCopy(ownerName),
      "0.header.occupation": fromCopy((copy) => copy.occupation),
      "0.header.ssn_first_3_digits": ownerSsnPart(0, 3),
      "0.header.ssn_middle_2_digits": ownerSsnPart(3, 5),
      "0.header.ssn_last_4_digits": ownerSsnPart(5, 9),
      // MANUAL EDIT: Part I (lines.ts; irs-2106-inst-2025::sec::line-1::b01 through ::line-10::b01).
      "0.line.1_vehicle_expense_col_a": partI((lines) => lines.line1),
      "0.line.2_parking_tolls_transportation_col_a": partI((lines) => lines.line2),
      "0.line.3_travel_expense_overnight_col_a": partI((lines) => lines.line3),
      "0.line.4_other_business_expenses_col_a": partI((lines) => lines.line4),
      "0.line.5_meals_expenses_col_b": partI((lines) => lines.line5),
      "0.line.6_total_expenses_col_a": partI((lines) => lines.line6a),
      "0.line.6_total_expenses_col_b": partI((lines) => lines.line6b),
      "0.line.7_employer_reimbursements_col_a": partI((lines) => lines.line7a),
      "0.line.7_employer_reimbursements_col_b": partI((lines) => lines.line7b),
      "0.line.8_expenses_less_reimbursements_col_a": partI((lines) => lines.line8a),
      "0.line.8_expenses_less_reimbursements_col_b": partI((lines) => lines.line8b),
      "0.line.9_deductible_amount_col_a": partI((lines) => lines.line9a),
      "0.line.9_deductible_amount_col_b": partI((lines) => lines.line9b),
      "0.line.10_total_employee_business_expenses": partI((lines) => lines.line10),
      // MANUAL EDIT: Part II (vehicle.ts, depreciation.ts).
      ...vehicleColumn(0, "a"),
      ...vehicleColumn(1, "b"),
      "1.line.18_available_personal_use_yes": yesNo((copy) => copy.vehicleAvailableOffDuty, true),
      "1.line.18_available_personal_use_no": yesNo((copy) => copy.vehicleAvailableOffDuty, false),
      "1.line.19_another_vehicle_personal_use_yes": yesNo(
        (copy) => copy.anotherVehicleAvailable,
        true,
      ),
      "1.line.19_another_vehicle_personal_use_no": yesNo(
        (copy) => copy.anotherVehicleAvailable,
        false,
      ),
      "1.line.20_evidence_support_deduction_yes": yesNo((copy) => copy.hasEvidence, true),
      "1.line.20_evidence_support_deduction_no": yesNo((copy) => copy.hasEvidence, false),
      // MANUAL EDIT: line 21 is asked only "If 'Yes'" on line 20.
      "1.line.21_evidence_written_yes": yesNo(
        (copy) => (copy.hasEvidence ? copy.evidenceIsWritten : undefined),
        true,
      ),
      "1.line.21_evidence_written_no": yesNo(
        (copy) => (copy.hasEvidence ? copy.evidenceIsWritten : undefined),
        false,
      ),
      "1.line.22_standard_mileage_rate_amount": fromCopy((copy) => copy.line22),
    },
  });
}
