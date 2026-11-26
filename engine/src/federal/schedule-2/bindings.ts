/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { withLaterCopies } from "../4137/laterCopies.js";
import {
  boxOf,
  entryAmount,
  entryTypes,
  form4255ForSchedule2,
  schedule2Line,
} from "../4255/schedule2.js";
import { earlyDistributionTax } from "../5329/lines.js";
import { amtGap } from "../6251/foreignTaxCredit.js";
import { recaptureTaxForSchedule2 as lowIncomeHousingRecaptureTax } from "../8611/results.js";
import { form8621Amount } from "../8621/totals.js";
import { lookBackInterestForSchedule2 } from "../8697/results.js";
import { recaptureTaxForSchedule2 } from "../8828/results.js";
import { files8853, form8853Total } from "../8853/results.js";
import { withLaterForm8919Copies } from "../8919/laterCopies.js";
import { totalOver } from "../8936/credit.js";
import { FORM_8978_ADJUSTMENT_TYPE, line17zAdjustment } from "../8978/receivers.js";
import { line20From965A } from "../965-a/receivers.js";
import type { Schedule2FilingInfo } from "./filingInfo.js";
import type { Schedule2 } from "./types.js";

/* Blank, not 0, when every line is blank, as on the paper form. */
const total = (...values: unknown[]): number | undefined =>
  values.every((value) => value === undefined) ? undefined : sum(...values);

const NO_FORM_8853_LINE_17E = "Form 8853 (Archer MSA) not ingested; no Archer MSA scenario yet";
const NO_FORM_8853_LINE_17F = "Form 8853 (Medicare Advantage MSA) not ingested; no scenario yet";
const OTHER_PARTS_OF_5329 =
  "Form 5329 files by decision, but only its Part I (early distributions) is figured; Parts II–IX have no facts.";

const NO_PFIC = "No PFIC (Form 8621) ingestion or scenario yet.";
const NO_OTHER_RECAPTURE = "No credit-recapture scenario (Forms 8874/8882) yet";
const NO_SECTION_965 =
  "No section 965 / Form 965-A scenario yet; the deferred installment amount is informational and is not added into line 21.";
const NO_OTHER_TAXES = "No miscellaneous other-taxes (PWA penalties, etc.) scenario yet.";
const SECTION_1294_DEFERRED_TAX = "1294DT";
const NO_1294_DEFERRED_TAX = `Form 8621 line 23 is blank on every copy (no section 1294 election ends this year), so "${SECTION_1294_DEFERRED_TAX}" adds nothing here; the other taxes of line 17z (PWA penalties, etc.) are not modeled.`;

/*
 * A line that takes a Form 8621 amount. With no fund fact it keeps the reason
 * it had; a fund's gap is its gap; otherwise the amount, or blank with none.
 * Line 17z has other taxes the engine does not model: with no Form 8621
 * amount it stays unsupported (keepWithout names that reason).
 */
function form8621Line(
  info: Schedule2FilingInfo,
  amountOf: (amounts: NonNullable<Schedule2FilingInfo["form8621Totals"]>["amounts"]) => number,
  without: string,
  keepWithout?: string,
): number | Unsupported | undefined {
  const totals = info.form8621Totals;
  if (totals === undefined) return unsupported(without);
  if (totals.gap !== undefined) return unsupported(totals.gap);
  const amount = form8621Amount(totals, amountOf);
  if (amount === undefined) return keepWithout === undefined ? undefined : unsupported(keepWithout);
  return amount;
}

/*
 * MANUAL EDIT: line 17z lists each tax with its type: Form 8621 line 23 as
 * "1294DT" (irs-8621-inst-2025::sec::line-23::b01), and the part of a negative
 * Form 8978 line 14 that Schedule 3 line 6l could not take, as "Form 8978 ADJ"
 * (irs-1040-inst-2025::sec::line-17z::b01, ::line-19-2::b01;
 * federal/8978/receivers.ts), and Form 4255's penalties as "PWA7210",
 * "PWA8933" and "NPWA" (federal/4255/schedule2.ts). With none, the line keeps
 * the reason it had.
 */
