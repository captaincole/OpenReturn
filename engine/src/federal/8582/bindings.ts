/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 */

import { defineForm, type BindingFn, type FormAccessor } from "../../defineForm.js";
import { numberOrBlank, roundDollars, sum, sumOrBlank } from "../../money.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import {
  activitiesByPart,
  overallOf,
  passiveActivities,
  ROWS_PER_PART,
  type ActivityPart,
  type PassiveActivity,
} from "./activities.js";
import { allocationBindings, part9Unsupported } from "./allocationBindings.js";
import type { Form8582FilingInfo } from "./filingInfo.js";
import { modifiedAgi } from "./magi.js";
import type { Form8582 } from "./types.js";

type Fn = (f: FormAccessor<Form8582>, info: Form8582FilingInfo) => unknown;
type Bindings = Partial<{ [K in keyof Form8582]: BindingFn<Form8582, Form8582FilingInfo, K> }>;

// MANUAL EDIT: Parts IV and V share one layout; Part V is on page 2.
const PARTS: ReadonlyArray<{ part: ActivityPart; prefix: string }> = [
  { part: "part4", prefix: "0.part4" },
  { part: "part5", prefix: "1.part5" },
];

/* Columns (a)–(c) print as positive amounts; a zero leaves the cell blank. */
const AMOUNT_COLUMNS: ReadonlyArray<{
  suffix: string;
  amount: (activity: PassiveActivity) => number;
}> = [
  { suffix: "col_a_net_income", amount: (activity) => activity.netIncome },
  { suffix: "col_b_net_loss", amount: (activity) => activity.netLoss },
  { suffix: "col_c_unallowed_loss", amount: (activity) => activity.priorUnallowedLoss },
];

// MANUAL EDIT: Part II amounts (form lines 5 and 8; line-5::b01, line-8::b01 for MFS living apart).
const ALLOWANCE_THRESHOLD = 150000;
const ALLOWANCE_THRESHOLD_MFS_APART = 75000;
const ALLOWANCE_RATE = 0.5;
const MAX_ALLOWANCE = 25000;
const MAX_ALLOWANCE_MFS_APART = 12500;

const positiveOrBlank = (value: number) => (value > 0 ? value : undefined);

function activitiesIn(form: FormAccessor<Form8582>, info: Form8582FilingInfo, part: ActivityPart) {
  return activitiesByPart(
    info,
    (column) => form[`schedule-e.0.line.21_income_or_loss_${column}`],
  )?.[part];
}

// Rows 1–5: name, columns (a)–(c), then the overall gain (d) or loss (e).
function rowBindings(part: ActivityPart, prefix: string): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  for (let rowNumber = 1; rowNumber <= ROWS_PER_PART; rowNumber++) {
    const row = (form: FormAccessor<Form8582>, info: Form8582FilingInfo) =>
      activitiesIn(form, info, part)?.[rowNumber - 1];
    const key = `${prefix}.row_${rowNumber}`;
    out[`${key}_name`] = (form, info) => row(form, info)?.name;
    for (const { suffix, amount } of AMOUNT_COLUMNS) {
      out[`${key}_${suffix}`] = (form, info) => {
        const activity = row(form, info);
        return activity ? positiveOrBlank(amount(activity)) : undefined;
      };
    }
    out[`${key}_col_d_gain`] = (form, info) => {
      const activity = row(form, info);
      return activity ? positiveOrBlank(overallOf(activity)) : undefined;
    };
    out[`${key}_col_e_loss`] = (form, info) => {
      const activity = row(form, info);
      return activity ? positiveOrBlank(-overallOf(activity)) : undefined;
    };
  }
  return out;
}

// Total of columns (a)–(c); blank when no row has an amount.
function totalBindings(part: ActivityPart, prefix: string): Record<string, Fn> {
  const out: Record<string, Fn> = {};
  for (const { suffix, amount } of AMOUNT_COLUMNS) {
    out[`${prefix}.total_${suffix}`] = (form, info) =>
      sumOrBlank(
        ...(activitiesIn(form, info, part) ?? []).map((activity) =>
          positiveOrBlank(amount(activity)),
        ),
      );
  }
  return out;
}

