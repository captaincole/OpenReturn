/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

/*
 * MANUAL EDIT: every line is figured in lines.ts, partIII.ts and form.ts from the
 * lump-sum fact and its Forms 1099-R (copies.ts). The printed form is the one
 * copy the return files (resolveInfo.ts).
 */

import { defineForm } from "../../defineForm.js";
import type { LumpSumDistributionFactValue } from "../../facts/index.js";
import { roundToPlaces } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import type { Form4972Copy, Form4972FilingInfo } from "./filingInfo.js";
import type { Form4972Lines } from "./form.js";
import { DECIMAL_PLACES } from "./lines.js";
import type { Form4972 } from "./types.js";

type Binding<V> = (form: unknown, info: Form4972FilingInfo) => V | Unsupported | undefined;

const ALTERNATE_PAYEE =
  "An alternate payee under a qualified domestic relations order can use Form 4972 (irs-4972-form-2025::sec::what-is-a-qualified-lump-sum::b01), but Part I asks only about a participant or a beneficiary, so the engine does not answer lines 3 to 5b.";

/* A money or worksheet line: blank while the copy waits, unsupported with a gap. */
function lineOf<V>(pick: (lines: Form4972Lines) => V | undefined): Binding<V> {
  return (_, info) => {
    if (info.form4972Gap) return unsupported(info.form4972Gap);
    const result = info.form4972?.result;
    if (result?.kind === "gap") return unsupported(result.reason);
    return result?.kind === "figured" ? pick(result.lines) : undefined;
  };
}

/* A Part I box from the answers: true checks it, undefined leaves it blank. */
function answerBox(
  pick: (answers: LumpSumDistributionFactValue) => boolean | undefined,
): Binding<boolean> {
  return (_, info) => {
    if (info.form4972Gap) return unsupported(info.form4972Gap);
    const copy: Form4972Copy | undefined = info.form4972;
    return copy && pick(copy.answers) ? true : undefined;
  };
}

/* Lines 3 to 5b: unsupported for an alternate payee. */
function roleBox(
  pick: (answers: LumpSumDistributionFactValue) => boolean | undefined,
): Binding<boolean> {
  return (form, info) =>
    info.form4972?.answers.receivedAs === "alternate_payee" && !info.form4972Gap
      ? unsupported(ALTERNATE_PAYEE)
      : answerBox(pick)(form, info);
}

/* A decimal printed in two fields around the form's point: "0" (or "1") and four digits. */
const SCALE = 10 ** DECIMAL_PLACES;
const scaled = (ratio: number) => roundToPlaces(ratio * SCALE, 0);
const wholeText = (ratio: number | undefined) =>
  ratio === undefined ? undefined : scaled(ratio) >= SCALE ? "1" : "0";
const fractionText = (ratio: number | undefined) =>
  ratio === undefined ? undefined : String(scaled(ratio) % SCALE).padStart(DECIMAL_PLACES, "0");

const isBeneficiary = (answers: LumpSumDistributionFactValue) =>
  answers.receivedAs === "beneficiary";
const isParticipant = (answers: LumpSumDistributionFactValue) =>
  answers.receivedAs === "participant";

/*
 * irs-4972-form-2025::sec::specific-instructions::b01: "fill in the name and
 * identifying number of the recipient of the distribution".
 */
const recipientName: Binding<string> = (_, info) => {
  const spouse = info.form4972?.recipient === "spouse";
  const first = spouse ? info.spouseFirstName : info.taxpayerFirstName;
  const last = spouse ? info.spouseLastName : info.taxpayerLastName;
  return info.form4972 && first && last ? `${first} ${last}` : undefined;
};

const headerBindings = {
  "0.header.recipient_name": recipientName,
  "0.header.identifying_number": ((_, info) =>
    info.form4972?.recipient === "spouse" ? info.spouseSSN : info.taxpayerSSN) as Binding<string>,
};

