/*
 * Form 2555 Parts IV to IX: the person's lines (person.ts, lines.ts) as the
 * form prints them. A gap makes every line from its part on unsupported.
 */

import type { ForeignEarnedIncomeFactValue } from "../../facts/index.js";
import { roundToPlaces } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { filerOf } from "./answers.js";
import type { Form2555FilingInfo } from "./filingInfo.js";
import { RATIO_PLACES, type PartIVLines } from "./lines.js";
import type { ExclusionLines } from "./person.js";
import { line44Of, line45Of, type ReturnAccessor } from "./results.js";

type Value = string | number | boolean | Unsupported | undefined;
type Binding = (form: ReturnAccessor, info: Form2555FilingInfo) => Value;

/* A Part IV line: unsupported with a Part IV gap. */
function partIV(pick: (lines: PartIVLines) => Value): Binding {
  return (_, info) => {
    const filer = filerOf(info);
    if (filer === undefined) return undefined;
    if (filer.partIVGap !== undefined) return unsupported(filer.partIVGap);
    return filer.partIV === undefined ? undefined : pick(filer.partIV);
  };
}

/* A Parts V to IX line: unsupported with any gap. */
function exclusion(pick: (lines: ExclusionLines) => Value): Binding {
  return (_, info) => {
    const filer = filerOf(info);
    if (filer === undefined) return undefined;
    const gap = filer.partIVGap ?? filer.exclusionGap;
    if (gap !== undefined) return unsupported(gap);
    return filer.exclusion === undefined ? undefined : pick(filer.exclusion);
  };
}

/* The words next to an amount line (lines 20b, 21d, 22f, 23): first line and the rest. */
function words(
  pick: (answers: ForeignEarnedIncomeFactValue) => string | undefined,
  line: 0 | 1,
): Binding {
  return (_, info) => {
    const filer = filerOf(info);
    const text = filer === undefined ? undefined : pick(filer.answers);
    if (text === undefined) return undefined;
    const [first, ...rest] = text.split("\n");
    return line === 0 ? first : rest.length > 0 ? rest.join(" ") : undefined;
  };
}

type Answers = ForeignEarnedIncomeFactValue;
const partnershipWords = (answers: Answers) => answers.partnership?.description;
const otherNoncashWords = (answers: Answers) => answers.noncash?.other?.description;
const otherAllowanceWords = (answers: Answers) => answers.allowances?.other?.description;
const otherIncomeWords = (answers: Answers) => answers.otherIncome?.description;

/* A ratio printed around the form's point: "1" or "0", then three digits. */
const SCALE = 10 ** RATIO_PLACES;
const wholeText = (ratio: number | undefined) =>
  ratio === undefined ? undefined : ratio >= 1 ? "1" : "0";
const decimalText = (ratio: number | undefined) =>
  ratio === undefined
    ? undefined
    : String(roundToPlaces(ratio * SCALE, 0) % SCALE).padStart(RATIO_PLACES, "0");

const partIVBindings: Record<string, Binding> = {
  "1.line.19_total_wages_salaries_bonuses": partIV((lines) => lines.line19),
  "1.line.20a_business_or_profession_income": partIV((lines) => lines.line20a),
  "1.line.20b_partnership_name_address_type_1": words(partnershipWords, 0),
  "1.line.20b_partnership_name_address_type_2": words(partnershipWords, 1),
  "1.line.20b_partnership_income": partIV((lines) => lines.line20b),
  "1.line.21a_noncash_home_lodging": partIV((lines) => lines.line21a),
  "1.line.21b_noncash_meals": partIV((lines) => lines.line21b),
  "1.line.21c_noncash_car": partIV((lines) => lines.line21c),
  "1.line.21d_other_property_type_amount_1": words(otherNoncashWords, 0),
  "1.line.21d_other_property_type_amount_2": words(otherNoncashWords, 1),
  "1.line.21d_noncash_other_property": partIV((lines) => lines.line21d),
  "1.line.22a_cost_of_living_differential": partIV((lines) => lines.line22a),
  "1.line.22b_family_allowance": partIV((lines) => lines.line22b),
  "1.line.22c_education_allowance": partIV((lines) => lines.line22c),
  "1.line.22d_home_leave_allowance": partIV((lines) => lines.line22d),
  "1.line.22e_quarters_allowance": partIV((lines) => lines.line22e),
  "1.line.22f_other_purpose_type_amount_1": words(otherAllowanceWords, 0),
  "1.line.22f_other_purpose_type_amount_2": words(otherAllowanceWords, 1),
  "1.line.22f_other_purpose_allowance": partIV((lines) => lines.line22f),
  "1.line.22g_total_allowances": partIV((lines) => lines.line22g),
  "1.line.23_other_income_type_amount_1": words(otherIncomeWords, 0),
  "1.line.23_other_income_type_amount_2": words(otherIncomeWords, 1),
  "1.line.23_other_foreign_earned_income": partIV((lines) => lines.line23),
  "1.line.24_total_before_excludable_meals_lodging": partIV((lines) => lines.line24),
  "1.line.25_excludable_meals_lodging": partIV((lines) => lines.line25),
  "1.line.26_foreign_earned_income": partIV((lines) => lines.line26),
};

