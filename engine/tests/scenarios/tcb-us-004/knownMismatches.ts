/*
 * The ratchet: a listed line is reported, not failed. A listed line that starts
 * to match FAILS, so the list only shrinks. Three causes (README.md):
 *   4952  — Form 4952 is not modeled, so Schedule A line 9 is blank and every
 *           total after it is $650 high.
 *   ctc   — dependents are not modeled, so the $2,200 child tax credit is missing.
 *   8960  — Form 8960 line 9b (state tax allocable to investment income) is not modeled.
 */

const FORM_4952 = "4952: Schedule A line 9 (investment interest) is blank.";
const CTC = "ctc: dependents and the child tax credit are not modeled.";
const FORM_8960 = "8960: line 9b (state tax allocable to investment income) is not modeled.";

export const tcbUs004KnownMismatches: Record<string, string> = {
  "schedule-a.0.line.9_investment_interest": FORM_4952,
  "schedule-a.0.line.10_total_interest": FORM_4952,
  "schedule-a.0.line.17_total_itemized_deductions": FORM_4952,
  "form-1040.line.12e": FORM_4952,
  "form-1040.line.14": FORM_4952,
  "form-1040.line.15": FORM_4952,
  "form-1040.line.16": FORM_4952,
  "form-1040.line.18": FORM_4952,
  "form-1040.line.19": CTC,
  "form-1040.line.21": CTC,
  "form-1040.line.22": `${FORM_4952} ${CTC}`,
  "form-1040.line.24": `${FORM_4952} ${CTC}`,
  "form-1040.line.37": `${FORM_4952} ${CTC}`,
  "form-8960.0.line.9a": FORM_4952,
  "form-8960.0.line.9b": FORM_8960,
  "form-8960.0.line.9d": `${FORM_4952} ${FORM_8960}`,
  "form-8960.0.line.11": `${FORM_4952} ${FORM_8960}`,
  "form-8960.0.line.12": `${FORM_4952} ${FORM_8960}`,
  "form-8995-a.1.line.33": FORM_4952,
  "form-8995-a.1.line.35": FORM_4952,
  "form-8995-a.1.line.36": FORM_4952,
};