const PART4_TOTAL = totalBindings("part4", "0.part4");
const PART5_TOTAL = totalBindings("part5", "1.part5");

// The Part IV or V total of column (a), (b) or (c), as its total row prints it.
function partTotal(
  form: FormAccessor<Form8582>,
  info: Form8582FilingInfo,
  totals: Record<string, Fn>,
  column: "a" | "b" | "c",
) {
  const key = Object.keys(totals).find((fieldId) => fieldId.includes(`.total_col_${column}_`));
  return key === undefined ? undefined : totals[key](form, info);
}

// Lines 1d and 2d: (a) less the parenthesized (b) and (c); signed, blank when all three are.
function combined(income: unknown, loss: unknown, prior: unknown) {
  return sumOrBlank(income, loss, prior) === undefined
    ? undefined
    : sum(income) - sum(loss) - sum(prior);
}

// MANUAL EDIT: line 3 is a loss: Part III applies; undefined while line 3 is blank.
function line3IsLoss(form: FormAccessor<Form8582>) {
  const line3 = numberOrBlank(form["0.line.3_combined"]);
  return line3 === undefined ? undefined : line3 < 0;
}

/*
 * MANUAL EDIT: the gates after line 3. Part II needs a loss on lines 3 and 1d;
 * MFS spouses who lived together at any time skip it
 * (part-ii-special-allowance-for-rental::b01).
 */
function partIIApplies(form: FormAccessor<Form8582>, info: Form8582FilingInfo) {
  const loss = line3IsLoss(form);
  if (!loss) return loss;
  if ((numberOrBlank(form["0.line.1d_rental_combined"]) ?? 0) >= 0) return false;
  if (info.filingStatus !== "married_filing_separately") return true;
  return info.livedApartFromSpouseAllYear;
}

const mfsApart = (info: Form8582FilingInfo) =>
  info.filingStatus === "married_filing_separately" && info.livedApartFromSpouseAllYear === true;

// MANUAL EDIT: "If line 6 is greater than or equal to line 5, skip lines 7 and 8 and enter -0- on line 9."
function line6ReachesLine5(form: FormAccessor<Form8582>) {
  const line5 = numberOrBlank(form["0.line.5_allowance_threshold"]);
  const line6 = numberOrBlank(form["0.line.6_modified_agi"]);
  return line5 === undefined || line6 === undefined ? undefined : line6 >= line5;
}

// MANUAL EDIT: Parts II and III, all positive amounts (part-ii-special-allowance-for-rental::b02).
const partsIIAndIII: Record<string, Fn> = {
  "0.line.4_smaller_loss_1d_or_3": (form, info) =>
    partIIApplies(form, info)
      ? Math.min(-sum(form["0.line.1d_rental_combined"]), -sum(form["0.line.3_combined"]))
      : undefined,
  "0.line.5_allowance_threshold": (form, info) => {
    if (!partIIApplies(form, info)) return undefined;
    return mfsApart(info) ? ALLOWANCE_THRESHOLD_MFS_APART : ALLOWANCE_THRESHOLD;
  },
  "0.line.6_modified_agi": (form, info) =>
    partIIApplies(form, info) ? modifiedAgi(form, info) : undefined,
  "0.line.7_line5_minus_line6": (form) =>
    line6ReachesLine5(form) === false
      ? sum(form["0.line.5_allowance_threshold"]) - sum(form["0.line.6_modified_agi"])
      : undefined,
  "0.line.8_half_of_line7": (form, info) => {
    const line7 = numberOrBlank(form["0.line.7_line5_minus_line6"]);
    if (line7 === undefined) return undefined;
    const cap = mfsApart(info) ? MAX_ALLOWANCE_MFS_APART : MAX_ALLOWANCE;
    return Math.min(roundDollars(line7 * ALLOWANCE_RATE), cap);
  },
  // No fact gives prior-year unallowed CRD, so the CRD worksheet adds nothing (line-9::b01).
  "0.line.9_special_allowance": (form) => {
    const reaches = line6ReachesLine5(form);
    if (reaches === undefined) return undefined;
    if (reaches) return 0;
    const line8 = numberOrBlank(form["0.line.8_half_of_line7"]);
    return line8 === undefined
      ? undefined
      : Math.min(sum(form["0.line.4_smaller_loss_1d_or_3"]), line8);
  },
  "0.line.10_income_lines_1a_2a": (form) =>
    line3IsLoss(form)
      ? sumOrBlank(form["0.line.1a_rental_net_income"], form["0.line.2a_other_net_income"])
      : undefined,
  // Line 9 waits while Part II applies; a skipped Part II adds nothing.
  "0.line.11_total_losses_allowed": (form, info) => {
    const partII = partIIApplies(form, info);
    if (!line3IsLoss(form) || partII === undefined) return undefined;
    const line9 = numberOrBlank(form["0.line.9_special_allowance"]);
    if (partII && line9 === undefined) return undefined;
    return sumOrBlank(line9, form["0.line.10_income_lines_1a_2a"]);
  },
};

