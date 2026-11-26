/*
 * FTB 5805F rules, written by hand from ca-5805f-inst-2025 and the form face
 * (no answer key: QUESTIONS.md). The arithmetic is in lines.ts.
 */

import { defineForm, type BindingFn, type FormAccessor } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { numberOrBlank, sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Form5805FAnswers, Form5805FFilingInfo } from "./filingInfo.js";
import {
  dateText,
  EXPLANATION_ROW_CHARACTERS,
  explanationRows,
  form5805FLines,
  type Form5805FLines,
  type PenaltyLines,
} from "./lines.js";
import type { Form5805F } from "./types.js";

type Accessor = FormAccessor<Form5805F>;
type Bindings = Partial<{
  [K in keyof Form5805F]: BindingFn<Form5805F, Form5805FFilingInfo, K>;
}>;

const NO_FORM_540 =
  "FTB 5805F is modeled for Form 540 filers only; the Form 540NR and Form 541 lines are not read.";

/* ca-5805f-inst-2025::sec::e-waiver-of-the-penalty::b01: "If you need more space, attach a statement." */
const LONG_EXPLANATION =
  "The waiver explanation is longer than the two rows below line 16; the instructions ask for an attached statement, which the engine does not print.";

/* How far the answers reach: each stage needs every answer of the stages before it. */
const STAGES = ["none", "current", "prior", "partI", "all"] as const;
type Stage = (typeof STAGES)[number];

const reaches = (stage: Stage, needed: Stage) => STAGES.indexOf(stage) >= STAGES.indexOf(needed);

/* The last stage whose answers are all in. */
function stageOf(form: Accessor, answers: Form5805FAnswers): Stage {
  if (typeof form["form-540.line.48_tax_after_credits"] !== "number") return "none";
  if (answers.priorYear === undefined) return "current";
  if (answers.paymentsByDueDate === undefined) return "prior";
  if (typeof form["form-540.line.17_ca_agi"] !== "number") return "prior";
  if (answers.filedAndPaidByMarch2 === undefined || answers.priorYearWithholdingWaits) {
    return "partI";
  }
  return "all";
}

/*
 * Line 1 adds "any IRC Section 453A interest from line 63"; the engine's Form
 * 540 line 63 holds only FTB 3805P taxes (540/otherTaxes.ts), so that part is 0.
 */
function linesOf(form: Accessor, answers: Form5805FAnswers): Form5805FLines {
  const paidOn = answers.underpaymentPaidOn;
  return form5805FLines({
    taxAfterCredits: numberOrBlank(form["form-540.line.48_tax_after_credits"]) ?? 0,
    alternativeMinimumTax: numberOrBlank(form["form-540.line.61_alternative_minimum_tax"]) ?? 0,
    behavioralHealthTax:
      numberOrBlank(form["form-540.line.62_behavioral_health_services_tax"]) ?? 0,
    installmentSaleInterest: 0,
    lumpSumTax: numberOrBlank(form["form-540.line.34_tax_amount"]),
    withholding: sum(
      form["form-540.line.71_ca_income_tax_withheld"],
      form["form-540.line.73_withholding_592b_593"],
    ),
    separateReturn: answers.separateReturn,
    caAgi: numberOrBlank(form["form-540.line.17_ca_agi"]) ?? 0,
    priorYear: answers.priorYear === "no_twelve_month_return" ? undefined : answers.priorYear,
    paymentsByDueDate: answers.paymentsByDueDate ?? 0,
    filedAndPaidByMarch2: answers.filedAndPaidByMarch2 === true,
    underpaymentPaidOn: typeof paidOn === "number" ? paidOn : undefined,
    waiverAmount: answers.waiver?.amount,
  });
}

/* A Part I line, once the answers reach its stage. */
function fromLines<T>(needed: Stage, pick: (lines: Form5805FLines) => T | undefined) {
  return (form: Accessor, info: Form5805FFilingInfo): T | Unsupported | undefined => {
    const answers = info.form5805F;
    if (answers === undefined) return undefined;
    if (!answers.files540) return unsupported(NO_FORM_540);
    if (!reaches(stageOf(form, answers), needed)) return undefined;
    return pick(linesOf(form, answers));
  };
}