/* Part V's question: "Are you claiming the housing exclusion or housing deduction?" */
const partVBindings: Record<string, Binding> = {
  "2.line.27_amount_from_line_26": exclusion((lines) => lines.line27),
  "2.line.27_claiming_housing_exclusion_deduction_yes": exclusion((lines) =>
    lines.claimsHousing ? true : undefined,
  ),
  "2.line.27_claiming_housing_exclusion_deduction_no": exclusion((lines) =>
    lines.claimsHousing ? undefined : true,
  ),
};

/* Line 29a: "only if your location is listed in Notice 2025-16; otherwise, leave this line blank" (line-29a::b01). */
const partVIBindings: Record<string, Binding> = {
  "2.line.28_qualified_housing_expenses": exclusion((lines) => lines.partVI?.line28),
  "2.line.29a_housing_expenses_location": exclusion(() => undefined),
  "2.line.29b_housing_expenses_limit": exclusion((lines) => lines.partVI?.line29b),
  "2.line.30_smaller_of_line_28_or_29b": exclusion((lines) => lines.partVI?.line30),
  "2.line.31_qualifying_period_days": exclusion((lines) => lines.partVI?.line31),
  "2.line.32_base_housing_amount": exclusion((lines) => lines.partVI?.line32),
  "2.line.33_housing_amount": exclusion((lines) => lines.partVI?.line33),
  "2.line.34_employer_provided_amounts": exclusion((lines) => lines.partVI?.line34),
  "2.line.35_employer_provided_ratio_whole": exclusion((lines) => wholeText(lines.partVI?.line35)),
  "2.line.35_employer_provided_ratio_decimal": exclusion((lines) =>
    decimalText(lines.partVI?.line35),
  ),
  "2.line.36_housing_exclusion": exclusion((lines) => lines.partVI?.line36),
};

const partVIIBindings: Record<string, Binding> = {
  "2.line.37_maximum_foreign_earned_income_exclusion": exclusion((lines) => lines.partVII?.line37),
  "2.line.38_qualifying_period_days": exclusion((lines) => lines.partVII?.line38),
  "2.line.39_qualifying_days_ratio_whole": exclusion((lines) => wholeText(lines.partVII?.line39)),
  "2.line.39_qualifying_days_ratio_decimal": exclusion((lines) =>
    decimalText(lines.partVII?.line39),
  ),
  "2.line.40_prorated_maximum_exclusion": exclusion((lines) => lines.partVII?.line40),
  "2.line.41_income_less_housing_exclusion": exclusion((lines) => lines.partVII?.line41),
  "2.line.42_foreign_earned_income_exclusion": exclusion((lines) => lines.partVII?.line42),
};

/* Lines 44 and 45 read Schedule 1 line 15 for a self-employed person (results.ts). */
function partVIIIBindings(): Record<string, Binding> {
  const withFiler =
    (pick: typeof line44Of): Binding =>
    (form, info) => {
      const filer = filerOf(info);
      return filer === undefined ? undefined : pick(filer, form, info);
    };
  return {
    "2.line.43_total_exclusions": exclusion((lines) => lines.line43),
    "2.line.44_deductions_allocable_excluded_income": withFiler(line44Of),
    "2.line.45_net_exclusion": withFiler(line45Of),
  };
}

const partIXBindings: Record<string, Binding> = {
  "2.line.46_housing_amount_less_exclusion": exclusion((lines) => lines.partIX?.line46),
  "2.line.47_income_less_total_exclusions": exclusion((lines) => lines.partIX?.line47),
  "2.line.48_smaller_of_line_46_or_47": exclusion((lines) => lines.partIX?.line48),
  "2.line.49_housing_deduction_carryover": exclusion((lines) => lines.partIX?.line49),
  "2.line.50_housing_deduction": exclusion((lines) => lines.partIX?.line50),
};

export const amountBindings = (): Record<string, Binding> => ({
  ...partIVBindings,
  ...partVBindings,
  ...partVIBindings,
  ...partVIIBindings,
  ...partVIIIBindings(),
  ...partIXBindings,
});
