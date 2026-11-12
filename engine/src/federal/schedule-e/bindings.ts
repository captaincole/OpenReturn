/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 */

import { defineForm } from "../../defineForm.js";
import type { RentalFactValue, RentalPropertyType } from "../../facts/index.js";
import { rentalOwnerOf } from "../../facts/index.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { PropertyColumn, ScheduleEFilingInfo } from "./filingInfo.js";
import { otherExpenseDescription, partIColumnBindings } from "./lines.js";
import { totalBindings } from "./totals.js";
import type { ScheduleE } from "./types.js";
import { UNSUPPORTED } from "./unsupported.js";

/* Line 1b, "Type of Property": the code printed on the form for each type. */
const PROPERTY_TYPE_CODE: Record<RentalPropertyType, string> = {
  single_family: "1",
  multi_family: "2",
  vacation_short_term: "3",
  commercial: "4",
  land: "5",
  royalties: "6",
  self_rental: "7",
  other: "8",
};

/* The property in column A, B or C of Part I. */
function propertyIn(info: ScheduleEFilingInfo, column: PropertyColumn) {
  return info.rentalProperties?.find((property) => property.column === column)?.value;
}

// Lines 1a and 2 are for rental real estate only; a royalty (code 6) leaves them blank.
function realEstateIn(
  info: ScheduleEFilingInfo,
  column: PropertyColumn,
): RentalFactValue | undefined {
  const property = propertyIn(info, column);
  return property?.propertyType === "royalties" ? undefined : property;
}

function code(info: ScheduleEFilingInfo, column: PropertyColumn) {
  const property = propertyIn(info, column);
  return property ? PROPERTY_TYPE_CODE[property.propertyType] : undefined;
}

const yes = (value: boolean | undefined) => value;
const no = (value: boolean | undefined) => (value === undefined ? undefined : !value);

function address(info: ScheduleEFilingInfo, column: PropertyColumn) {
  const place = realEstateIn(info, column)?.address;
  return place ? `${place.street}, ${place.city}, ${place.state} ${place.zip}` : undefined;
}

// MANUAL EDIT: joint return, joint owners (irs-1040se-inst-2025::sec::qualified-joint-venture-qjv::b01).
function qjv(info: ScheduleEFilingInfo, column: PropertyColumn) {
  const property = realEstateIn(info, column);
  if (!property) return undefined;
  return (
    info.filingStatus === "married_filing_jointly" &&
    rentalOwnerOf(property) === "joint" &&
    property.qualifiedJointVenture === true
  );
}

// One "8 Other (describe)" box serves all three columns; several are labeled by column.
function otherDescription(info: ScheduleEFilingInfo) {
  const others = (info.rentalProperties ?? []).filter(
    (property) => property.value.propertyType === "other",
  );
  if (others.some((property) => !property.value.otherTypeDescription)) return undefined;
  if (others.length === 0) return undefined;
  if (others.length === 1) return others[0].value.otherTypeDescription;
  return others
    .map((property) => `${property.column.toUpperCase()}: ${property.value.otherTypeDescription}`)
    .join("; ");
}

export function register(): void {
  defineForm<ScheduleE, ScheduleEFilingInfo>("schedule-e", {
    bindings: {
      "0.header.name": (_, info) => namesOnReturn(info),
      // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      "0.line.a_payments_require_1099_yes": (_, info) => yes(info.rentalPaymentsRequire1099),
      "0.line.a_payments_require_1099_no": (_, info) => no(info.rentalPaymentsRequire1099),
      // Line B is asked only after a Yes on line A.
      "0.line.b_filed_1099_yes": (_, info) =>
        info.rentalPaymentsRequire1099 === true ? yes(info.rentalFiled1099s) : undefined,
      "0.line.b_filed_1099_no": (_, info) =>
        info.rentalPaymentsRequire1099 === true ? no(info.rentalFiled1099s) : undefined,
      "0.line.1a_address_a": (_, info) => address(info, "a"),
      "0.line.1a_address_b": (_, info) => address(info, "b"),
      "0.line.1a_address_c": (_, info) => address(info, "c"),
      "0.line.1b_property_type_a": (_, info) => code(info, "a"),
      "0.line.1b_property_type_b": (_, info) => code(info, "b"),
      "0.line.1b_property_type_c": (_, info) => code(info, "c"),
      "0.line.1b_other_description": (_, info) => otherDescription(info),
      "0.line.2_fair_rental_days_a": (_, info) => realEstateIn(info, "a")?.fairRentalDays,
      "0.line.2_fair_rental_days_b": (_, info) => realEstateIn(info, "b")?.fairRentalDays,
      "0.line.2_fair_rental_days_c": (_, info) => realEstateIn(info, "c")?.fairRentalDays,
      "0.line.2_personal_use_days_a": (_, info) => realEstateIn(info, "a")?.personalUseDays,
      "0.line.2_personal_use_days_b": (_, info) => realEstateIn(info, "b")?.personalUseDays,
      "0.line.2_personal_use_days_c": (_, info) => realEstateIn(info, "c")?.personalUseDays,
      "0.line.2_qjv_a": (_, info) => qjv(info, "a"),
      "0.line.2_qjv_b": (_, info) => qjv(info, "b"),
      "0.line.2_qjv_c": (_, info) => qjv(info, "c"),
      // MANUAL EDIT: lines 3–21 per column (lines.ts).
      ...partIColumnBindings("a"),
      ...partIColumnBindings("b"),
      ...partIColumnBindings("c"),
      "0.line.19_other_description": (_, info) => otherExpenseDescription(info),
      // MANUAL EDIT: lines 22–26, 41 and 43 (totals.ts).
      ...totalBindings(),
      "1.header.name": (_, info) => namesOnReturn(info),
      "1.header.ssn": (_, info) => info.taxpayerSSN,
    },
    formatters: {
      // The SSN renders with dashes; this form has no comb widget.
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
      "1.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
    // MANUAL EDIT: Parts II–IV, lines 40 and 42 (unsupported.ts).
    unsupported: UNSUPPORTED,
  });
}
