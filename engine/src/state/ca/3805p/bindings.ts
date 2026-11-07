/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import { roundDollars } from "../../../money.js";
import type { Form3805pFilingInfo } from "./filingInfo.js";
import type { Form3805p } from "./types.js";

/*
 * Part I line 4: "Multiply line 3 by 2½% (.025)"; a distribution "from a SIMPLE
 * IRA received within 2 years from the date you first participated in the plan"
 * takes 6% instead (ca-3805p-inst-2025::sec::line-2-early-distributions-not-subject-to-additional-tax::b06).
 * Box 7 code S means exactly that case (the 1099-R code table), so the code is
 * the participation-date fact.
 */
const CA_EARLY_DISTRIBUTION_TAX_RATE = 0.025;
const CA_SIMPLE_IRA_EARLY_TAX_RATE = 0.06;

/*
 * The header names the person who took the distribution: "Each spouse/RDP must
 * complete a separate form FTB 3805P for taxes attributable to his or her
 * distribution" (ca-3805p-inst-2025::sec::b-who-must-file::b03). The resolver
 * sets the owner when one person took every early distribution.
 */
function ownerField<T>(info: Form3805pFilingInfo, taxpayer: T, spouse: T): T | undefined {
  if (info.earlyDistributionOwner === undefined) return undefined;
  return info.earlyDistributionOwner === "spouse" ? spouse : taxpayer;
}

const NO_EXCEPTION_FACT =
  "No fact records an exception to the early distribution tax (ca-3805p-inst-2025::sec::line-2-early-distributions-not-subject-to-additional-tax::b01, exception numbers 01-25); line 3 reads this line as zero.";
const PART_II =
  "No fact records a Coverdell ESA, QTP or ABLE account distribution (ca-3805p-inst-2025::sec::part-ii-additional-tax-on-certain-distributions-from-education-accounts-and-able-accounts::b01, from Schedule CA line 8z or 8q).";
const PART_III =
  "No fact records an Archer MSA or Medicare Advantage MSA distribution, and federal Form 8853 is not modeled (ca-3805p-inst-2025::sec::part-iii-additional-tax-on-distributions-from-archer-and-medicare-advantage-medical-savings-accounts-msas::b01).";
const FILED_ALONE =
  "Signed only when FTB 3805P is filed separately from Form 540 (ca-3805p-inst-2025::sec::c-when-and-where-to-file::b01); the engine attaches it to Form 540, and no preparer facts exist.";

export function register(): void {
  defineForm<Form3805p, Form3805pFilingInfo>("form-3805p", {
    bindings: {
      "0.header.first_name": (_, info) =>
        ownerField(info, info.taxpayerFirstName, info.spouseFirstName),
      "0.header.middle_initial": (_, info) =>
        ownerField(info, info.taxpayerMiddleInitial, info.spouseMiddleInitial),
      "0.header.last_name": (_, info) =>
        ownerField(info, info.taxpayerLastName, info.spouseLastName),
      "0.header.ssn": (_, info) => ownerField(info, info.taxpayerSSN, info.spouseSSN),
      // The engine prepares an original form, never an amended one.
      "0.header.is_amended_form": () => false,
      "0.header.address": (_, info) => info.homeAddressLine1,
      "0.header.apartment": (_, info) => info.homeAddressApt,
      "0.header.city": (_, info) => info.homeAddressCity,
      "0.header.state": (_, info) => info.homeAddressState,
      "0.header.zip": (_, info) => info.homeAddressZip,

      /*
       * ca-3805p-inst-2025::sec::line-1-early-distributions-included-in-income::b01:
       * "the amount of early distributions included in income ... before you reached age 59½".
       */
      "0.part1.line_1_early_distributions_in_income": (_, info) =>
        info.earlyDistributionsInIncome === undefined || info.earlyDistributionsInIncome <= 0
          ? undefined
          : roundDollars(info.earlyDistributionsInIncome),
      /*
       * ca-3805p-inst-2025::sec::line-2-early-distributions-not-subject-to-additional-tax::b06:
       * "Line 3 – Subtract ... line 2 from ... line 1". Line 2 is unsupported, so it reads as zero.
       */
      "0.part1.line_3_amount_subject_to_additional_tax": (form) => {
        const line1 = form["0.part1.line_1_early_distributions_in_income"];
        if (line1 === undefined) return undefined;
        return line1 - (form["0.part1.line_2_distributions_not_subject_to_tax"] ?? 0);
      },
      "0.part1.line_4_early_distribution_tax_due": (form, info) => {
        const line3 = form["0.part1.line_3_amount_subject_to_additional_tax"];
        if (line3 === undefined) return undefined;
        const simple = Math.min(line3, info.simpleIraEarlyDistributions ?? 0);
        return roundDollars(
          simple * CA_SIMPLE_IRA_EARLY_TAX_RATE + (line3 - simple) * CA_EARLY_DISTRIBUTION_TAX_RATE,
        );
      },
    },

    unsupported: {
      "0.part1.line_2_exception_number": NO_EXCEPTION_FACT,
      "0.part1.line_2_distributions_not_subject_to_tax": NO_EXCEPTION_FACT,
      "0.part2.line_5_education_able_distributions_in_income": PART_II,
      "0.part2.line_6_distributions_not_subject_to_tax": PART_II,
      "0.part2.line_7_amount_subject_to_additional_tax": PART_II,
      "0.part2.line_8_education_able_tax_due": PART_II,
      "0.part3.line_9_taxable_archer_msa_distribution": PART_III,
      "0.part3.line_10a_archer_msa_tax_exception": PART_III,
      "0.part3.line_10b_archer_msa_tax_due": PART_III,
      "0.part3.line_11_medicare_advantage_msa_tax_due": PART_III,
      "0.signing.date_signed": FILED_ALONE,
      "0.signing.preparer_ptin": FILED_ALONE,
      "0.signing.preparer_firm_name_and_address": FILED_ALONE,
      "0.signing.preparer_firm_ein": FILED_ALONE,
    },
  });
}