/* Part I (the blank form, lines 1 to 5b): a copy that files answered each line so the form applies. */
const partIBindings = {
  "0.line.1_entire_balance_distribution_yes": answerBox((answers) => answers.entireBalance),
  "0.line.1_entire_balance_distribution_no": answerBox((answers) => !answers.entireBalance),
  "0.line.2_rolled_over_distribution_yes": answerBox((answers) => answers.rolledOverAnyPart),
  "0.line.2_rolled_over_distribution_no": answerBox((answers) => !answers.rolledOverAnyPart),
  "0.line.3_beneficiary_born_before_1936_yes": roleBox(
    (answers) => isBeneficiary(answers) && answers.participantBornBefore1936,
  ),
  "0.line.3_beneficiary_born_before_1936_no": roleBox(
    (answers) => !isBeneficiary(answers) || !answers.participantBornBefore1936,
  ),
  "0.line.4_participant_five_years_yes": roleBox(
    (answers) =>
      isParticipant(answers) && answers.participantBornBefore1936 && answers.participantFiveYears,
  ),
  "0.line.4_participant_five_years_no": roleBox(
    (answers) =>
      !isParticipant(answers) ||
      !answers.participantBornBefore1936 ||
      answers.participantFiveYears === false,
  ),
  "0.line.5a_prior_use_own_plan_yes": roleBox((answers) => answers.priorElectionOwnPlan),
  "0.line.5a_prior_use_own_plan_no": roleBox((answers) => !answers.priorElectionOwnPlan),
  // Line 5b asks only "If you are receiving this distribution as a beneficiary".
  "0.line.5b_prior_use_as_beneficiary_yes": roleBox(
    (answers) => isBeneficiary(answers) && answers.priorElectionAsBeneficiary === true,
  ),
  "0.line.5b_prior_use_as_beneficiary_no": roleBox(
    (answers) => isBeneficiary(answers) && answers.priorElectionAsBeneficiary === false,
  ),
};

/* Part II and Part III (lines.ts, partIII.ts). */
const lineBindings = {
  "0.line.6_capital_gain_part": lineOf((lines) => lines.partII?.line6),
  "0.line.7_capital_gain_tax": lineOf((lines) => lines.partII?.line7),
  "0.line.8_ordinary_income_part": lineOf((lines) => lines.partIII?.line8),
  "0.line.9_death_benefit_exclusion": lineOf((lines) => lines.partIII?.line9),
  "0.line.10_total_taxable_amount": lineOf((lines) => lines.partIII?.line10),
  "0.line.11_annuity_actuarial_value": lineOf((lines) => lines.partIII?.line11),
  "0.line.12_adjusted_total_taxable_amount": lineOf((lines) => lines.partIII?.line12),
  "0.line.13_half_of_line_12": lineOf((lines) => lines.partIII?.allowance?.line13),
  "0.line.14_line_12_over_20000": lineOf((lines) => lines.partIII?.allowance?.line14),
  "0.line.15_line_14_times_20_percent": lineOf((lines) => lines.partIII?.allowance?.line15),
  "0.line.16_minimum_distribution_allowance": lineOf((lines) => lines.partIII?.allowance?.line16),
  "0.line.17_line_12_less_allowance": lineOf((lines) => lines.partIII?.line17),
  "0.line.18_federal_estate_tax": lineOf((lines) => lines.partIII?.line18),
  "0.line.19_line_17_less_estate_tax": lineOf((lines) => lines.partIII?.line19),
  "0.line.20_annuity_decimal_whole": lineOf((lines) => wholeText(lines.partIII?.annuity?.line20)),
  "0.line.20_annuity_decimal_fraction": lineOf((lines) =>
    fractionText(lines.partIII?.annuity?.line20),
  ),
  "0.line.21_allowance_times_decimal": lineOf((lines) => lines.partIII?.annuity?.line21),
  "0.line.22_annuity_less_line_21": lineOf((lines) => lines.partIII?.annuity?.line22),
  "0.line.23_line_19_times_10_percent": lineOf((lines) => lines.partIII?.line23),
  "0.line.24_tax_on_line_23": lineOf((lines) => lines.partIII?.line24),
  "0.line.25_line_24_times_10": lineOf((lines) => lines.partIII?.line25),
  "0.line.26_line_22_times_10_percent": lineOf((lines) => lines.partIII?.annuityTax?.line26),
  "0.line.27_tax_on_line_26": lineOf((lines) => lines.partIII?.annuityTax?.line27),
  "0.line.28_line_27_times_10": lineOf((lines) => lines.partIII?.annuityTax?.line28),
  "0.line.29_line_25_less_line_28": lineOf((lines) => lines.partIII?.line29),
  "0.line.30_tax_on_lump_sum_distribution": lineOf((lines) => lines.line30),
};

