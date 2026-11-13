/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import type { BusinessFactValue, HomeExpenses } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import { unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { tentativeProfit } from "../schedule-c/lines.js";
import type { Form8829FilingInfo } from "./filingInfo.js";
import {
  businessPercentage,
  form8829Figures,
  homeOfficeActualGap,
  OWNED_HOME_GAP,
  sharedHomeGap,
  type Form8829Figures,
  type HomeExpenseLine,
} from "./lines.js";
import type { Form8829 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form8829]: BindingFn<Form8829, Form8829FilingInfo, K> }>;

const DAYCARE =
  "No fact gives a daycare facility's hours (lines 4–6); every home office is used exclusively.";
const CASUALTY = "Casualty losses of the home (lines 9, 29 and 35, Form 4684) are not modeled.";
/* The ratio in hundredths of a percent (0.1108 is 1108), and 100 hundredths per percent. */
const PERCENT_HUNDREDTHS = 10000;
const PERCENT_SCALE = 100;

/* The business this copy is for. */
function businessOf(info: Form8829FilingInfo): BusinessFactValue | undefined {
  return info.form8829Businesses?.[info.form8829CopyIndex ?? 0];
}

/* Part II for this copy, or the reason it is not figured, or undefined while an answer waits. */
function figuresOf(info: Form8829FilingInfo) {
  const business = businessOf(info);
  const office = business?.homeOfficeActual;
  if (!business || !office) return undefined;
  const gap = homeOfficeActualGap(office) ?? sharedHomeGap(business, info.form8829Businesses ?? []);
  if (gap) return unsupported(gap);
  const line29 = tentativeProfit(business);
  if (line29 === undefined || office.ownsHome === undefined) return undefined;
  if (office.allGrossIncomeFromHome === undefined) return undefined;
  return form8829Figures(office, line29);
}

/* A Part II line from the figures. */
const fromFigures =
  (read: (figures: Form8829Figures) => number | undefined) =>
  (_: unknown, info: Form8829FilingInfo) => {
    const figures = figuresOf(info);
    return (figures === undefined || "unsupported" in figures ? figures : read(figures)) as never;
  };

/* Lines 18–22, one column: the stated amount, rounded. */
const column =
  (side: "direct" | "indirect", line: HomeExpenseLine) =>
  (_: unknown, info: Form8829FilingInfo) => {
    const office = businessOf(info)?.homeOfficeActual;
    const gap = office ? homeOfficeActualGap(office) : undefined;
    if (gap) return unsupported(gap);
    return roundDollars((office?.[side] as HomeExpenses | undefined)?.[line]);
  };

/* Line 3 and 7: the ratio printed as a percentage with two decimals. */
function percentText(info: Form8829FilingInfo): string | undefined {
  const office = businessOf(info)?.homeOfficeActual;
  const ratio = office ? businessPercentage(office) : undefined;
  if (ratio === undefined) return undefined;
  const hundredths = roundDollars(ratio * PERCENT_HUNDREDTHS);
  const fraction = hundredths % PERCENT_SCALE;
  return `${(hundredths - fraction) / PERCENT_SCALE}.${String(fraction).padStart(2, "0")}`;
}

/* An owner's lines (mortgage interest, real estate taxes, depreciation) and their totals: blank for a renter. */
const ownerLine = (_: unknown, info: Form8829FilingInfo) =>
  businessOf(info)?.homeOfficeActual?.ownsHome ? unsupported(OWNED_HOME_GAP) : undefined;

const OPERATING: Array<[string, HomeExpenseLine]> = [
  ["18_insurance", "insurance"],
  ["19_rent", "rent"],
  ["20_repairs_maintenance", "repairsAndMaintenance"],
  ["21_utilities", "utilities"],
  ["22_other_expenses", "other"],
];

function operatingBindings(): Bindings {
  const out: Record<string, unknown> = {};
  for (const [line, key] of OPERATING) {
    out[`0.line.${line}_col_a`] = column("direct", key);
    out[`0.line.${line}_col_b`] = column("indirect", key);
  }
  return out as Bindings;
}