/* A Part II line: blank when no penalty is owed; the gap for a date that cannot be read. */
function fromPenalty<T>(pick: (penalty: PenaltyLines, answers: Form5805FAnswers) => T | undefined) {
  return (form: Accessor, info: Form5805FFilingInfo): T | Unsupported | undefined => {
    const answers = info.form5805F;
    const lines = fromLines("all", (all) => all)(form, info);
    if (lines !== undefined && "unsupported" in lines) return lines;
    if (answers === undefined || lines?.penalty === undefined) return undefined;
    const paidOn = answers.underpaymentPaidOn;
    if (typeof paidOn === "object") return paidOn;
    return pick(lines.penalty, answers);
  };
}

/* Line 16's checkbox, amount and explanation: only with a waiver request. */
const fromWaiver = <T>(pick: (line16: number, explanation: string) => T | undefined) =>
  fromPenalty((penalty, answers) =>
    answers.waiver === undefined || penalty.line16 === undefined
      ? undefined
      : pick(penalty.line16, answers.waiver.explanation),
  );

export function form5805FBindings(): Bindings {
  return {
    "0.header.name": (_, info) => namesOnReturn(info),
    "0.header.ssn_or_itin": (_, info) => info.taxpayerSSN,
    // Part I (ca-5805f-face-2025::sec::face-part-i::b01).
    "0.line.1_current_year_tax_after_credits": fromLines("current", (lines) => lines.line1),
    "0.line.2_current_year_lump_sum_tax": fromLines("current", (lines) => lines.line2),
    "0.line.3_current_year_tax_less_lump_sum": fromLines("current", (lines) => lines.line3),
    "0.line.4_two_thirds_of_current_year_tax": fromLines("current", (lines) => lines.line4),
    "0.line.5_current_year_withholding": fromLines("current", (lines) => lines.line5),
    "0.line.6_current_year_tax_less_withholding": fromLines("current", (lines) => lines.line6),
    "0.line.7_prior_year_tax_after_credits": fromLines("prior", (lines) => lines.line7),
    "0.line.8_prior_year_lump_sum_tax": fromLines("prior", (lines) => lines.line8),
    "0.line.9_prior_year_tax_less_lump_sum": fromLines("prior", (lines) => lines.line9),
    "0.line.10_required_annual_payment": fromLines("partI", (lines) => lines.line10),
    "0.line.11_withholding_and_estimated_payments": fromLines("partI", (lines) => lines.line11),
    "0.line.12_underpayment": fromLines("partI", (lines) => lines.line12),
    // Part II (ca-5805f-face-2025::sec::face-part-ii::b01).
    "0.line.13_date_underpayment_paid": fromPenalty((penalty) => dateText(penalty.line13)),
    "0.line.14_number_of_days": fromPenalty((penalty) => penalty.line14),
    "0.line.15_penalty": fromPenalty((penalty) => penalty.line15),
    // Line 16 (ca-5805f-inst-2025::sec::e-waiver-of-the-penalty::b01): unchecked with no request.
    "0.line.16_waiver_request_checkbox": fromPenalty((_, answers) => answers.waiver !== undefined),
    "0.line.16_waiver_amount": fromWaiver((line16) => line16),
    "0.line.16_waiver_explanation_row1": fromWaiver(
      (_, explanation) => explanationRows(explanation)[0] || undefined,
    ),
    "0.line.16_waiver_explanation_row2": fromWaiver((_, explanation) => {
      const second = explanationRows(explanation)[1];
      return second !== undefined && second.length > EXPLANATION_ROW_CHARACTERS
        ? unsupported(LONG_EXPLANATION)
        : second;
    }),
  };
}

export function register(): void {
  defineForm<Form5805F, Form5805FFilingInfo>("form-5805f", { bindings: form5805FBindings() });
}
