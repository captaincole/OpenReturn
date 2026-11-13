/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import type { BusinessExpenses, BusinessFactValue, BusinessVehicle } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { homeOfficeActualGap } from "../8829/lines.js";
import { depreciationGap, depreciationLine, partVEntries } from "./attachments.js";
import type { ScheduleCFilingInfo } from "./filingInfo.js";
import {
  carAndTruckExpenses,
  grossIncome,
  grossProfit,
  homeOfficeExpenses,
  homeOfficeGap,
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
// MANUAL EDIT: Part V has nine rows; the engine writes no attached statement for more.
const PART_V_ROWS = 9;
// MANUAL EDIT: line 30 cases the engine does not handle (lines.ts homeOfficeGap).
const HOME_OFFICE_GAP = {
  partOfIncomeFromHome:
    "Not all of the business's gross income is from the home, and no fact gives the part that is (Simplified Method Worksheet line 1).",
  areaAllocation:
    "The home offices of two or more of the owner's businesses total more than 300 square feet, and no fact gives how the taxpayer allocates the 300 among the businesses.",
} as const;

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
  if (!business) return undefined;
  return (
    attachmentUnsupported(business) ??
    homeOfficeUnsupported(business, info) ??
    netProfit(business, info.businesses ?? [])
  );
}

/*
 * MANUAL EDIT: a Form 4562 or Form 8829 case the engine does not handle makes
 * the lines that read it unsupported, with the reason.
 */
function attachmentUnsupported(business: BusinessFactValue): Unsupported | undefined {
  const gap =
    depreciationGap(business) ??
    (business.homeOfficeActual ? homeOfficeActualGap(business.homeOfficeActual) : undefined);
  return gap ? unsupported(gap) : undefined;
}

// MANUAL EDIT: a line that reads line 13 (Form 4562 line 22) carries its gap.
function afterDepreciation(
  info: ScheduleCFilingInfo,
  line: (business: BusinessFactValue) => number | undefined,
) {
  const business = businessOf(info);
  if (!business) return undefined;
  const gap = depreciationGap(business);
  return gap ? unsupported(gap) : partII(info, line);
}

/*
 * MANUAL EDIT: line 32 only for a loss (irs-1040sc-inst-2025::sec::line-32::b01:
 * "You don't need to complete line 32 if line 7 is more than the total of lines
 * 28 and 30"). Box 32a when all investment is at risk, 32b when some is not.
 */
function atRiskBox(info: ScheduleCFilingInfo, box: "all" | "some") {
  const business = businessOf(info);
  if (!business || business.allInvestmentAtRisk === undefined) return undefined;
  const line29 = tentativeProfit(business);
  const line30 = homeOfficeExpenses(business, info.businesses ?? []) ?? 0;
  if (line29 === undefined || line29 - line30 >= 0) return undefined;
  return box === "all" ? business.allInvestmentAtRisk : !business.allInvestmentAtRisk;
}

// MANUAL EDIT: the 300 square-foot cap is shared by the owner's other businesses, so line 30 reads them all.
function line30(info: ScheduleCFilingInfo) {
  const business = businessOf(info);
  if (!business) return undefined;
  return (
    attachmentUnsupported(business) ??
    homeOfficeUnsupported(business, info) ??
    homeOfficeExpenses(business, info.businesses ?? [])
  );
}

// MANUAL EDIT: a home office case the engine does not handle makes lines 30 and 31 unsupported, with the reason.
function homeOfficeUnsupported(business: BusinessFactValue, info: ScheduleCFilingInfo) {
  const gap = homeOfficeGap(business, info.businesses ?? []);
  return gap ? unsupported(HOME_OFFICE_GAP[gap]) : undefined;
}

/*
 * MANUAL EDIT: Part IV shows the first vehicle (the others go on an attached statement,
 * irs-1040sc-inst-2025::sec::line-9::b03) when line 9 claims car or truck expenses and
 * no Form 4562 is required (irs-4562-inst-2025::sec::part-v::b01). Any line 13
 * depreciation can require Form 4562, whose Part V then takes the vehicle (line-9::b04,
 * line-13::b01); the engine has no Form 4562, so Part IV is blank then. Gap: Form 4562 is
 * also required for amortization that begins in 2025 (irs-4562-inst-2025::sec::who-must-file::b01),
 * and no fact gives it. Part IV waits for the "sells goods" answer, as line 9 does.
 */
function partIVVehicle(info: ScheduleCFilingInfo): BusinessVehicle | undefined {
  const business = businessOf(info);
  const vehicle = business?.vehicles?.[0];
  const line9 = partII(info, carAndTruckExpenses) ?? 0;
  const depreciation = business ? (depreciationLine(business) ?? 0) : 0;
  return line9 > 0 && depreciation === 0 ? vehicle : undefined;
}