function line17zEntries(
  form: { readonly [fieldId: string]: unknown },
  info: Schedule2FilingInfo,
): Array<[type: string, amount: number]> | Unsupported | undefined {
  const recapture = form4255ForSchedule2(info);
  if (recapture === undefined || (typeof recapture === "object" && "unsupported" in recapture))
    return recapture;
  const penalties = recapture === "none" ? [] : recapture.line17z;
  const fund = form8621Line(
    info,
    (amounts) => amounts.deferredTaxDue,
    NO_OTHER_TAXES,
    NO_1294_DEFERRED_TAX,
  );
  const fundEntries: Array<[string, number]> =
    typeof fund === "number" ? [[SECTION_1294_DEFERRED_TAX, fund]] : [];
  const fundGap = info.form8621Totals?.gap;
  const adjustment = line17zAdjustment(form, info, typeof fund === "number" ? fund : 0);
  if (adjustment === undefined) {
    if (typeof fund === "number" || (penalties.length > 0 && fundGap === undefined))
      return [...fundEntries, ...penalties];
    return fund;
  }
  if (typeof adjustment !== "number") return adjustment;
  if (fundGap !== undefined) return unsupported(fundGap);
  return [...fundEntries, ...penalties, [FORM_8978_ADJUSTMENT_TYPE, adjustment]];
}

/*
 * MANUAL EDIT: line 8 takes Form 5329 line 4 of each person, the combined tax
 * on a joint return (irs-5329-inst-2025::sec::specific-instructions::b01). With
 * no Form 5329 (code 1 alone), it is "the taxable amount of the distribution
 * by 10%", the same amount (irs-1040-inst-2025::sec::line-8::b01–b02). Blank
 * with no early distribution, and while a person's answers wait.
 */
function line8(info: Schedule2FilingInfo): number | Unsupported | undefined {
  const people = info.earlyDistributionPeople ?? [];
  const gap = people.find((person) => person.gap !== undefined)?.gap;
  if (gap !== undefined) return unsupported(gap);
  if (people.length === 0)
    return info.mustFile?.["form-5329"]?.value === true
      ? unsupported(OTHER_PARTS_OF_5329)
      : undefined;
  return earlyDistributionTax(people);
}

