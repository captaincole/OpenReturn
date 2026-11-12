/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { BusinessExpenses, BusinessFactValue } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { SSN } from "../../values.js";
import type { ScheduleCFilingInfo } from "./filingInfo.js";
import {
  carAndTruckExpenses,
  grossIncome,
  grossProfit,
  homeOfficeExpenses,
  netProfit,
  netReceipts,
  otherExpensesTotal,
  tentativeProfit,
  totalExpenses,
} from "./lines.js";
import type { ScheduleC } from "./types.js";

const LINE_J =
  "No fact says whether the required Forms 1099 were or will be filed; line J applies only when line I is Yes.";
const OTHER_METHOD = "The business fact has no field that names an 'other' accounting method.";
const STATUTORY_EMPLOYEE =
  "No fact links a business to W-2 statutory-employee income; every business fact is self-employment income.";
const COST_OF_GOODS_SOLD =
  "Part III (cost of goods sold) is not modeled: a business that sells goods, or has not said, leaves lines 5 and 7-31 blank.";
const PART_III =
  "Part III (cost of goods sold) is not modeled: no fact gives inventory, purchases or the valuation method.";
// MANUAL EDIT: the business fact now carries vehicles and otherExpenses; these rows wait for a drafter.
const PART_IV =
  "Part IV (vehicle information) is not drafted yet: the business fact's vehicles give it, but no binding reads them.";
const PART_V =
  "Part V (other expenses) rows are not drafted yet: the business fact's otherExpenses give them, but no binding reads them.";
const AT_RISK =
  "No fact says whether all investment in the business is at risk (Form 6198); line 31 leaves a loss blank.";

/* The business this copy is for. */
export function businessOf(info: ScheduleCFilingInfo): BusinessFactValue | undefined {
  return info.businesses?.[info.scheduleCCopyIndex ?? 0];
}

// A business with no owner belongs to the taxpayer (Schedule SE reads it the same way).
function ownerOf(info: ScheduleCFilingInfo): "taxpayer" | "spouse" | undefined {
  const business = businessOf(info);
  return business ? (business.owner ?? "taxpayer") : undefined;
}

const yes = (value: boolean | undefined) => value;
const no = (value: boolean | undefined) => (value === undefined ? undefined : !value);

// A computed Part I line, from this copy's business (lines.ts, each line rounded).
function partI(
  info: ScheduleCFilingInfo,
  line: (business: BusinessFactValue) => number | undefined,
) {
  const business = businessOf(info);
  return business ? line(business) : undefined;
}

// A Part II line: the deductible amount the business fact states. Part III can capitalize these.
function expense(info: ScheduleCFilingInfo, key: keyof BusinessExpenses) {
  const business = businessOf(info);
  return business?.sellsGoods === false ? roundDollars(business.expenses?.[key]) : undefined;
}

// MANUAL EDIT: a computed Part II line (lines.ts). Part III can capitalize these, so it waits for "sells goods".
function partII(
  info: ScheduleCFilingInfo,
  line: (business: BusinessFactValue) => number | undefined,
) {
  const business = businessOf(info);
  return business?.sellsGoods === false ? line(business) : undefined;
}

// MANUAL EDIT: the entry spaces are for the simplified method only, the one the fact models.
function squareFeet(info: ScheduleCFilingInfo, which: "homeSquareFeet" | "businessSquareFeet") {
  return businessOf(info)?.homeOffice?.[which];
}

/*
 * A loss reaches line 31 (then Schedule 1 line 3, Schedule SE line 2) only after the at-risk
 * (Form 6198) and passive (Form 8582) limits; line G "No" can bring prior-year passive losses.
 */
function line31(info: ScheduleCFilingInfo) {
  const business = businessOf(info);
  return business ? netProfit(business, info.businesses ?? []) : undefined;
}