const OWNER_FIELDS = [
  "0.line.12_total_lines_9_11_col_a",
  "0.line.12_total_lines_9_11_col_b",
  "0.line.13_indirect_business_share",
  "0.line.14_direct_plus_line_13",
  "0.line.10_mortgage_interest_col_a",
  "0.line.10_mortgage_interest_col_b",
  "0.line.11_real_estate_taxes_col_a",
  "0.line.11_real_estate_taxes_col_b",
  "0.line.16_excess_mortgage_interest_col_a",
  "0.line.16_excess_mortgage_interest_col_b",
  "0.line.17_excess_real_estate_taxes_col_a",
  "0.line.17_excess_real_estate_taxes_col_b",
  "0.line.30_home_depreciation",
  "0.line.37_home_basis_or_fmv",
  "0.line.38_land_value",
  "0.line.39_building_basis",
  "0.line.40_business_basis_building",
  "0.line.41_depreciation_percentage",
  "0.line.42_depreciation_allowable",
] as const;

export function register(): void {
  defineForm<Form8829, Form8829FilingInfo>("form-8829", {
    bindings: {
      "0.header.name": (_, info) =>
        info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      "0.header.ssn": (_, info) => (info.taxpayerSSN ? SSN.format(info.taxpayerSSN) : undefined),
      "0.line.1_business_area": (_, info) => businessOf(info)?.homeOfficeActual?.businessSquareFeet,
      "0.line.2_total_home_area": (_, info) => businessOf(info)?.homeOfficeActual?.homeSquareFeet,
      "0.line.3_business_percentage": (_, info) => percentText(info),
      // Line 7 = line 3 for a home office that is not a daycare facility.
      "0.line.7_business_percentage": (_, info) => percentText(info),
      "0.line.8_tentative_profit": fromFigures((figures) => figures.line8),
      ...Object.fromEntries(OWNER_FIELDS.map((field) => [field, ownerLine])),
      "0.line.15_limit_after_line_14": fromFigures((figures) => figures.line15),
      ...operatingBindings(),
      "0.line.23_total_lines_16_22_col_a": fromFigures((figures) => figures.line23a),
      "0.line.23_total_lines_16_22_col_b": fromFigures((figures) => figures.line23b),
      "0.line.24_indirect_operating_share": fromFigures((figures) => figures.line24),
      "0.line.25_operating_expense_carryover": fromFigures((figures) => figures.line25),
      "0.line.26_total_operating_expenses": fromFigures((figures) => figures.line26),
      "0.line.27_allowable_operating_expenses": fromFigures((figures) => figures.line27),
      "0.line.28_casualty_depreciation_limit": fromFigures((figures) => figures.line28),
      "0.line.31_casualty_depreciation_carryover": fromFigures((figures) => figures.line31),
      "0.line.32_total_lines_29_31": fromFigures((figures) => figures.line32),
      "0.line.33_allowable_casualty_depreciation": fromFigures((figures) => figures.line33),
      "0.line.34_total_lines_14_27_33": fromFigures((figures) => figures.line34),
      "0.line.36_allowable_expenses": fromFigures((figures) => figures.line36),
      "0.line.43_operating_expense_carryover_2026": fromFigures((figures) => figures.line43),
      "0.line.44_casualty_depreciation_carryover_2026": fromFigures((figures) => figures.line44),
    } as Bindings,
    unsupported: {
      "0.line.4_daycare_hours_used": DAYCARE,
      "0.line.5_daycare_hours_available": DAYCARE,
      "0.line.6_daycare_decimal": DAYCARE,
      "0.line.9_casualty_losses_col_a": CASUALTY,
      "0.line.9_casualty_losses_col_b": CASUALTY,
      "0.line.29_excess_casualty_losses": CASUALTY,
      "0.line.35_casualty_loss_portion": CASUALTY,
    },
  });
}