/* The worksheets on page 3 (irs-4972-form-2025::sec::specific-instructions::b04, b05). */
const worksheetBindings = {
  "2.multiple_recipients_worksheet.a_line_25_minus_line_28": lineOf(
    (lines) => lines.partIII?.multipleRecipients?.lineA,
  ),
  "2.multiple_recipients_worksheet.b_percentage_of_distribution": lineOf((lines) => {
    const share = lines.partIII?.multipleRecipients?.lineB;
    return share === undefined ? undefined : `${roundToPlaces(share * 100, 2)}%`;
  }),
  "2.multiple_recipients_worksheet.c_share_of_tax": lineOf(
    (lines) => lines.partIII?.multipleRecipients?.lineC,
  ),
  "2.nua_worksheet.a_capital_gain_box_3": lineOf((lines) => lines.nua?.lineA),
  "2.nua_worksheet.b_taxable_amount_box_2a": lineOf((lines) => lines.nua?.lineB),
  "2.nua_worksheet.c_capital_gain_ratio_whole": lineOf((lines) => wholeText(lines.nua?.lineC)),
  "2.nua_worksheet.c_capital_gain_ratio_decimal": lineOf((lines) => fractionText(lines.nua?.lineC)),
  "2.nua_worksheet.d_nua_box_6": lineOf((lines) => lines.nua?.lineD),
  "2.nua_worksheet.e_capital_gain_portion_nua": lineOf((lines) => lines.nua?.lineE),
  "2.nua_worksheet.f_ordinary_income_portion_nua": lineOf((lines) => lines.nua?.lineF),
  "2.nua_worksheet.g_total_capital_gain_portion": lineOf((lines) => lines.nua?.lineG),
  "2.death_benefit_worksheet.a_capital_gain_amount": lineOf((lines) => lines.deathBenefit?.lineA),
  "2.death_benefit_worksheet.b_taxable_amount_plus_nua": lineOf(
    (lines) => lines.deathBenefit?.lineB,
  ),
  "2.death_benefit_worksheet.c_capital_gain_ratio_whole": lineOf((lines) =>
    wholeText(lines.deathBenefit?.lineC),
  ),
  "2.death_benefit_worksheet.c_capital_gain_ratio_decimal": lineOf((lines) =>
    fractionText(lines.deathBenefit?.lineC),
  ),
  "2.death_benefit_worksheet.d_share_of_exclusion": lineOf((lines) => lines.deathBenefit?.lineD),
  "2.death_benefit_worksheet.e_exclusion_allocated_capital_gain": lineOf(
    (lines) => lines.deathBenefit?.lineE,
  ),
  "2.death_benefit_worksheet.f_capital_gain_after_exclusion": lineOf(
    (lines) => lines.deathBenefit?.lineF,
  ),
};

export function register(): void {
  defineForm<Form4972, Form4972FilingInfo>("form-4972", {
    bindings: { ...headerBindings, ...partIBindings, ...lineBindings, ...worksheetBindings },
    // The identifying number widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