// MANUAL EDIT: the 300 square-foot cap is shared by the owner's other businesses, so line 30 reads them all.
function line30(info: ScheduleCFilingInfo) {
  const business = businessOf(info);
  return business ? homeOfficeExpenses(business, info.businesses ?? []) : undefined;
}

function method(info: ScheduleCFilingInfo, which: "cash" | "accrual" | "other") {
  const chosen = businessOf(info)?.accountingMethod;
  return chosen === undefined ? undefined : chosen === which;
}

export function register(): void {
  defineForm<ScheduleC, ScheduleCFilingInfo>("schedule-c", {
    bindings: {
      // A joint return names only the spouse who owns this business.
      "0.header.name": (_, info) => {
        const owner = ownerOf(info);
        const first = owner === "spouse" ? info.spouseFirstName : info.taxpayerFirstName;
        const last = owner === "spouse" ? info.spouseLastName : info.taxpayerLastName;
        return owner && first && last ? `${first} ${last}` : undefined;
      },
      "0.header.ssn": (_, info) => {
        const owner = ownerOf(info);
        if (!owner) return undefined;
        return owner === "spouse" ? info.spouseSSN : info.taxpayerSSN;
      },
      "0.line.a_principal_business": (_, info) => businessOf(info)?.activity,
      "0.line.b_business_code": (_, info) => businessOf(info)?.code,
      "0.line.c_business_name": (_, info) => businessOf(info)?.name,
      // The EIN widget is a 9-box comb: digits only.
      "0.line.d_ein": (_, info) => businessOf(info)?.ein?.replace(/\D/g, ""),
      "0.line.e_business_address": (_, info) => businessOf(info)?.address?.street,
      "0.line.e_city_state_zip": (_, info) => {
        const address = businessOf(info)?.address;
        return address ? `${address.city}, ${address.state} ${address.zip}` : undefined;
      },
      "0.line.f_cash": (_, info) => method(info, "cash"),
      "0.line.f_accrual": (_, info) => method(info, "accrual"),
      "0.line.f_other": (_, info) => method(info, "other"),
      "0.line.g_yes": (_, info) => yes(businessOf(info)?.materiallyParticipated),
      "0.line.g_no": (_, info) => no(businessOf(info)?.materiallyParticipated),
      "0.line.h_started_or_acquired": (_, info) => businessOf(info)?.startedThisYear,
      "0.line.i_yes": (_, info) => yes(businessOf(info)?.paymentsRequire1099),
      "0.line.i_no": (_, info) => no(businessOf(info)?.paymentsRequire1099),
      "0.line.1": (_, info) => roundDollars(businessOf(info)?.grossReceipts),
      "0.line.2": (_, info) => roundDollars(businessOf(info)?.returnsAndAllowances),
      "0.line.3": (_, info) => partI(info, netReceipts),
      "0.line.5": (_, info) => partI(info, grossProfit),
      "0.line.6": (_, info) => roundDollars(businessOf(info)?.otherIncome),
      "0.line.7": (_, info) => partI(info, grossIncome),
      "0.line.8": (_, info) => expense(info, "advertising"),
      "0.line.9": (_, info) => partII(info, carAndTruckExpenses),
      "0.line.10": (_, info) => expense(info, "commissionsAndFees"),
      "0.line.11": (_, info) => expense(info, "contractLabor"),
      "0.line.12": (_, info) => expense(info, "depletion"),
      "0.line.13": (_, info) => expense(info, "depreciation"),
      "0.line.14": (_, info) => expense(info, "employeeBenefitPrograms"),
      "0.line.15": (_, info) => expense(info, "insurance"),
      "0.line.16a": (_, info) => expense(info, "mortgageInterest"),
      "0.line.16b": (_, info) => expense(info, "otherInterest"),
      "0.line.17": (_, info) => expense(info, "legalAndProfessional"),
      "0.line.18": (_, info) => expense(info, "office"),
      "0.line.19": (_, info) => expense(info, "pensionAndProfitSharing"),
      "0.line.20a": (_, info) => expense(info, "rentVehiclesMachinery"),
      "0.line.20b": (_, info) => expense(info, "rentOtherProperty"),
      "0.line.21": (_, info) => expense(info, "repairs"),
      "0.line.22": (_, info) => expense(info, "supplies"),
      "0.line.23": (_, info) => expense(info, "taxesAndLicenses"),
      "0.line.24a": (_, info) => expense(info, "travel"),
      "0.line.24b": (_, info) => expense(info, "deductibleMeals"),
      "0.line.25": (_, info) => expense(info, "utilities"),
      "0.line.26": (_, info) => expense(info, "wages"),
      "0.line.27a": (_, info) => expense(info, "energyEfficientBuildings"),
      "0.line.27b": (_, info) => partII(info, otherExpensesTotal),
      "0.line.28": (_, info) => partII(info, totalExpenses),
      "0.line.29": (_, info) => partI(info, tentativeProfit),
      "0.line.30_home_sq_ft": (_, info) => squareFeet(info, "homeSquareFeet"),
      "0.line.30_business_sq_ft": (_, info) => squareFeet(info, "businessSquareFeet"),
      "0.line.30": (_, info) => line30(info),
      "0.line.31": (_, info) => line31(info),
    },
    formatters: {
      // The SSN renders with dashes; this form has no comb widget.
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
    unsupported: {
      "1.line.33a_cost": PART_III,
      "1.line.33b_lower_of_cost_or_market": PART_III,
      "1.line.33c_other": PART_III,
      "1.line.34_inventory_change_yes": PART_III,
      "1.line.34_inventory_change_no": PART_III,
      "1.line.35": PART_III,
      "1.line.36": PART_III,
      "1.line.37": PART_III,
      "1.line.38": PART_III,
      "1.line.39": PART_III,
      "1.line.40": PART_III,
      "1.line.41": PART_III,
      "1.line.42": PART_III,
      "1.line.43_month": PART_IV,
      "1.line.43_day": PART_IV,
      "1.line.43_year": PART_IV,
      "1.line.44a_business_miles": PART_IV,
      "1.line.44b_commuting_miles": PART_IV,
      "1.line.44c_other_miles": PART_IV,
      "1.line.45_personal_use_off_duty_yes": PART_IV,
      "1.line.45_personal_use_off_duty_no": PART_IV,
      "1.line.46_another_vehicle_available_yes": PART_IV,
      "1.line.46_another_vehicle_available_no": PART_IV,
      "1.line.47a_evidence_supports_deduction_yes": PART_IV,
      "1.line.47a_evidence_supports_deduction_no": PART_IV,
      "1.line.47b_evidence_written_yes": PART_IV,
      "1.line.47b_evidence_written_no": PART_IV,
      "1.line.48_description_1": PART_V,
      "1.line.48_amount_1": PART_V,
      "1.line.48_description_2": PART_V,
      "1.line.48_amount_2": PART_V,
      "1.line.48_description_3": PART_V,
      "1.line.48_amount_3": PART_V,
      "1.line.48_description_4": PART_V,
      "1.line.48_amount_4": PART_V,
      "1.line.48_description_5": PART_V,
      "1.line.48_amount_5": PART_V,
      "1.line.48_description_6": PART_V,
      "1.line.48_amount_6": PART_V,
      "1.line.48_description_7": PART_V,
      "1.line.48_amount_7": PART_V,
      "1.line.48_description_8": PART_V,
      "1.line.48_amount_8": PART_V,
      "1.line.48_description_9": PART_V,
      "1.line.48_amount_9": PART_V,
      "1.line.48": PART_V,
      "0.line.f_other_specify": OTHER_METHOD,
      "0.line.1_statutory_employee": STATUTORY_EMPLOYEE,
      "0.line.4": COST_OF_GOODS_SOLD,
      "0.line.32a": AT_RISK,
      "0.line.32b": AT_RISK,
      "0.line.j_yes": LINE_J,
      "0.line.j_no": LINE_J,
    },
  });
}