// MANUAL EDIT: line 43 is placedInService (YYYY-MM-DD); the year box takes four digits.
function placedInService(info: ScheduleCFilingInfo, part: "year" | "month" | "day") {
  const [year, month, day] = partIVVehicle(info)?.placedInService?.split("-") ?? [];
  return { year, month, day }[part];
}

// MANUAL EDIT: line 47b asks only after a Yes on line 47a; otherwise both boxes stay unchecked.
function evidenceWritten(info: ScheduleCFilingInfo, box: "yes" | "no") {
  const vehicle = partIVVehicle(info);
  if (vehicle?.hasEvidence === undefined) return undefined;
  if (!vehicle.hasEvidence) return false;
  return box === "yes" ? yes(vehicle.evidenceIsWritten) : no(vehicle.evidenceIsWritten);
}

/*
 * MANUAL EDIT: Part V lists each other expense on its own row, in the order recorded
 * (irs-1040sc-inst-2025::sec::part-v::b01). Line 48 is line 27b's amount, so the rows
 * wait for the same "sells goods" answer. More than nine expenses leave the rows blank.
 */
function otherExpenseRow(info: ScheduleCFilingInfo, row: number) {
  const business = businessOf(info);
  const entries = business ? partVEntries(business) : [];
  if (business?.sellsGoods !== false || entries.length > PART_V_ROWS) return undefined;
  return entries[row - 1];
}

type Bindings = Partial<{ [K in keyof ScheduleC]: BindingFn<ScheduleC, ScheduleCFilingInfo, K> }>;
type RowBinding = BindingFn<ScheduleC, ScheduleCFilingInfo, keyof ScheduleC>;

function partVRowBindings(): Bindings {
  const bindings: Record<string, RowBinding> = {};
  for (let row = 1; row <= PART_V_ROWS; row++) {
    bindings[`1.line.48_description_${row}`] = (_, info) => otherExpenseRow(info, row)?.description;
    bindings[`1.line.48_amount_${row}`] = (_, info) =>
      roundDollars(otherExpenseRow(info, row)?.amount);
  }
  return bindings as Bindings;
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
      // MANUAL EDIT: line 13 is Form 4562 line 22 when the business has depreciation answers.
      "0.line.13": (_, info) =>
        afterDepreciation(info, (business) => roundDollars(depreciationLine(business))),
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
      "0.line.28": (_, info) => afterDepreciation(info, totalExpenses),
      "0.line.29": (_, info) => afterDepreciation(info, tentativeProfit),
      "0.line.30_home_sq_ft": (_, info) => squareFeet(info, "homeSquareFeet"),
      "0.line.30_business_sq_ft": (_, info) => squareFeet(info, "businessSquareFeet"),
      "0.line.30": (_, info) => line30(info),
      "0.line.31": (_, info) => line31(info),
      "0.line.32a": (_, info) => atRiskBox(info, "all"),
      "0.line.32b": (_, info) => atRiskBox(info, "some"),
      "1.line.43_month": (_, info) => placedInService(info, "month"),
      "1.line.43_day": (_, info) => placedInService(info, "day"),
      "1.line.43_year": (_, info) => placedInService(info, "year"),
      "1.line.44a_business_miles": (_, info) => partIVVehicle(info)?.businessMiles,
      "1.line.44b_commuting_miles": (_, info) => partIVVehicle(info)?.commutingMiles,
      "1.line.44c_other_miles": (_, info) => partIVVehicle(info)?.otherMiles,
      "1.line.45_personal_use_off_duty_yes": (_, info) =>
        yes(partIVVehicle(info)?.availableForPersonalUse),
      "1.line.45_personal_use_off_duty_no": (_, info) =>
        no(partIVVehicle(info)?.availableForPersonalUse),
      "1.line.46_another_vehicle_available_yes": (_, info) =>
        yes(partIVVehicle(info)?.anotherVehicleAvailable),
      "1.line.46_another_vehicle_available_no": (_, info) =>
        no(partIVVehicle(info)?.anotherVehicleAvailable),
      "1.line.47a_evidence_supports_deduction_yes": (_, info) =>
        yes(partIVVehicle(info)?.hasEvidence),
      "1.line.47a_evidence_supports_deduction_no": (_, info) =>
        no(partIVVehicle(info)?.hasEvidence),
      "1.line.47b_evidence_written_yes": (_, info) => evidenceWritten(info, "yes"),
      "1.line.47b_evidence_written_no": (_, info) => evidenceWritten(info, "no"),
      ...partVRowBindings(),
      "1.line.48": (_, info) => partII(info, otherExpensesTotal),
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
      "0.line.f_other_specify": OTHER_METHOD,
      "0.line.1_statutory_employee": STATUTORY_EMPLOYEE,
      "0.line.4": COST_OF_GOODS_SOLD,
      "0.line.j_yes": LINE_J,
      "0.line.j_no": LINE_J,
    },
  });
}
