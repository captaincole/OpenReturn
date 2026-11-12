/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type FormAccessor } from "../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars, sum } from "../../money.js";
import { unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import type { Form8962FilingInfo } from "./filingInfo.js";
// MANUAL EDIT: isApplicableTaxpayer moved to lines.ts, which binds lines 9–36.
import { isApplicableTaxpayer, partsFourFiveBindings, partTwoBindings } from "./lines.js";
import type { Form8962 } from "./types.js";

/* Line 4, Tables 1-1 to 1-3 (the 2024 poverty lines): family size 1, and each person over 1. */
const POVERTY_LINE_48_STATES_DC = { base: 15_060, perPerson: 5_380 };
const POVERTY_LINE_ALASKA = { base: 18_810, perPerson: 6_730 };
const POVERTY_LINE_HAWAII = { base: 17_310, perPerson: 6_190 };

/* Line 5, Worksheet 2: above 400% of the poverty line, enter 401. */
const FPL_MULTIPLE_CAP = 4;
const ABOVE_CAP_PERCENT = 401;
const LOWEST_REGULAR_PERCENT = 100;

/* Line 7, Table 2, in hundred-thousandths: 0 at 150 or less, +40 per point to 300, +25 per point to 400. */
const TABLE_2_FLOOR_PERCENT = 150;
const TABLE_2_BREAK_PERCENT = 300;
const TABLE_2_CAP_PERCENT = 400;
const TABLE_2_LOWER_STEP = 40;
const TABLE_2_UPPER_STEP = 25;
const TABLE_2_AT_BREAK = 6_000;
const TABLE_2_AT_CAP = 8_500;
const HUNDRED_THOUSANDTHS_PER_TEN_THOUSANDTH = 10;
const TEN_THOUSANDTHS_PER_UNIT = 10_000;
const MONTHS_PER_YEAR = 12;

const DEPENDENTS_MAGI_NOT_ASKED =
  "Line 2b needs the modified AGI of each dependent who must file a return, which the engine does not ask.";
const BELOW_POVERTY_LINE =
  "Household income below 100% of the poverty line needs the Marketplace-estimate or lawfully-present tests, which the engine does not model.";

type Info = Form8962FilingInfo;
type Form = FormAccessor<Form8962>;

/* The Table 1 row for the state of residence. */
function povertyTable(info: Info) {
  if (info.homeAddressState === "AK") return POVERTY_LINE_ALASKA;
  if (info.homeAddressState === "HI") return POVERTY_LINE_HAWAII;
  return POVERTY_LINE_48_STATES_DC;
}

/* Table 2 for a line 5 percentage, in ten-thousandths, rounded half up (301 → 603, i.e. 0.0603). */
function applicableFigure(percent: number): number {
  let hundredThousandths: number;
  if (percent <= TABLE_2_FLOOR_PERCENT) hundredThousandths = 0;
  else if (percent <= TABLE_2_BREAK_PERCENT)
    hundredThousandths = TABLE_2_LOWER_STEP * (percent - TABLE_2_FLOOR_PERCENT);
  else if (percent < TABLE_2_CAP_PERCENT)
    hundredThousandths = TABLE_2_AT_BREAK + TABLE_2_UPPER_STEP * (percent - TABLE_2_BREAK_PERCENT);
  else hundredThousandths = TABLE_2_AT_CAP;
  const half = HUNDRED_THOUSANDTHS_PER_TEN_THOUSANDTH / 2;
  const raised = hundredThousandths + half;
  return (
    (raised - (raised % HUNDRED_THOUSANDTHS_PER_TEN_THOUSANDTH)) /
    HUNDRED_THOUSANDTHS_PER_TEN_THOUSANDTH
  );
}

/* Lines 7–8b: the applicable figure in ten-thousandths; blank when skipped (an MFS filer without Exception 2). */
function contributionFigure(form: Form, info: Info) {
  const line5 = form["0.line.5_household_income_percent_fpl"];
  if (line5 === undefined || isApplicableTaxpayer(info) !== true) return undefined;
  if (line5 < LOWEST_REGULAR_PERCENT) return unsupported(BELOW_POVERTY_LINE);
  return applicableFigure(line5);
}

export function register(): void {
  defineForm<Form8962, Form8962FilingInfo>("form-8962", {
    bindings: {
      // MANUAL EDIT: no combined-name fact; concatenate first + last. The MFJ spouse name is not modeled.
      "0.header.taxpayer_name": (_, info) =>
        info.taxpayerFirstName && info.taxpayerLastName
          ? `${info.taxpayerFirstName} ${info.taxpayerLastName}`
          : undefined,
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      "0.header.a_mfs_exception": (_, info) => {
        if (info.filingStatus === undefined) return undefined;
        if (info.filingStatus !== "married_filing_separately") return false;
        return info.ptcMfsException;
      },
      // MANUAL EDIT: you, an MFJ spouse and each dependent; a filer someone can claim is not modeled (1040 line 12a).
      "0.line.1_tax_family_size": (_, info) => {
        if (info.filingStatus === undefined || info.dependentCount === undefined) return undefined;
        const spouse = info.filingStatus === "married_filing_jointly" ? 1 : 0;
        return 1 + spouse + info.dependentCount;
      },
      // MANUAL EDIT: Worksheet 1-1. Line 3 (Form 2555 lines 45 and 50) is 0: the engine models no Form 2555.
      "0.line.2a_modified_agi": (form) => {
        const agi = numberOrBlank(form["form-1040.line.11a"]);
        if (agi === undefined) return undefined;
        const benefits = numberOrBlank(form["form-1040.line.6a"]);
        const taxable = numberOrBlank(form["form-1040.line.6b"]);
        if (benefits !== undefined && taxable === undefined) return undefined;
        const nontaxableBenefits = atLeast(0, sum(benefits) - sum(taxable));
        return sum(agi, form["form-1040.line.2a"], nontaxableBenefits);
      },
      "0.line.2b_dependents_modified_agi": (_, info) => {
        if (info.dependentCount === undefined || info.dependentCount === 0) return undefined;
        return unsupported(DEPENDENTS_MAGI_NOT_ASKED);
      },
      // "If the total is less than zero, enter -0- on line 3."
      "0.line.3_household_income": (form, info) => {
        const line2a = form["0.line.2a_modified_agi"];
        if (line2a === undefined || info.dependentCount === undefined) return undefined;
        if (info.dependentCount > 0) return unsupported(DEPENDENTS_MAGI_NOT_ASKED);
        return atLeast(0, line2a);
      },
      // MANUAL EDIT: the box follows the home address; a move or an MFJ spouse in another state is not modeled.
      "0.line.4_alaska": (_, info) =>
        info.homeAddressState === undefined ? undefined : info.homeAddressState === "AK",
      "0.line.4_hawaii": (_, info) =>
        info.homeAddressState === undefined ? undefined : info.homeAddressState === "HI",
      "0.line.4_other_48_states_dc": (_, info) =>
        info.homeAddressState === undefined
          ? undefined
          : info.homeAddressState !== "AK" && info.homeAddressState !== "HI",
      "0.line.4_federal_poverty_line": (form, info) => {
        const familySize = form["0.line.1_tax_family_size"];
        if (familySize === undefined || info.homeAddressState === undefined) return undefined;
        if (familySize < 1) return undefined;
        const table = povertyTable(info);
        return table.base + table.perPerson * (familySize - 1);
      },
      // MANUAL EDIT: Worksheet 2. "Do not round"; drop the decimals with integer remainder math. Below 100 still prints.
      "0.line.5_household_income_percent_fpl": (form) => {
        const line3 = form["0.line.3_household_income"];
        const line4 = form["0.line.4_federal_poverty_line"];
        if (line3 === undefined || line4 === undefined) return undefined;
        if (line3 > line4 * FPL_MULTIPLE_CAP) return ABOVE_CAP_PERCENT;
        const scaled = line3 * 100;
        return (scaled - (scaled % line4)) / line4;
      },
      // MANUAL EDIT: printed as the table prints it ("0.0603"); toFixed is banned, so build the digits.
      "0.line.7_applicable_figure": (form, info) => {
        const figure = contributionFigure(form, info);
        if (typeof figure !== "number") return figure;
        return `0.${String(figure).padStart(4, "0")}`;
      },
      "0.line.8a_annual_contribution_amount": (form, info) => {
        const figure = contributionFigure(form, info);
        if (typeof figure !== "number") return figure;
        const line3 = form["0.line.3_household_income"];
        if (line3 === undefined) return undefined;
        return roundDollars((line3 * figure) / TEN_THOUSANDTHS_PER_UNIT);
      },
      "0.line.8b_monthly_contribution_amount": (form, info) => {
        const figure = contributionFigure(form, info);
        if (typeof figure !== "number") return figure;
        const line8a = form["0.line.8a_annual_contribution_amount"];
        return line8a === undefined ? undefined : roundDollars(line8a / MONTHS_PER_YEAR);
      },
      ...partTwoBindings(),
      ...partsFourFiveBindings(),
    },

    // MANUAL EDIT: the SSN renders with dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