export function register(): void {
  const bindings: Record<string, Fn> = {
    "0.header.name": (_, info) => namesOnReturn(info),
    // A joint return shows the SSN listed first on Form 1040, the taxpayer's.
    "0.header.identifying_number": (_, info) => info.taxpayerSSN,
    /*
     * MANUAL EDIT: lines 1a–2c compute the Part IV and V totals here, not read them:
     * those fields come later in catalog order, and a read of a later field blocks
     * for the pass, which a cross-form sum() could count as 0.
     */
    "0.line.1a_rental_net_income": (form, info) => partTotal(form, info, PART4_TOTAL, "a"),
    "0.line.1b_rental_net_loss": (form, info) => partTotal(form, info, PART4_TOTAL, "b"),
    "0.line.1c_rental_prior_unallowed": (form, info) => partTotal(form, info, PART4_TOTAL, "c"),
    "0.line.1d_rental_combined": (form) =>
      combined(
        form["0.line.1a_rental_net_income"],
        form["0.line.1b_rental_net_loss"],
        form["0.line.1c_rental_prior_unallowed"],
      ),
    "0.line.2a_other_net_income": (form, info) => partTotal(form, info, PART5_TOTAL, "a"),
    "0.line.2b_other_net_loss": (form, info) => partTotal(form, info, PART5_TOTAL, "b"),
    "0.line.2c_other_prior_unallowed": (form, info) => partTotal(form, info, PART5_TOTAL, "c"),
    "0.line.2d_other_combined": (form) =>
      combined(
        form["0.line.2a_other_net_income"],
        form["0.line.2b_other_net_loss"],
        form["0.line.2c_other_prior_unallowed"],
      ),
    // MANUAL EDIT: no CRD fact, so none is subtracted; a blank 1d or 2d counts once both parts settle.
    "0.line.3_combined": (form, info) =>
      passiveActivities(info, (column) => form[`schedule-e.0.line.21_income_or_loss_${column}`])
        ? sumOrBlank(form["0.line.1d_rental_combined"], form["0.line.2d_other_combined"])
        : undefined,
    ...partsIIAndIII,
    ...PARTS.reduce((acc, { part, prefix }) => ({ ...acc, ...rowBindings(part, prefix) }), {}),
    ...PARTS.reduce((acc, { part, prefix }) => ({ ...acc, ...totalBindings(part, prefix) }), {}),
    ...allocationBindings(),
  };
  defineForm<Form8582, Form8582FilingInfo>("form-8582", {
    bindings: bindings as Bindings,
    unsupported: part9Unsupported() as Partial<Record<keyof Form8582, string>>,
    formatters: {
      // The identifying number renders with dashes; this form has no comb widget.
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
