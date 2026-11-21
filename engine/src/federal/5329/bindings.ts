/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import type { EarlyDistributionPerson, Form5329FilingInfo } from "./filingInfo.js";
import {
  line1,
  line2,
  line2ExceptionNumber,
  line3,
  line4,
  type EarlyDistributionRow,
} from "./lines.js";
import type { Form5329 } from "./types.js";

/* The person this copy is for. */
function filerOf(info: Form5329FilingInfo): EarlyDistributionPerson | undefined {
  return info.form5329Filers?.[info.form5329CopyIndex ?? 0];
}

/* A Part I line from the person's rows: unsupported for a case the engine does not figure, blank while an answer waits. */
function partILine<T>(line: (rows: readonly EarlyDistributionRow[]) => T) {
  return (_: unknown, info: Form5329FilingInfo): T | Unsupported | undefined => {
    const person = filerOf(info);
    if (!person) return undefined;
    if (person.gap !== undefined) return unsupported(person.gap);
    return person.pending ? undefined : line(person.rows);
  };
}

const FILED_ALONE =
  "Filled only when Form 5329 is filed by itself, without a return (irs-5329-inst-2025::sec::when-and-where-to-file::b01); the engine files it with Form 1040.";
const PREPARER =
  "No paid-preparer facts; this block is signed only when Form 5329 is filed by itself (irs-5329-inst-2025::sec::when-and-where-to-file::b01).";
const PART_II =
  "No fact records a taxable distribution from a Coverdell ESA, a QTP or an ABLE account (Schedule 1 line 8z or 8q), so Part II is not figured (irs-5329-inst-2025::sec::part-ii-additional-tax-on-certain).";
const PART_III =
  "No fact records an excess traditional IRA contribution for 2025 or line 17 of the 2024 Form 5329 (irs-5329-inst-2025::sec::part-iii-additional-tax-on-excess::b01).";
const PART_IV =
  "No fact records an excess Roth IRA contribution for 2025 or line 25 of the 2024 Form 5329 (irs-5329-inst-2025::sec::part-iv-additional-tax-on-excess::b01).";
const PART_V =
  "No fact records Coverdell ESA contributions or line 33 of the 2024 Form 5329 (irs-5329-inst-2025::sec::part-v-additional-tax-on-excess::b01).";
const PART_VI =
  "No fact records Archer MSA contributions or line 41 of the 2024 Form 5329 (irs-5329-inst-2025::sec::part-vi-additional-tax-on-excess::b01).";
const PART_VII =
  "The engine does not figure excess HSA contributions, and no fact records line 49 of the 2024 Form 5329 (irs-5329-inst-2025::sec::part-vii-additional-tax-on-excess::b01).";
const PART_VIII =
  "No fact records ABLE account contributions (irs-5329-inst-2025::sec::part-viii-additional-tax-on-excess::b01).";
const PART_IX =
  "No fact records a minimum required distribution or the amount distributed toward it (irs-5329-inst-2025::sec::part-ix-additional-tax-on-excess::b01).";

const unsupportedLines = (
  reason: string,
  fieldIds: Array<keyof Form5329>,
): Partial<Record<keyof Form5329, string>> =>
  Object.fromEntries(fieldIds.map((fieldId) => [fieldId, reason]));

