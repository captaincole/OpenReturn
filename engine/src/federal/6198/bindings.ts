/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 *
 * MANUAL EDIT: every line comes from one computation, figureForm6198 in
 * figure.ts, which the K-1 at-risk stage (passThrough/atRisk.ts) and Schedule
 * C line 31 (schedule-c/atRisk.ts) read too. One copy for each activity that
 * files the form (resolveInfo.ts). A line is blank while the owner's amounts at
 * risk are missing, and carries the activity's reason when the computation does
 * not handle the case. QUESTIONS.md lists the doubts.
 */

import { defineForm, type FormSpec } from "../../defineForm.js";
import { unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { Form6198Figures } from "./figure.js";
import type { Form6198Copy, Form6198FilingInfo } from "./filingInfo.js";
import type { PartIIILines, PartIILines } from "./lines.js";
import type { Form6198 } from "./types.js";

type Info = Form6198FilingInfo;
type Fn = (form: unknown, info: Info) => unknown;
type Spec = FormSpec<Form6198, Info>;
type Figures = Form6198Figures<unknown>;

const copyOf = (info: Info): Form6198Copy | undefined =>
  info.form6198Copies?.[info.form6198CopyIndex ?? 0];

/* A line from the figures: blank while they wait, the reason when they cannot be figured. */
function fromFigures(read: (figures: Figures) => unknown): Fn {
  return (_, info) => {
    const outcome = copyOf(info)?.outcome;
    if (outcome === undefined || outcome.kind === "waiting") return undefined;
    if (outcome.kind === "unsupported") return unsupported(outcome.reason);
    return read(outcome.figures);
  };
}

const partII = (read: (lines: PartIILines) => unknown) =>
  fromFigures((figures) => (figures.partII ? read(figures.partII) : undefined));
const partIII = (read: (lines: PartIIILines) => unknown) =>
  fromFigures((figures) => (figures.partIII ? read(figures.partIII) : undefined));

/* An amount the form prints only when it is more than 0: an increase or decrease with nothing to enter. */
const aboveZero = (amount: number) => (amount > 0 ? amount : undefined);

/* A check box: checked (true) or blank. */
const checked = (yes: boolean) => (yes ? true : undefined);

function headerBindings(): Record<string, Fn> {
  return {
    "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
    // MANUAL EDIT: the owner of the activity's number: the spouse's for the spouse's K-1 or business.
    "0.header.identifying_number": (_, info) =>
      copyOf(info)?.owner === "spouse" ? info.spouseSSN : info.taxpayerSSN,
    // MANUAL EDIT: the activity, then the partnership's or S corporation's name and EIN (irs-6198-inst-2025::sec::specific-instructions::b01).
    "0.header.activity_description": (_, info) => copyOf(info)?.description,
  };
}

/* Part I (irs-6198-inst-2025::sec::line-1::b01 to ::line-5::b02): each line's entries, line 5 their total. */
function partIBindings(): Record<string, Fn> {
  return {
    "0.line.1_ordinary_income_loss": fromFigures((figures) => figures.partI.line1),
    "0.line.2a_gain_loss_schedule_d": fromFigures((figures) => figures.partI.line2a),
    "0.line.2b_gain_loss_form_4797": fromFigures((figures) => figures.partI.line2b),
    "0.line.2c_gain_loss_other_form": fromFigures((figures) => figures.partI.line2c),
    "0.line.3_other_income_gains_k1": fromFigures((figures) => figures.partI.line3),
    // MANUAL EDIT: line 4 prints in parentheses, so its deductions and losses are a positive amount.
    "0.line.4_other_deductions_losses": fromFigures((figures) =>
      figures.partI.line4 === undefined ? undefined : 0 - figures.partI.line4,
    ),
    "0.line.5_current_year_profit_loss": fromFigures((figures) => figures.partI.line5),
  };
}

/* Part II (::part-ii-simplified::b01, ::line-6::b01 to ::line-10b::b01), when the owner gives the adjusted basis. */
function partIIBindings(): Record<string, Fn> {
  return {
    "0.line.6_adjusted_basis_first_day": partII((lines) => lines.line6),
    "0.line.7_increases_for_tax_year": partII((lines) => aboveZero(lines.line7)),
    "0.line.8_add_lines_6_7": partII((lines) => lines.line8),
    "0.line.9_decreases_for_tax_year": partII((lines) => aboveZero(lines.line9)),
    "0.line.10a_subtract_line_9_from_8": partII((lines) => lines.line10a),
    "0.line.10b_simplified_amount_at_risk": partII((lines) => lines.line10b),
  };
}

/*
 * Part III (::part-iii-detailed::b01 to ::line-19b::b01). Lines 11 to 14 only
 * when it starts at the effective date; boxes 15b, 16b and 18b when Part III was
 * completed last year, else box a.
 */
function partIIIBindings(): Record<string, Fn> {
  return {
    "0.line.11_investment_at_effective_date": partIII((lines) => lines.line11),
    "0.line.12_increases_at_effective_date": partIII((lines) =>
      lines.line12 === undefined ? undefined : aboveZero(lines.line12),
    ),
    "0.line.13_add_lines_11_12": partIII((lines) => lines.line13),
    "0.line.14_decreases_at_effective_date": partIII((lines) =>
      lines.line14 === undefined ? undefined : aboveZero(lines.line14),
    ),
    "0.line.15a_at_effective_date_checkbox": partIII((lines) => checked(lines.line15Box === "a")),
    "0.line.15b_from_prior_year_checkbox": partIII((lines) => checked(lines.line15Box === "b")),
    "0.line.15_amount_at_risk": partIII((lines) => lines.line15),
    "0.line.16a_increases_since_effective_date_checkbox": partIII((lines) =>
      checked(lines.sinceBox === "a"),
    ),
    "0.line.16b_increases_since_prior_year_end_checkbox": partIII((lines) =>
      checked(lines.sinceBox === "b"),
    ),
    "0.line.16_increases_since": partIII((lines) => aboveZero(lines.line16)),
    "0.line.17_add_lines_15_16": partIII((lines) => lines.line17),
    "0.line.18a_decreases_since_effective_date_checkbox": partIII((lines) =>
      checked(lines.sinceBox === "a"),
    ),
    "0.line.18b_decreases_since_prior_year_end_checkbox": partIII((lines) =>
      checked(lines.sinceBox === "b"),
    ),
    "0.line.18_decreases_since": partIII((lines) => aboveZero(lines.line18)),
    "0.line.19a_subtract_line_18_from_17": partIII((lines) => lines.line19a),
    "0.line.19b_detailed_amount_at_risk": partIII((lines) => lines.line19b),
  };
}

/* Part IV (::part-iv-deductible-loss::b01): line 20 the larger amount at risk, line 21 the deductible loss. */
function partIVBindings(): Record<string, Fn> {
  return {
    "0.line.20_amount_at_risk": fromFigures((figures) => figures.line20),
    // MANUAL EDIT: line 21 prints in parentheses ("enter ($400)"), so the deductible loss is a positive amount.
    "0.line.21_deductible_loss": fromFigures((figures) =>
      figures.line21 === undefined ? undefined : 0 - figures.line21,
    ),
  };
}

export function register(): void {
  const bindings = {
    ...headerBindings(),
    ...partIBindings(),
    ...partIIBindings(),
    ...partIIIBindings(),
    ...partIVBindings(),
  } as Spec["bindings"];
  defineForm<Form6198, Form6198FilingInfo>("form-6198", {
    bindings,
    // The identifying number widget keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