export function register(): void {
  defineForm<Schedule2, Schedule2FilingInfo>("schedule-2", {
    bindings: {
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: irs-1040-inst-2025::sec::line-1a-2::b01: Form 8962 line 29; blank when 8962 is not filed.
      "0.line.1a_excess_aptc_repayment": (form) =>
        total(form["form-8962.0.line.29_excess_advance_ptc_repayment"]),
      /*
       * MANUAL EDIT: Schedule A (Form 8936) line 4a of each vehicle whose credit
       * went to the dealer and that line 8a or 8d (1b), 13a or 13c (1c) rules out
       * (irs-1040-inst-2025::sec::line-1b-2::b01, line-1c-2::b01).
       */
      "0.line.1b_new_clean_vehicle_credit_repayment": (form, info) =>
        totalOver(form, info, (outcome) =>
          outcome.kind === "repay" && outcome.schedule2Line === "1b" ? outcome.amount : undefined,
        ),
      "0.line.1c_previously_owned_clean_vehicle_credit_repayment": (form, info) =>
        totalOver(form, info, (outcome) =>
          outcome.kind === "repay" && outcome.schedule2Line === "1c" ? outcome.amount : undefined,
        ),
      /*
       * MANUAL EDIT: lines 1d, 1e, 1f and 1y take Form 4255's column (q) amounts
       * (irs-1040-inst-2025::sec::line-1d-2::b01, ::line-1e-2::b01, ::line-1f-2::b01,
       * ::line-1y::b01; federal/4255/schedule2.ts). Blank without Form 4255.
       */
      "0.line.1d_recapture_net_epe_form4255": (_, info) =>
        schedule2Line(info, (amounts) => amounts.line1d),
      "0.line.1e_ep_checkbox_line1a": (_, info) => schedule2Line(info, boxOf("line1eBoxes", "1a")),
      "0.line.1e_ep_checkbox_line1c": (_, info) => schedule2Line(info, boxOf("line1eBoxes", "1c")),
      "0.line.1e_ep_checkbox_line1d": (_, info) => schedule2Line(info, boxOf("line1eBoxes", "1d")),
      "0.line.1e_ep_checkbox_line2a": (_, info) => schedule2Line(info, boxOf("line1eBoxes", "2a")),
      "0.line.1e_excessive_payments_epe_amount": (_, info) =>
        schedule2Line(info, (amounts) => amounts.line1e),
      "0.line.1f_20pct_ep_checkbox_line1a": (_, info) =>
        schedule2Line(info, boxOf("line1fBoxes", "1a")),
      "0.line.1f_20pct_ep_checkbox_line1c": (_, info) =>
        schedule2Line(info, boxOf("line1fBoxes", "1c")),
      "0.line.1f_20pct_ep_checkbox_line1d": (_, info) =>
        schedule2Line(info, boxOf("line1fBoxes", "1d")),
      "0.line.1f_20pct_ep_checkbox_line2a": (_, info) =>
        schedule2Line(info, boxOf("line1fBoxes", "2a")),
      "0.line.1f_20pct_ep_amount": (_, info) => schedule2Line(info, (amounts) => amounts.line1f),
      "0.line.1y_other_additions_description": (_, info) =>
        entryTypes(
          info,
          (amounts) => amounts.line1y,
          () => undefined,
        ),
      "0.line.1y_other_additions_amount": (_, info) =>
        entryAmount(
          info,
          (amounts) => amounts.line1y,
          () => undefined,
        ),
      "0.line.1z_total_lines_1a_through_1y": (form) =>
        total(
          form["0.line.1a_excess_aptc_repayment"],
          form["0.line.1b_new_clean_vehicle_credit_repayment"],
          form["0.line.1c_previously_owned_clean_vehicle_credit_repayment"],
          form["0.line.1d_recapture_net_epe_form4255"],
          form["0.line.1e_excessive_payments_epe_amount"],
          form["0.line.1f_20pct_ep_amount"],
          form["0.line.1y_other_additions_amount"],
        ),
      /*
       * MANUAL EDIT: irs-1040-inst-2025::sec::line-2::b01: Form 6251 line 11, its -0- too.
       * A gap on line 11 is a gap here and on line 3, not a blank (amtGap).
       */
      "0.line.2_alternative_minimum_tax": (form, info) =>
        amtGap(form, info) ?? total(form["form-6251.0.line.11_amt"]),
      "0.line.3_total_lines_1z_and_2": (form, info) =>
        amtGap(form, info) ??
        total(
          form["0.line.1z_total_lines_1a_through_1y"],
          form["0.line.2_alternative_minimum_tax"],
        ),
      // MANUAL EDIT: irs-1040-inst-2025::sec::line-4-3::b01: Schedule SE line 12.
      "0.line.4_self_employment_tax": (form) => total(form["schedule-se.0.line.12"]),
      /*
       * MANUAL EDIT: irs-1040-inst-2025::sec::line-5-2::b01: "the total of any taxes
       * from Form 4137", line 13 of each spouse's form. Blank when no Form 4137 files.
       */
      "0.line.5_ss_medicare_tax_unreported_tips": (form, info) =>
        withLaterCopies(
          form["form-4137.0.line.13_total_tax_unreported_tips"],
          info,
          (lines) => lines.line13,
        ),
      /*
       * MANUAL EDIT: irs-1040-inst-2025::sec::line-6::b01: "Include on line 6 the
       * amount from line 13 of Form 8919", each spouse's form. Blank when none files.
       */
      "0.line.6_uncollected_ss_medicare_tax_wages": (form, info) =>
        withLaterForm8919Copies(
          form["form-8919.0.line.13_total_uncollected_tax"],
          info,
          (lines) => lines.line13,
        ),
      "0.line.7_total_additional_ss_medicare_tax": (form) =>
        total(
          form["0.line.5_ss_medicare_tax_unreported_tips"],
          form["0.line.6_uncollected_ss_medicare_tax_wages"],
        ),
      // Schedule H Part II (FUTA) is not modeled, so a line 9 Yes leaves this blank.
      "0.line.9_household_employment_taxes": (form) =>
        form["schedule-h.0.line.9_no"] === true ? total(form["schedule-h.0.line.8"]) : undefined,
      "0.line.11_additional_medicare_tax": (form) =>
        total(form["form-8959.0.line.18_total_additional_medicare_tax"]),
      "0.line.12_net_investment_income_tax": (form) => total(form["form-8960.0.line.17"]),
      "0.line.8_additional_tax_iras_tax_favored_accounts": (_, info) => line8(info),
      // irs-1040-inst-2025::sec::line-8::b02: "check the box on line 8 to indicate that you don't have to file Form 5329".
      "0.line.8_ira_tax_favored_accounts_not_required": (_, info) =>
        info.earlyDistributionTaxWithoutForm === true ? true : undefined,
      // MANUAL EDIT: line 16 is Form 8611 line 14, every copy (irs-1040-inst-2025::sec::line-16-3::b01).
      "0.line.16_recapture_low_income_housing_credit": (_, info) =>
        lowIncomeHousingRecaptureTax(info),
      /*
       * MANUAL EDIT: line 17a lists Form 4255's column (r) recaptures
       * (irs-1040-inst-2025::sec::line-17a::b01, ::identify-as-eccfr::b01). With
       * none, Forms 8874 and 8882 are still not modeled. Line 19 is line 1d column (l).
       */
      "1.line.17a_recapture_other_credits_description": (_, info) =>
        entryTypes(
          info,
          (amounts) => amounts.line17a,
          () => unsupported(NO_OTHER_RECAPTURE),
        ),
      "1.line.17a_recapture_other_credits_amount": (_, info) =>
        entryAmount(
          info,
          (amounts) => amounts.line17a,
          () => unsupported(NO_OTHER_RECAPTURE),
        ),
      "1.line.19_recapture_net_epe_form4255_line1d": (_, info) =>
        schedule2Line(info, (amounts) => amounts.line19),
      // MANUAL EDIT: line 17b is Form 8828 line 23 (irs-1040-inst-2025::sec::line-17b::b01).
      "1.line.17b_recapture_federal_mortgage_subsidy": (form, info) =>
        recaptureTaxForSchedule2(form, info),
      "1.line.17c_additional_tax_hsa_distributions": (form) =>
        total(form["form-8889.0.line.17b_additional_20pct_tax"]),
      "1.line.17d_additional_tax_hsa_ineligible_individual": (form) =>
        total(form["form-8889.0.line.21_additional_tax_10pct"]),
      /*
       * MANUAL EDIT: lines 17e and 17f = Form 8853 lines 9b and 13b (irs-1040-inst-2025::sec::line-17e::b01,
       * ::line-17f::b01). Without Form 8853 each keeps the reason it had before the form had rules.
       */
      "1.line.17e_additional_tax_archer_msa_distributions": (_, info) =>
        files8853(info)
          ? form8853Total(info, ["0.line.9b_additional_20_tax"])
          : unsupported(NO_FORM_8853_LINE_17E),
      "1.line.17f_additional_tax_medicare_advantage_msa_distributions": (_, info) =>
        files8853(info)
          ? form8853Total(info, ["0.line.13b_additional_50_tax"])
          : unsupported(NO_FORM_8853_LINE_17F),
      /*
       * MANUAL EDIT: line 17p is Form 8621 line 16f of every fund, line 17q its
       * line 24 (irs-8621-inst-2025::sec::line-16f::b02, ::line-24::b01;
       * irs-1040-inst-2025::sec::line-17p::b01). Line 17z takes its line 23 as
       * "1294DT" (irs-8621-inst-2025::sec::line-23::b01).
       */
      /*
       * MANUAL EDIT: line 17l is Form 4970 line 28 ("Include the amount from this
       * line on Schedule 2 (Form 1040), line 17l", irs-4970-form-2025::sec::line-28::b01;
       * irs-1040-inst-2025::sec::line-17l::b01). Blank with no Form 4970.
       */
      "1.line.17l_tax_accumulation_distribution_trusts": (_, info) =>
        info.form4970TaxGap !== undefined ? unsupported(info.form4970TaxGap) : info.form4970Tax,
      /*
       * MANUAL EDIT: line 17n is Form 8697 Part I line 10 or Part II line 11
       * (irs-8697-inst-2025::sec::filing-instructions::b01; irs-1040-inst-2025::sec::line-17n::b01).
       * Without Form 8697 it stays unsupported: Form 8866 is not modeled.
       */
      "1.line.17n_lookback_interest_section_167g_460b": (_, info) =>
        lookBackInterestForSchedule2(info),
      "1.line.17p_interest_form8621_line16f_section_1291_fund": (_, info) =>
        form8621Line(info, (amounts) => amounts.section1291Interest, NO_PFIC),
      "1.line.17q_interest_form8621_line24": (_, info) =>
        form8621Line(info, (amounts) => amounts.deferredTaxInterest, NO_PFIC),
      // MANUAL EDIT: line 17z also lists "Form 8978 ADJ" (line17zEntries below).
      "1.line.17z_other_taxes_amount": (form, info) => {
        const entries = line17zEntries(form, info);
        return Array.isArray(entries) ? sum(...entries.map(([, amount]) => amount)) : entries;
      },
      "1.line.17z_other_taxes_description": (form, info) => {
        const entries = line17zEntries(form, info);
        return Array.isArray(entries) ? entries.map(([type]) => type).join("; ") : entries;
      },
      "1.line.18_total_additional_taxes": (form) =>
        total(
          form["1.line.17a_recapture_other_credits_amount"],
          form["1.line.17b_recapture_federal_mortgage_subsidy"],
          form["1.line.17c_additional_tax_hsa_distributions"],
          form["1.line.17d_additional_tax_hsa_ineligible_individual"],
          form["1.line.17e_additional_tax_archer_msa_distributions"],
          form["1.line.17f_additional_tax_medicare_advantage_msa_distributions"],
          form["1.line.17g_recapture_charitable_contribution_fractional_interest"],
          form["1.line.17h_income_nonqualified_deferred_compensation_409a"],
          form["1.line.17i_compensation_nonqualified_deferred_compensation_457a"],
          form["1.line.17j_section_72m5_excess_benefits_tax"],
          form["1.line.17k_golden_parachute_payments"],
          form["1.line.17l_tax_accumulation_distribution_trusts"],
          form["1.line.17m_excise_tax_insider_stock_compensation_expatriated_corp"],
          form["1.line.17n_lookback_interest_section_167g_460b"],
          form["1.line.17o_tax_non_effectively_connected_income_nonresident_alien"],
          form["1.line.17p_interest_form8621_line16f_section_1291_fund"],
          form["1.line.17q_interest_form8621_line24"],
          form["1.line.17z_other_taxes_amount"],
        ),
      /*
       * Blank when Schedule H line 9 is Yes: without the FUTA tax the total
       * would understate the tax. Line 10 has no field in the inventory.
       */
      /*
       * MANUAL EDIT: line 20 = Form 965-A Part II Totals, column (k), the installments paid
       * for 2025 (federal/965-a/receivers.ts). Not part of line 21. No Form 965-A: the old reason.
       */
      "1.line.20_section_965_net_tax_liability_installment": (_, info) => {
        const received = line20From965A(info);
        return received === "none" ? unsupported(NO_SECTION_965) : received;
      },
      "1.line.21_total_other_taxes": (form) =>
        form["schedule-h.0.line.9_yes"] === true
          ? undefined
          : total(
              form["0.line.4_self_employment_tax"],
              form["0.line.7_total_additional_ss_medicare_tax"],
              form["0.line.8_additional_tax_iras_tax_favored_accounts"],
              form["0.line.9_household_employment_taxes"],
              form["0.line.11_additional_medicare_tax"],
              form["0.line.12_net_investment_income_tax"],
              form["0.line.13_uncollected_ss_medicare_rrta_tax_w2"],
              form["0.line.14_interest_tax_installment_residential_lots"],
              form["0.line.15_interest_deferred_tax_installment_sales"],
              form["0.line.16_recapture_low_income_housing_credit"],
              form["1.line.18_total_additional_taxes"],
              form["1.line.19_recapture_net_epe_form4255_line1d"],
            ),
    },

    unsupported: {
      "0.header.taxpayer_name":
        "Full name needs first + last name joined together. No single full-name fact exists and lookupFact can't concatenate, and form-1040 has no combined-name field to reference.",
      "0.line.4_se_tax_exemption_4361":
        "No self-employment / Form 4361 clergy-exemption scenario modeled yet.",
      "0.line.4_se_tax_exemption_4029":
        "No self-employment / Form 4029 religious-group exemption scenario modeled yet.",
      "0.line.4_se_tax_exemption_other":
        "No self-employment exemption scenario (EAS/EN notary) modeled yet.",
      "0.line.4_se_tax_exemption_other_form_number":
        "No self-employment exemption scenario (EAS/EN notary) modeled yet.",
      "0.line.13_uncollected_ss_medicare_rrta_tax_w2":
        "W-2 box 12 codes A/B/M/N are not exposed as summable fields; no uncollected-tip-tax scenario yet",
      "0.line.14_interest_tax_installment_residential_lots":
        "No installment-sale (section 453(l)(3)) scenario yet",
      "0.line.15_interest_deferred_tax_installment_sales":
        "No section 453A(c) installment-sale scenario yet",
      "1.line.17g_recapture_charitable_contribution_fractional_interest":
        "No fractional-interest charitable contribution recapture scenario yet",
      "1.line.17h_income_nonqualified_deferred_compensation_409a":
        "No section 409A NQDC scenario yet (W-2 box 12 code Z / 1099-MISC box 15 tax plus interest computation not modeled)",
      "1.line.17i_compensation_nonqualified_deferred_compensation_457a":
        "No section 457A NQDC scenario yet",
      "1.line.17j_section_72m5_excess_benefits_tax":
        "No section 72(m)(5) excess benefits (owner-employee plan) scenario yet",
      "1.line.17k_golden_parachute_payments":
        "No golden parachute scenario yet (W-2 box 12 code K / 1099-NEC box 3 excise not modeled)",
      "1.line.17m_excise_tax_insider_stock_compensation_expatriated_corp":
        "No section 4985 expatriated-corporation insider stock compensation scenario yet.",
      "1.line.17o_tax_non_effectively_connected_income_nonresident_alien":
        "No dual-status / nonresident alien (Form 1040-NR) scenario yet.",
    },
  });
}