export function register(): void {
  defineForm<Form5329, Form5329FilingInfo>("form-5329", {
    bindings: {
      // A joint return names only the spouse this copy reports (::specific-instructions::b01).
      "0.header.taxpayer_name": (_, info) => {
        const owner = filerOf(info)?.owner;
        const first = owner === "spouse" ? info.spouseFirstName : info.taxpayerFirstName;
        const last = owner === "spouse" ? info.spouseLastName : info.taxpayerLastName;
        return owner && first && last ? `${first} ${last}` : undefined;
      },
      "0.header.ssn": (_, info) => {
        const owner = filerOf(info)?.owner;
        if (!owner) return undefined;
        return owner === "spouse" ? info.spouseSSN : info.taxpayerSSN;
      },
      // The engine prepares an original return, never an amended one.
      "0.header.amended_return": () => false,

      /*
       * MANUAL EDIT: irs-5329-inst-2025::sec::line-1::b01: "the amount of early
       * distributions includible in income"; partI.ts says which 1099-Rs count.
       */
      "0.line.1_early_distributions_in_income": partILine(line1),
      // irs-5329-inst-2025::sec::line-2::b01: the amount excluded and its number (01–23, or 99).
      "0.line.2_exception_number": partILine(line2ExceptionNumber),
      "0.line.2_early_distributions_not_subject": partILine(line2),
      "0.line.3_amount_subject_to_tax": partILine(line3),
      // irs-5329-inst-2025::sec::line-4::b01: 10%, and 25% for a code S row.
      "0.line.4_additional_tax_early_distributions": partILine(line4),
    },

    formatters: {
      // The SSN renders with dashes; this form has no comb widget.
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },

    unsupported: {
      ...unsupportedLines(FILED_ALONE, [
        "0.header.home_address",
        "0.header.apt_no",
        "0.header.city_state_zip",
        "0.header.foreign_country_name",
        "0.header.foreign_province_state_county",
        "0.header.foreign_postal_code",
      ]),
      ...unsupportedLines(PART_II, [
        "0.line.5_education_able_distributions",
        "0.line.6_education_able_not_subject",
        "0.line.7_education_able_amount_subject",
        "0.line.8_additional_tax_education_able",
      ]),
      ...unsupportedLines(PART_III, [
        "0.line.9_traditional_ira_prior_excess",
        "0.line.10_traditional_ira_contribution_shortfall",
        "0.line.11_traditional_ira_distributions_in_income",
        "0.line.12_traditional_ira_prior_excess_distributions",
        "0.line.13_traditional_ira_add_lines_10_12",
        "0.line.14_traditional_ira_prior_year_excess",
        "0.line.15_traditional_ira_excess_2025",
        "0.line.16_traditional_ira_total_excess",
        "0.line.17_additional_tax_traditional_ira",
      ]),
      ...unsupportedLines(PART_IV, [
        "0.line.18_roth_ira_prior_excess",
        "0.line.19_roth_ira_contribution_shortfall",
        "0.line.20_roth_ira_distributions",
        "0.line.21_roth_ira_add_lines_19_20",
        "0.line.22_roth_ira_prior_year_excess",
        "0.line.23_roth_ira_excess_2025",
        "0.line.24_roth_ira_total_excess",
        "0.line.25_additional_tax_roth_ira",
      ]),
      ...unsupportedLines(PART_V, [
        "1.line.26_coverdell_prior_excess_contributions",
        "1.line.27_coverdell_contributions_under_maximum",
        "1.line.28_coverdell_distributions",
        "1.line.29_coverdell_add_lines_27_28",
        "1.line.30_coverdell_prior_year_excess",
        "1.line.31_coverdell_excess_contributions_2025",
        "1.line.32_coverdell_total_excess_contributions",
        "1.line.33_coverdell_additional_tax",
      ]),
      ...unsupportedLines(PART_VI, [
        "1.line.34_archer_msa_prior_excess_contributions",
        "1.line.35_archer_msa_contributions_under_maximum",
        "1.line.36_archer_msa_distributions",
        "1.line.37_archer_msa_add_lines_35_36",
        "1.line.38_archer_msa_prior_year_excess",
        "1.line.39_archer_msa_excess_contributions_2025",
        "1.line.40_archer_msa_total_excess_contributions",
        "1.line.41_archer_msa_additional_tax",
      ]),
      ...unsupportedLines(PART_VII, [
        "1.line.42_hsa_prior_excess_contributions",
        "1.line.43_hsa_contributions_under_maximum",
        "1.line.44_hsa_distributions",
        "1.line.45_hsa_add_lines_43_44",
        "1.line.46_hsa_prior_year_excess",
        "1.line.47_hsa_excess_contributions_2025",
        "1.line.48_hsa_total_excess_contributions",
        "1.line.49_hsa_additional_tax",
      ]),
      ...unsupportedLines(PART_VIII, [
        "1.line.50_able_excess_contributions_2025",
        "1.line.51_able_additional_tax",
      ]),
      ...unsupportedLines(PART_IX, [
        "2.line.52a_minimum_required_distribution_corrected",
        "2.line.52b_minimum_required_distribution_other",
        "2.line.53a_amount_distributed_corrected",
        "2.line.53b_amount_distributed_other",
        "2.line.54a_tax_10_percent_corrected",
        "2.line.54b_tax_25_percent_other",
        "2.line.55_excess_accumulation_additional_tax",
      ]),
      ...unsupportedLines(PREPARER, [
        "2.signing.preparer_self_employed",
        "2.signing.preparer_name",
        "2.signing.preparer_ptin",
        "2.signing.firm_name",
        "2.signing.firm_ein",
        "2.signing.firm_address",
        "2.signing.firm_phone",
      ]),
    },
  });
}
